// Mint Safety Verdict — Circle Agent Marketplace seller server (TESTNET build).
// Pricing: GET /check $0.001 · POST /verdict $0.05 · /openapi.json and /health free.
// Payments: Circle Gateway nanopayments (x402) via @circle-fin/x402-batching.
// sellerAddress comes from SELLER_ADDRESS env, else the local test wallet file.

import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { basicCheck, fullVerdict, isValidAddress } from "./gates.mjs";
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
    description: "Pay-per-call pre-mint safety verdicts for BNB Smart Chain (chain 56) contracts, specialised in Binance Agent ID gated mints. Payments in USDC via x402 (Circle Gateway nanopayments).",
    network: networkMode,
    endpoints: {
      "GET /check?address=0x...": { price_usdc: 0.001, returns: "Sourcify verification status + dangerous-pattern scan of verified source" },
      "POST /verdict": { price_usdc: 0.05, body: { address: "0x..." }, returns: "Full gate verdict (verified, clean_source, agent_id_gate, supply, radar context). Gates that cannot be automated are reported as UNKNOWN, never PASS." },
      "GET /openapi.json": { price_usdc: 0, returns: "OpenAPI 3 spec" },
      "GET /health": { price_usdc: 0, returns: "Service status" },
    },
    analysis_chain: "BNB Smart Chain (56)",
    payment_asset: "USDC via Circle Gateway (x402)",
    seller: sellerAddress,
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "mint-safety-verdict", network: networkMode, seller: sellerAddress, checked_at: new Date().toISOString() });
});

app.get("/openapi.json", (req, res) => res.json(openapi));

app.get("/check", gateway.require("$0.001"), async (req, res) => {
  const address = req.query.address;
  if (!isValidAddress(address)) return res.status(400).json({ error: "Query param 'address' must be a 0x-prefixed 40-hex contract address (BSC, chain 56)." });
  try {
    res.json(await basicCheck(address));
  } catch (e) {
    res.status(502).json({ error: "Check failed upstream", detail: String(e).slice(0, 200) });
  }
});

app.post("/verdict", gateway.require("$0.05"), async (req, res) => {
  const address = req.body?.address ?? req.query.address;
  if (!isValidAddress(address)) return res.status(400).json({ error: "Body {address} must be a 0x-prefixed 40-hex contract address (BSC, chain 56)." });
  try {
    res.json(await fullVerdict(address));
  } catch (e) {
    res.status(502).json({ error: "Verdict failed upstream", detail: String(e).slice(0, 200) });
  }
});

const port = Number(process.env.PORT ?? 8402);
app.listen(port, () => {
  console.log(`mint-safety-verdict listening on :${port} | network=${networkMode} facilitator=${facilitatorUrl} seller=${sellerAddress}`);
});
