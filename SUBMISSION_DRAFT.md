# Paket Submission — Circle Agent Marketplace (DRAF, belum dikirim)

Status: DRAF. Pengiriman formulir menunggu EKSEKUSI Sutan.
Formulir: https://forms.gle/7YFzvdmMcn1JH5tF6
Acuan resmi: developers.circle.com/agent-stack/agent-marketplace/get-listed
Isi formulir yang diminta dokumen resmi: endpoint URL, alamat wallet payout, deskripsi singkat.

## Isian yang disiapkan

- **Service name:** Mint Safety Verdict
- **Provider name:** elvinojr
- **Category:** FINANCIAL_ANALYSIS
- **Tags:** bsc, bnb-chain, agent-id, mint, security, sourcify, contract-verification, risk
- **Endpoint base URL:** https://mint-safety-verdict.fly.dev (LIVE sejak 21 Nov 2026 ±01:06 WIB, Fly.io app `mint-safety-verdict`, region sin, masih mode TESTNET dengan wallet seller uji)
- **Payout wallet address:** `<WALLET LAPAK MAINNET — menunggu Sutan buat sendiri>` (sementara uji testnet: 0x79d8E04dB4cb31F6dA2F02f6AdB4FB38e0A8AA54)
- **OpenAPI spec URL:** https://mint-safety-verdict.fly.dev/openapi.json
- **Website/docs:** `<URL PUBLIK>/health` + repo/README (menyesuaikan hosting)

## Deskripsi singkat (buat formulir)

Mint Safety Verdict is a pay-per-call API that returns a pre-mint safety verdict for BNB Smart Chain (chain 56) contracts, specialised in Binance Agent ID gated mints. The $0.001 basic check returns Sourcify verification status (raw-endpoint exact_match) plus a dangerous-pattern scan of the verified source. The $0.05 full verdict adds Agent ID gate evidence (official registry reference in source), on-chain supply, and AgenticMint radar context (score, unique minters, first seen). Gates that cannot be automated are reported as UNKNOWN, never as PASS. Payments in USDC via x402 (Circle Gateway nanopayments).

## Endpoints yang didaftarkan

| Method & path | Price | Input | Output |
| --- | --- | --- | --- |
| GET /check?address=0x... | $0.001 | BSC contract address | verified status + sourcify_match + clean_source gate |
| POST /verdict {"address":"0x..."} | $0.05 | BSC contract address | gates{} + radar{} + verdict (PASS/WARNING/REJECT) + explainer |
| GET /openapi.json | free | — | OpenAPI 3.0.3 spec |
| GET /health | free | — | { ok, service, network, seller } |

## Bukti uji (testnet, 21 Nov 2026)

- Unpaid /check → 402 + PAYMENT-REQUIRED, amount 1000 ($0.001), payTo = seller.
- Unpaid /verdict → 402, amount 50000 ($0.05).
- Faucet: 20 testnet USDC ke buyer (Arc Testnet), tx 0x128c3ad87408cd5aff3801fff4a1158362a44882b8a89ebb48c05df38385c783.
- Deposit 1 USDC ke Gateway, tx 0x2587ea42cc905f264eb6f0025423ad02f736dd18d904781d848e1cb312a102c8.
- Bayar /check → HTTP 200 + data. Bayar /verdict → HTTP 200 + data.
- Saldo Gateway buyer sesudah: 0.949 USDC (1 − 0.001 − 0.05, persis).
- Saldo Gateway seller: dicek berkala (settlement batch Gateway — kredit penjual muncul sesudah batch settle, bukan seketika).

## Checklist sebelum submit

- [x] Hosting publik 24/7 live + /health 200 dari luar (Fly.io, 21 Nov 2026)
- [x] OpenAPI spec URL publik bisa diakses
- [x] Uji bayar-sendiri di URL publik lolos (HTTP 200 dua rute; settlement batch pertama masuk ke seller 0,051 USDC testnet)
- [ ] Wallet lapak mainnet dibuat Sutan (self-custody), alamatnya dipasang sebagai SELLER_ADDRESS
- [ ] Server jalan mode mainnet (CIRCLE_NETWORK=mainnet) + uji 402 mainnet
- [ ] Uji bayar-sendiri mainnet nominal terkecil (butuh USDC mainnet kecil — keputusan Sutan)
- [ ] EKSEKUSI Sutan untuk mengirim formulir
