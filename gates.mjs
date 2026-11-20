// Mint Safety Verdict — gate engine, adapted from GateRadar v1 (~/workspace/gateradar/radar/radar.mjs).
// Read-only checks for a single contract address on a supported EVM chain.
// v0.2: multi-chain — BSC 56 (home of the Agent ID specialty), Base 8453,
// Ethereum 1, Arbitrum 42161, Polygon 137. The Agent ID gate and the
// AgenticMint radar only exist on BSC; on other chains the gate is reported
// UNKNOWN with that reason and never influences the verdict.
// Honesty rule carried over from GateRadar: a gate only says PASS when its check
// actually ran and passed; gates that cannot be automated generically stay UNKNOWN.

const REGISTRY = "60b9262456de011f7d15a54cdd8c48baaa8b022f"; // official Agent ID registry on BSC (no 0x, as in source text)
const AGENTICMINT_STATE = "https://agenticmint.ai/api/state";

export const CHAINS = {
  56: { name: "BNB Smart Chain", rpcs: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"] },
  8453: { name: "Base", rpcs: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"] },
  1: { name: "Ethereum", rpcs: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"] },
  42161: { name: "Arbitrum One", rpcs: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"] },
  137: { name: "Polygon PoS", rpcs: ["https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com"] },
};

export function isSupportedChain(chainId) {
  return Object.prototype.hasOwnProperty.call(CHAINS, chainId);
}

// Accepts undefined (default 56), a number, or a numeric string. Returns the
// chain id, or null when the value is present but not a supported chain.
export function parseChain(input) {
  if (input === undefined || input === null || input === "") return 56;
  const n = Number(input);
  if (!Number.isInteger(n)) return null;
  return isSupportedChain(n) ? n : null;
}

async function jget(url, ms = 20000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) return { _http: r.status };
    return await r.json();
  } catch (e) {
    return { _err: String(e).slice(0, 80) };
  } finally { clearTimeout(t); }
}

async function ethCall(to, data, chainId) {
  for (const rpc of CHAINS[chainId].rpcs) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
      });
      const body = await res.json();
      if (body.result && body.result !== "0x") return BigInt(body.result);
      if (body.result === "0x") return null; // call succeeded, empty return
    } catch { /* try next RPC */ }
  }
  return null;
}

// Sourcify: use the RAW endpoint without ?fields= for the match verdict
// (the ?fields= variants are known to return misleading null match values).
async function sourcify(addr, chainId) {
  return jget(`https://sourcify.dev/server/v2/contract/${chainId}/${addr}`);
}
async function sourcifySources(addr, chainId) {
  return jget(`https://sourcify.dev/server/v2/contract/${chainId}/${addr}?fields=sources`);
}

const RISK_PATTERNS = [
  { re: /delegatecall/i, label: "delegatecall present", level: "high" },
  { re: /selfdestruct/i, label: "selfdestruct present", level: "high" },
  { re: /tx\.origin/i, label: "tx.origin used", level: "med" },
  { re: /onlyOwner[^}]*withdraw|withdraw[^}]*onlyOwner/is, label: "owner can withdraw funds", level: "med" },
  { re: /setApprovalForAll\s*\(\s*msg\.sender/i, label: "forced setApprovalForAll pattern", level: "high" },
];

export function isValidAddress(addr) {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

async function verifiedAndSource(addr, chainId) {
  const sc = await sourcify(addr, chainId);
  const match = sc?.match ?? sc?.creationMatch ?? null;
  let verified;
  if (match === "exact_match") verified = { status: "PASS", reason: "Sourcify exact_match" };
  else if (match) verified = { status: "WARNING", reason: `Sourcify match=${match} (not exact)` };
  else if (sc?._http === 404) verified = { status: "FAIL", reason: "Not verified on Sourcify" };
  else verified = { status: "UNKNOWN", reason: `Sourcify check inconclusive (${sc?._http ?? sc?._err ?? "no match field"})` };

  let sourceText = "";
  if (verified.status === "PASS" || verified.status === "WARNING") {
    const src = await sourcifySources(addr, chainId);
    const files = src?.sources ?? {};
    sourceText = Object.values(files).map(f => f?.content ?? "").join("\n");
  }
  return { verified, sourceText, match };
}

function scanSource(sourceText) {
  if (!sourceText) return { status: "UNKNOWN", reason: "No verified source to scan" };
  const hits = RISK_PATTERNS.filter(p => p.re.test(sourceText));
  const high = hits.filter(h => h.level === "high");
  if (high.length) return { status: "FAIL", reason: "High-risk patterns: " + high.map(h => h.label).join("; ") };
  if (hits.length) return { status: "WARNING", reason: "Flags: " + hits.map(h => h.label).join("; ") };
  return { status: "PASS", reason: "No dangerous patterns from the v1 scan list found in verified source" };
}

// Optional radar context (BSC only): is this address on the AgenticMint radar?
let radarCache = { at: 0, byAddr: new Map() };
async function radarLookup(addr) {
  const now = Date.now();
  if (now - radarCache.at > 5 * 60 * 1000) {
    const state = await jget(AGENTICMINT_STATE, 15000);
    const byAddr = new Map();
    if (state && !state._http && !state._err) {
      for (const listName of ["free", "twoPhase", "paid"]) {
        for (const e of state[listName] ?? []) {
          if (e.addr) byAddr.set(e.addr.toLowerCase(), { ...e, list: listName });
        }
      }
    }
    radarCache = { at: now, byAddr };
  }
  return radarCache.byAddr.get(addr.toLowerCase()) ?? null;
}

// Basic check ($0.001 tier): verification status + dangerous-pattern scan only.
export async function basicCheck(addr, chainId = 56) {
  const { verified, sourceText, match } = await verifiedAndSource(addr, chainId);
  const clean = scanSource(sourceText);
  return {
    address: addr,
    chain: chainId,
    chain_name: CHAINS[chainId].name,
    verified: { status: verified.status, sourcify_match: match, reason: verified.reason },
    clean_source: clean,
    checked_at: new Date().toISOString(),
    note: "Basic tier: Sourcify verification + dangerous-pattern scan of verified source only. Full verdict: POST /verdict.",
  };
}

// Full verdict ($0.05 tier): every automatable GateRadar gate for one address.
export async function fullVerdict(addr, chainId = 56) {
  const isBsc = chainId === 56;
  const gates = {};
  gates.official_channel = { status: "UNKNOWN", reason: "Needs project-site mapping; not generically automatable. Check the project's official site names this contract before minting." };

  const { verified, sourceText } = await verifiedAndSource(addr, chainId);
  gates.verified = verified;
  gates.clean_source = scanSource(sourceText);

  gates.price_quote = { status: "UNKNOWN", reason: "Per-project mint quote is not generically automatable; verify the live quote is 0 (or the exact fee) in your wallet before signing." };
  gates.simulation = { status: "UNKNOWN", reason: "Simulation runs at action time with the buyer's own wallet preview." };

  const radar = isBsc ? await radarLookup(addr).catch(() => null) : null;
  if (!isBsc) {
    gates.agent_id_gate = { status: "UNKNOWN", reason: `Agent ID gate exists only on BNB Smart Chain (56); not applicable to ${CHAINS[chainId].name} (${chainId})` };
  } else if (sourceText && sourceText.toLowerCase().includes(REGISTRY)) {
    gates.agent_id_gate = { status: "PASS", reason: "Verified source references the official Agent ID registry address" };
  } else if (radar?.gated === true) {
    gates.agent_id_gate = { status: "WARNING", reason: "AgenticMint marks it Agent-ID gated, but registry reference not found in verified source (or no source)" };
  } else {
    gates.agent_id_gate = { status: "FAIL", reason: "No Agent ID gate evidence" };
  }

  const ts = await ethCall(addr, "0x18160ddd", chainId); // totalSupply()
  const ms1 = await ethCall(addr, "0xd5abeb01", chainId); // maxSupply() (non-standard, may not exist)
  if (ts !== null) {
    gates.supply = { status: "PASS", reason: `totalSupply on-chain = ${ts.toString()}${ms1 !== null ? `, maxSupply = ${ms1.toString()}` : ""}`, total_supply: ts.toString(), max_supply: ms1 !== null ? ms1.toString() : null };
  } else {
    gates.supply = { status: "UNKNOWN", reason: "totalSupply() not readable with generic call (token-claim style contract)" };
  }

  let verdict = "WARNING";
  const hardFail = gates.verified.status === "FAIL" || gates.clean_source.status === "FAIL" || (isBsc && gates.agent_id_gate.status === "FAIL");
  if (hardFail) verdict = "REJECT";
  else if (Object.values(gates).every(g => g.status === "PASS")) verdict = "PASS";

  return {
    address: addr,
    chain: chainId,
    chain_name: CHAINS[chainId].name,
    name: radar?.name ?? radar?.rewards?.[0]?.symbol ?? null,
    radar: radar ? {
      listed: true,
      list: radar.list,
      score: radar.score ?? null,
      unique_minters: radar.uniq ?? null,
      first_seen: radar.at ? new Date(radar.at).toISOString() : null,
    } : { listed: false, ...(isBsc ? {} : { note: "AgenticMint radar covers BNB Smart Chain only" }) },
    gates,
    verdict,
    verdict_explainer: verdict === "REJECT"
      ? (isBsc
        ? "At least one hard gate FAILED (verified / clean_source / agent_id_gate). Do not mint."
        : "At least one hard gate FAILED (verified / clean_source). Do not mint.")
      : verdict === "PASS"
        ? "Every gate passed."
        : "No hard FAIL, but one or more gates are UNKNOWN/WARNING. Complete the UNKNOWN checks manually before minting.",
    checked_at: new Date().toISOString(),
  };
}
