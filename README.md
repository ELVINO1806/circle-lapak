# Mint Safety Verdict — Circle Agent Marketplace seller (testnet build)

Paid x402 API that sells pre-mint safety verdicts for BSC (chain 56) contracts,
specialised in Binance Agent ID gated mints. Engine adapted from GateRadar v1
(`~/workspace/gateradar/radar/radar.mjs`).

## Endpoints

| Route | Price | What it returns |
| --- | --- | --- |
| `GET /health` | free | service status |
| `GET /openapi.json` | free | OpenAPI 3 spec |
| `GET /check?address=0x...` | $0.001 USDC | Sourcify verification status + dangerous-pattern scan of verified source |
| `POST /verdict` body `{"address":"0x..."}` | $0.05 USDC | Full gate verdict: verified, clean_source, agent_id_gate, supply, radar context; gates that cannot be automated stay UNKNOWN (never faked PASS) |

Payments: Circle Gateway nanopayments via `@circle-fin/x402-batching`
(`createGatewayMiddleware`, `gateway.require(...)`). Unpaid requests get
`402 Payment Required` with a `PAYMENT-REQUIRED` header (x402 v2).

Payment networks are Gateway-supported chains (testnet build: Sepolia, Base
Sepolia, Arc Testnet, etc.). BSC is the *analysis* chain, not a payment chain —
Gateway does not support BSC.

## Run

```bash
npm install
PORT=8402 node server.mjs          # testnet facilitator by default
# mainnet (later): CIRCLE_NETWORK=mainnet SELLER_ADDRESS=0x... node server.mjs
```

Seller address resolution: `SELLER_ADDRESS` env, else the seller address in
`~/.circle-lapak/test-wallets.json` (test wallets; keys live only in that
mode-600 file, never in this repo).

## Self-pay test (testnet)

Buyer wallet needs Arc Testnet USDC from https://faucet.circle.com
(USDC is the native gas token on Arc, so the faucet covers deposit gas too).

```bash
node buyer-test.mjs   # balances -> Gateway deposit 1 USDC if needed -> pay /check and /verdict
```

Exit code 2 with `NEED_FAUCET` means the buyer wallet is unfunded.

## Files

- `server.mjs` — Express app + Gateway middleware + routes
- `gates.mjs` — verdict engine (Sourcify raw endpoint, source scan, Agent ID registry check, on-chain supply, AgenticMint radar lookup)
- `openapi.mjs` — the spec served at `/openapi.json`
- `buyer-test.mjs` — end-to-end self-pay test client

## Hosting (live)

Public URL: **https://mint-safety-verdict.fly.dev** (Fly.io app
`mint-safety-verdict`, org Kevindo Advertise, region sin, machine `msv-1`).
Deployed via the Machines API with the public `node:22` image; the machine
boots by cloning this repo, running `npm ci`, and starting the server
(`fly-deploy.py` in this repo reproduces the launch; `fly.toml` documents the
equivalent flyctl config). Currently running in **testnet** mode with the
test seller wallet. Verified from outside: `/health` 200, `/openapi.json`
200, unpaid routes 402, paid self-pay flow 200 on both paid routes, and the
first settlement batch credited the seller 0.051 testnet USDC.

## Status (21 Nov 2026)

- Local build verified: `/health` 200, `/openapi.json` 200, unpaid `/check`
  returns 402 with amount 1000 ($0.001) and `/verdict` with amount 50000
  ($0.05), `payTo` = test seller wallet, x402Version 2.
- Gate engine verified directly against BSC USDT: verification WARNING
  (Sourcify match, not exact), source PASS, supply PASS, Agent ID gate FAIL
  (correct — USDT is not an Agent ID mint), verdict REJECT for mint purposes.
- End-to-end self-pay PASSED 21 Nov 2026 ±00:57 WIB: faucet 20 testnet USDC → Gateway deposit 1 USDC (tx 0x2587ea42...) → paid /check ($0.001) HTTP 200 → paid /verdict ($0.05) HTTP 200 → buyer Gateway balance exactly 0.949 USDC after.
- Seller side: both transfers recorded by Gateway API with status "received" (amounts 1000 and 50000), txHash still null = batch settlement pending; seller withdrawable balance still 0 until the batch settles onchain. Expected Gateway behaviour, not an error.
- Remaining: public hosting → mainnet seller wallet → marketplace submission (form submit needs the owner's explicit EKSEKUSI).
