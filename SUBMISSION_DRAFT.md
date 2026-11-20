# Paket Submission — Circle Agent Marketplace

Status: **TERKIRIM 21 Nov 2026 ±01:25 WIB** atas kata "gas" Sutan (diambil sebagai persetujuan eksekusi).
Konfirmasi Google Forms: "Your response has been recorded." — tanpa nomor referensi.
Dikirim dalam keadaan login ariandikevin7@gmail.com.
Isian final terverifikasi sebelum submit: Email ariandikevin7@gmail.com · Service Name "Mint Safety Verdict" · Website https://mint-safety-verdict.fly.dev · Description sesuai draf di bawah · Primary Service Category "Financial Analysis" (opsi persis FINANCIAL_ANALYSIS tidak ada di formulir) · Number of Endpoints 4 · Pricing Model pay-per-call USDC via x402 ($0,001 /check, $0,05 /verdict, gratis /openapi.json + /health) · Contact Name Kevin Geordio · Endpoints Documentation URL https://mint-safety-verdict.fly.dev/openapi.json · Marketing Authorization **No** (keputusan agent: tidak memberikan hak marketing atas nama Sutan; bisa diubah Sutan lewat trademarks@circle.com) · upload file OpenAPI dilewati (opsional).
CATATAN AUDIT PENTING: formulir ASLI tidak punya kolom alamat wallet payout — alamat lapak 0x71e921baabf0063f24af7c563dbd4bb7cbde9f8a TIDAK terkirim dan tidak diselipkan ke kolom lain. Kemungkinan Circle memintanya pada tahap review.
Status sesudah kirim: menunggu review manual Circle; pantauan kemunculan di katalog + Discovery API berjalan harian.
Formulir: https://forms.gle/7YFzvdmMcn1JH5tF6
Acuan resmi: developers.circle.com/agent-stack/agent-marketplace/get-listed
Isi formulir yang diminta dokumen resmi: endpoint URL, alamat wallet payout, deskripsi singkat.

## Isian yang disiapkan

- **Service name:** Mint Safety Verdict
- **Provider name:** elvinojr
- **Category:** FINANCIAL_ANALYSIS
- **Tags:** bsc, bnb-chain, agent-id, mint, security, sourcify, contract-verification, risk
- **Endpoint base URL:** https://mint-safety-verdict.fly.dev (LIVE, Fly.io app `mint-safety-verdict`, region sin, mode **MAINNET** sejak 21 Nov 2026 ±01:21 WIB, machine msv-main)
- **Payout wallet address:** 0x71e921baabf0063f24af7c563dbd4bb7cbde9f8a (wallet lapak mainnet buatan Sutan sendiri 21 Nov 2026, self-custody; terverifikasi EOA segar nonce 0 di Base/BSC/Ethereum)
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
- [x] Wallet lapak mainnet dibuat Sutan (self-custody), alamatnya dipasang sebagai SELLER_ADDRESS
- [x] Server jalan mode mainnet (CIRCLE_NETWORK=mainnet) + uji 402 mainnet dari luar (payTo = wallet lapak, Base mainnet, tanpa testnet)
- [ ] Uji bayar-sendiri mainnet nominal terkecil (opsional — butuh USDC asli, keputusan Sutan)
- [ ] EKSEKUSI Sutan untuk mengirim formulir
