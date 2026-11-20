# Runbook: Switch ke Mainnet (siap jalan, menunggu alamat lapak + EKSEKUSI)

Status persiapan (21 Nov 2026):
- Mode mainnet SUDAH diverifikasi lokal: server dengan `CIRCLE_NETWORK=mainnet`
  membalas 402 dengan jaringan mainnet asli (Base eip155:8453, Ethereum,
  Arbitrum, Polygon, Arc 5042, dll), amount 1000 ($0,001), payTo benar.
  Facilitator mainnet: https://gateway-api.circle.com (dari konfigurasi SDK).
- Tidak ada uang asli yang bergerak selama verifikasi itu (tidak ada pembayaran).

## Yang dibutuhkan dari Sutan

1. Buat wallet lapak mainnet SENDIRI (self-custody, seed di tangan Sutan).
   Satu alamat EVM berlaku untuk semua chain pembayaran.
2. Kirim ALAMAT PUBLIK-nya saja ke chat ini (jangan pernah kirim seed/private key).
3. Kata EKSEKUSI untuk mengirim formulir listing.

## Langkah agent sesudah alamat diterima

1. Buat machine Fly baru `msv-main` dengan env:
   `CIRCLE_NETWORK=mainnet`, `SELLER_ADDRESS=<alamat lapak>`, `PORT=8080`
   (pakai `fly-deploy.py create msv-main` sesudah env di script disetel,
   atau update config machine lewat Machines API).
2. Verifikasi dari luar: `/health` network=mainnet, `/openapi.json` 200,
   unpaid `/check` + `/verdict` → 402 jaringan mainnet, payTo = alamat lapak.
3. Hancurkan machine testnet (msv-2) supaya satu URL melayani mainnet saja.
4. Perbarui SUBMISSION_DRAFT.md: payout wallet = alamat lapak.
5. (Opsional, keputusan Sutan) Uji bayar-sendiri mainnet: butuh wallet buyer
   berisi USDC asli di Base + sedikit ETH Base untuk deposit Gateway.
   Biaya uji ±$0,051 + gas deposit. TIDAK wajib untuk listing — syarat review
   menurut dokumen resmi: endpoint 402 + OpenAPI + wallet payout.
6. Kirim formulir https://forms.gle/7YFzvdmMcn1JH5tF6 (HANYA atas EKSEKUSI).
7. Pantau katalog + Discovery API sampai listing muncul; lapor ke Sutan.

## Catatan

- Analisis tetap kontrak BSC (chain 56). Yang mainnet di sini adalah
  PEMBAYARANNYA (USDC di Base dan chain Gateway lain), bukan chain analisis.
- Pendapatan mainnet masuk ke Gateway balance wallet lapak; penarikan via
  GatewayClient yang ditandatangani kunci wallet lapak (di tangan Sutan).
