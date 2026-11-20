// Mint Safety Verdict — gate engine, adapted from GateRadar v1 (~/workspace/gateradar/radar/radar.mjs).
// Read-only checks for a single BSC (chain 56) contract address.
// Honesty rule carried over from GateRadar: a gate only says PASS when its check
// actually ran and passed; gates that cannot be automated generically stay UNKNOWN.

const REGISTRY = "60b9262456de011f7d15a54cdd8c48baaa8b022f"; // official Agent ID registry (no 0x, as in source text)
const RPC = "https://bsc-dataseed.binance.org";
const AGENTICMINT_STATE = "https://agenticmint.ai/api/state";

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

async function ethCall(to, data) {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
    });
    const body = await res.json();
    if (body.result && body.result !== "0x") return BigInt(body.result);
    return null;
  } catch { return null; }
}

// Sourcify: use the RAW endpoint without ?fields= for the match verdict
// (the ?fields= variants are known to return misleading null match values).
async function sourcify(addr) {
  return jget(`https://sourcify.dev/server/v2/contract/56/${addr}`);
}
async function sourcifySources(addr) {
  return jget(`https://sourcify.dev/server/v2/contract/56/${addr}?fields=sources`);
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

async function verifiedAndSource(addr) {
  const sc = await sourcify(addr);
  const match = sc?.match ?? sc?.creationMatch ?? null;
  let verified;
  if (match === "exact_match") verified = { status: "PASS", reason: "Sourcify exact_match" };
  else if (match) verified = { status: "WARNING", reason: `Sourcify match=${match} (not exact)` };
  else if (sc?._http === 404) verified = { status: "FAIL", reason: "Not verified on Sourcify" };
  else verified = { status: "UNKNOWN", reason: `Sourcify check inconclusive (${sc?._http ?? sc?._err ?? "no match field"})` };

  let sourceText = "";
  if (verified.status === "PASS" || verified.status === "WARNING") {
    const src = await sourcifySources(addr);
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

// Optional radar context: is this address currently on the AgenticMint radar?
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
export async function basicCheck(addr) {
  const { verified, sourceText, match } = await verifiedAndSource(addr);
  const clean = scanSource(sourceText);
  return {
    address: addr,
    chain: 56,
    chain_name: "BNB Smart Chain",
    verified: { status: verified.status, sourcify_match: match, reason: verified.reason },
    clean_source: clean,
    checked_at: new Date().toISOString(),
    note: "Basic tier: Sourcify verification + dangerous-pattern scan of verified source only. Full mint verdict: POST /verdict.",
  };
}

// Full verdict ($0.05 tier): every automatable GateRadar gate for one address.
export async function fullVerdict(addr) {
  const gates = {};
  gates.official_channel = { status: "UNKNOWN", reason: "Needs project-site mapping; not generically automatable. Check the project's official site names this contract before minting." };

  const { verified, sourceText } = await verifiedAndSource(addr);
  gates.verified = verified;
  gates.clean_source = scanSource(sourceText);

  gates.price_quote = { status: "UNKNOWN", reason: "Per-project mint quote is not generically automatable; verify the live quote is 0 (or the exact fee) in your wallet before signing." };
  gates.simulation = { status: "UNKNOWN", reason: "Simulation runs at action time with the buyer's own wallet preview." };

  const radar = await radarLookup(addr).catch(() => null);
  if (sourceText && sourceText.toLowerCase().includes(REGISTRY)) {
    gates.agent_id_gate = { status: "PASS", reason: "Verified source references the official Agent ID registry address" };
  } else if (radar?.gated === true) {
    gates.agent_id_gate = { status: "WARNING", reason: "AgenticMint marks it Agent-ID gated, but registry reference not found in verified source (or no source)" };
  } else {
    gates.agent_id_gate = { status: "FAIL", reason: "No Agent ID gate evidence" };
  }

  const ts = await ethCall(addr, "0x18160ddd"); // totalSupply()
  const ms1 = await ethCall(addr, "0xd5abeb01"); // maxSupply() (non-standard, may not exist)
  if (ts !== null) {
    gates.supply = { status: "PASS", reason: `totalSupply on-chain = ${ts.toString()}${ms1 !== null ? `, maxSupply = ${ms1.toString()}` : ""}`, total_supply: ts.toString(), max_supply: ms1 !== null ? ms1.toString() : null };
  } else {
    gates.supply = { status: "UNKNOWN", reason: "totalSupply() not readable with generic call (token-claim style contract)" };
  }

  let verdict = "WARNING";
  if (gates.verified.status === "FAIL" || gates.clean_source.status === "FAIL" || gates.agent_id_gate.status === "FAIL") verdict = "REJECT";
  else if (Object.values(gates).every(g => g.status === "PASS")) verdict = "PASS";

  return {
    address: addr,
    chain: 56,
    chain_name: "BNB Smart Chain",
    name: radar?.name ?? radar?.rewards?.[0]?.symbol ?? null,
    radar: radar ? {
      listed: true,
      list: radar.list,
      score: radar.score ?? null,
      unique_minters: radar.uniq ?? null,
      first_seen: radar.at ? new Date(radar.at).toISOString() : null,
    } : { listed: false },
    gates,
    verdict,
    verdict_explainer: verdict === "REJECT"
      ? "At least one hard gate FAILED (verified / clean_source / agent_id_gate). Do not mint."
      : verdict === "PASS"
        ? "Every gate passed."
        : "No hard FAIL, but one or more gates are UNKNOWN/WARNING. Complete the UNKNOWN checks manually before minting.",
    checked_at: new Date().toISOString(),
  };
}
