// Mint Safety Verdict — Circle Agent Marketplace seller server.
// Pricing: GET /check $0.001 · POST /verdict $0.05 · /openapi.json and /health free.
// Payments: Circle Gateway nanopayments (x402) via @circle-fin/x402-batching.
// Network mode from CIRCLE_NETWORK env (testnet|mainnet).
// sellerAddress comes from SELLER_ADDRESS env, else the local test wallet file.
// Analysis chains (v0.2): BSC 56, Base 8453, Ethereum 1, Arbitrum 42161, Polygon 137.

import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { basicCheck, fullVerdict, isValidAddress, parseChain, CHAINS } from "./gates.mjs";
import { openapi } from "./openapi.mjs";

const FACILITATOR_TESTNET = "https://gateway-api-testnet.circle.com";
const FACILITATOR_MAINNET = "https://gateway-api.circle.com";

function loadSellerAddress() {
  if (process.env.SELLER_ADDRESS) return process.env.SELLER_ADDRESS;
  const p = process.env.HOME + "/.circle-lapak/test-wallets.json";
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, "utf8")).seller.address; } catch {}
  }
  return null;
}

const sellerAddress = loadSellerAddress();
if (!sellerAddress) {
  console.error("No seller address: set SELLER_ADDRESS or create ~/.circle-lapak/test-wallets.json");
  process.exit(1);
}

const networkMode = (process.env.CIRCLE_NETWORK ?? "testnet").toLowerCase();
const facilitatorUrl = process.env.FACILITATOR_URL ?? (networkMode === "mainnet" ? FACILITATOR_MAINNET : FACILITATOR_TESTNET);

const gateway = createGatewayMiddleware({ sellerAddress, facilitatorUrl });

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Mint Safety Verdict",
    provider: "elvinojr",
    description: "Pay-per-call token safety check and pre-mint safety verdict for smart contracts on BNB Smart Chain (56), Base (8453), Ethereum (1), Arbitrum (42161) and Polygon (137), specialised in Binance Agent ID gated mints on BSC. Sourcify contract verification plus a dangerous-pattern scan (delegatecall, selfdestruct, forced approvals, owner withdrawal). Payments in USDC via x402 (Circle Gateway nanopayments).",
    network: networkMode,
    endpoints: {
      "GET /check?address=0x...&chain=56": { price_usdc: 0.001, returns: "Sourcify verification status + dangerous-pattern scan of verified source. Query param chain is optional (default 56)." },
      "POST /verdict": { price_usdc: 0.05, body: { address: "0x...", chain: 56 }, returns: "Full gate verdict (verified, clean_source, agent_id_gate on BSC, supply, radar context on BSC). Gates that cannot be automated are reported as UNKNOWN, never PASS. Body field chain is optional (default 56)." },
      "GET /openapi.json": { price_usdc: 0, returns: "OpenAPI 3 spec" },
      "GET /health": { price_usdc: 0, returns: "Service status" },
    },
    analysis_chains: Object.entries(CHAINS).map(([id, c]) => `${c.name} (${id})`),
    payment_asset: "USDC via Circle Gateway (x402)",
    seller: sellerAddress,
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "mint-safety-verdict", version: "0.2.0", network: networkMode, seller: sellerAddress, chains: Object.keys(CHAINS).map(Number), checked_at: new Date().toISOString() });
});

app.get("/openapi.json", (req, res) => res.json(openapi));

const SUPPORTED = Object.keys(CHAINS).join(", ");

app.get("/check", gateway.require("$0.001"), async (req, res) => {
  const address = req.query.address;
  if (!isValidAddress(address)) return res.status(400).json({ error: "Query param 'address' must be a 0x-prefixed 40-hex contract address." });
  const chainId = parseChain(req.query.chain);
  if (chainId === null) return res.status(400).json({ error: `Unsupported chain '${req.query.chain}'. Supported chain ids: ${SUPPORTED}.` });
  try {
    res.json(await basicCheck(address, chainId));
  } catch (e) {
    res.status(502).json({ error: "Check failed upstream", detail: String(e).slice(0, 200) });
  }
});

app.post("/verdict", gateway.require("$0.05"), async (req, res) => {
  const address = req.body?.address ?? req.query.address;
  if (!isValidAddress(address)) return res.status(400).json({ error: "Body {address} must be a 0x-prefixed 40-hex contract address." });
  const chainId = parseChain(req.body?.chain ?? req.query.chain);
  if (chainId === null) return res.status(400).json({ error: `Unsupported chain '${req.body?.chain ?? req.query.chain}'. Supported chain ids: ${SUPPORTED}.` });
  try {
    res.json(await fullVerdict(address, chainId));
  } catch (e) {
    res.status(502).json({ error: "Verdict failed upstream", detail: String(e).slice(0, 200) });
  }
});

export default app;
