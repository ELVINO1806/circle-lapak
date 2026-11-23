---
name: Mint Safety Verdict
version: 1.0.0
description: "Token desain kanonik produk Mint Safety Verdict / GateRadar — diekstrak dari halaman yang sudah live, bukan desain baru. Format mengikuti spesifikasi Google design.md (token YAML normatif + prosa konteks)."
colors:
  background: "#0b0e13"
  surface: "#141a22"
  border: "#26303d"
  text-primary: "#e8ecf1"
  text-muted: "#9aa7b4"
  primary: "#2460e4"
  button-surface: "#1f2937"
  button-border: "#374151"
  on-status: "#ffffff"
  on-status-dark: "#0b0e13"
  status-pass: "#16a34a"
  status-warning: "#d97706"
  status-reject: "#dc2626"
  gate-pass: "#4ade80"
  gate-warning: "#fbbf24"
  gate-fail: "#f87171"
  gate-unknown: "#9aa7b4"
typography:
  font-family: "system-ui, sans-serif"
  display:
    font-size: 24px
    font-weight: 400
  title:
    font-size: 16px
    font-weight: 800
  body:
    font-size: 13px
    line-height: 1.9
  caption:
    font-size: 12px
  badge:
    font-size: 12px
    font-weight: 800
  button:
    font-size: 13px
rounded:
  card: 14px
  button: 8px
  badge: 999px
spacing:
  page-max-width: 860px
  header-padding: "20px 16px 8px"
  main-padding: "12px 16px 40px"
  card-padding: 16px
  card-margin: "12px 0"
  actions-gap: 8px
  button-padding: "8px 14px"
  badge-padding: "4px 11px"
motion: {}
components:
  card:
    background: "{colors.surface}"
    border: "1px solid {colors.border}"
    radius: "{rounded.card}"
    padding: "{spacing.card-padding}"
  badge:
    text: "{colors.on-status}"
    radius: "{rounded.badge}"
    padding: "{spacing.badge-padding}"
  badge-pass:
    background: "{colors.status-pass}"
    text: "{colors.on-status-dark}"
  badge-warning:
    background: "{colors.status-warning}"
    text: "{colors.on-status-dark}"
  badge-reject:
    background: "{colors.status-reject}"
  button:
    background: "{colors.button-surface}"
    text: "{colors.text-primary}"
    border: "1px solid {colors.button-border}"
    radius: "{rounded.button}"
  button-primary:
    background: "{colors.primary}"
    border: "1px solid {colors.primary}"
    font-weight: 700
---

# Mint Safety Verdict — Design System

## Overview

File ini adalah ekstraksi token dari permukaan visual produk yang sudah live, dibuat 21 Nov 2026 mengikuti format Google design.md. Tujuannya satu: setiap halaman berikutnya (lapak NEAR versi mandiri, halaman game, dashboard GateRadar) dibangun dari token yang sama tanpa menebak ulang.

Kejujuran sumber — tiga permukaan produk diperiksa:

- **Endpoint Circle** `https://mint-safety-verdict.fly.dev` hanya menyajikan JSON (root `/` = deskripsi layanan, terverifikasi live 21 Nov 2026). Tidak ada halaman HTML/CSS di sana, dan tidak ada file HTML/CSS/tema di `~/workspace/circle-lapak/` (server.mjs, openapi.mjs, README bersih dari token visual).
- **Landing NEAR** `mint-safety-verdict.market.near.ai` adalah templat SPA milik NEAR AI Agent Market sendiri (CSS bundle platform, font Inter + JetBrains Mono milik platform). Tokennya bukan milik kita, jadi tidak diekstrak.
- **Sumber kanonik token kita = dashboard GateRadar** `~/workspace/gateradar/web/index.html` (blok `<style>` identik dengan `gateradar-live.html`). Dashboard ini menampilkan vonis dari mesin yang sama dengan yang dijual lapak (PASS / WARNING / REJECT + status per gerbang), jadi token di bawah adalah token produk yang benar-benar dipakai.

## Colors

Tema gelap tunggal. Tidak ada mode terang di halaman sumber.

- `background` `#0b0e13` — latar halaman.
- `surface` `#141a22` — latar kartu vonis.
- `border` `#26303d` — garis kartu dan pemisah seksi gerbang.
- `text-primary` `#e8ecf1` — teks utama dan teks tombol.
- `text-muted` `#9aa7b4` — subjudul, meta, alasan gerbang, footer; juga warna status UNKNOWN.
- `primary` `#2460e4` — satu-satunya warna aksi: tombol utama (Watch). Digelapkan dari `#2563eb` pada 22 Nov 2026 khusus agar teks tombol lolos WCAG AA teks normal (lihat tabel kontras).
- `status-*` — latar badge vonis: hijau `#16a34a` (PASS), amber `#d97706` (WARNING), merah `#dc2626` (REJECT); teks badge PASS dan WARNING memakai `on-status-dark` `#0b0e13`, teks badge REJECT tetap `on-status` `#ffffff` (aturan teks badge diubah 22 Nov 2026 demi WCAG AA — lihat tabel kontras).
- `gate-*` — warna teks status per gerbang di atas kartu: `#4ade80` PASS, `#fbbf24` WARNING, `#f87171` FAIL, `#9aa7b4` UNKNOWN. Varian teks ini lebih terang dari varian badge karena dipakai sebagai teks, bukan latar.

### Hasil cek kontras WCAG AA (hitungan manual dari hex, 21 Nov 2026)

Ambang AA: teks normal 4.5:1, teks besar 3.0:1. Teks badge 12px/800 dan teks tombol 13px/700 dihitung sebagai teks normal (bukan teks besar).

| Pasangan | Rasio | AA normal | AA besar |
| --- | --- | --- | --- |
| text-primary di background | 16.29:1 | LOLOS | LOLOS |
| text-primary di surface | 14.74:1 | LOLOS | LOLOS |
| text-muted di background | 7.88:1 | LOLOS | LOLOS |
| text-muted di surface | 7.13:1 | LOLOS | LOLOS |
| gate-pass di surface | 10.04:1 | LOLOS | LOLOS |
| gate-warning di surface | 10.48:1 | LOLOS | LOLOS |
| gate-fail di surface | 6.32:1 | LOLOS | LOLOS |
| teks tombol di button-surface | 12.37:1 | LOLOS | LOLOS |
| on-status di status-reject | 4.83:1 | LOLOS | LOLOS |
| on-status-dark di status-pass | 5.86:1 | LOLOS | LOLOS |
| on-status-dark di status-warning | 6.07:1 | LOLOS | LOLOS |
| text-primary di primary (tombol utama) | 4.58:1 | LOLOS | LOLOS |

Riwayat: pada ekstraksi awal (21 Nov 2026) tiga pasangan GAGAL AA teks normal — teks putih di badge PASS (3.30:1), teks putih di badge WARNING (3.19:1), dan teks tombol utama di `primary` lama `#2563eb` (4.36:1). Diperbaiki di token ini pada 22 Nov 2026: teks badge PASS/WARNING diganti `on-status-dark` `#0b0e13` (5.86:1 dan 6.07:1), dan `primary` digelapkan secukupnya ke `#2460e4` (4.58:1 melawan `text-primary`; 5.43:1 melawan putih murni). Halaman live GateRadar diselaraskan di hari yang sama; halaman turunan wajib mengikuti token ini.

## Typography

Satu keluarga font: `system-ui, sans-serif` — tanpa webfont, tanpa unduhan. Skala kecil dan rapat, sesuai halaman operasional: display 24px (judul), title 16px/800 (nama proyek), body 13px dengan line-height 1.9 khusus daftar gerbang, caption 12px (meta, alasan, footer), badge 12px/800 huruf kapital mengikuti label status.

## Layout

Kolom tunggal terpusat, lebar maksimum 860px. Header ringkas (judul + subjudul + stempel waktu), daftar kartu vertikal, footer satu blok di tengah. Tidak ada grid multi-kolom di halaman sumber.

## Elevation

Tidak ada bayangan sama sekali. Kedalaman dibuat hanya dari perbedaan latar (`surface` di atas `background`) dan garis `border` 1px. Jangan menambah box-shadow di halaman turunan.

## Shapes

Tiga radius saja: kartu 14px, tombol 8px, badge pil penuh 999px. Badge selalu pil — itu penanda status vonis di semua halaman turunan.

## Motion

Tidak ada token motion: halaman sumber tidak memakai transisi atau animasi apa pun. Halaman turunan mengikuti ini secara default; animasi baru harus ditambahkan sebagai token di file ini dulu sebelum dipakai.

## Voice

Bahasa halaman: Inggris, pendek, faktual, tanpa klaim pemasaran. Kalimat kepercayaan ditulis eksplisit di footer (tidak memegang aset user, tidak meminta approval tak terbatas, aksi on-chain selalu dikonfirmasi user di wallet sendiri). Status yang tidak bisa dibuktikan ditulis UNKNOWN, tidak pernah dibulatkan jadi PASS — aturan produk yang sama berlaku di teks halaman.

## Components

- **Card** — satu kartu per proyek/vonis: baris atas (nama + meta di kiri, badge vonis di kanan), daftar gerbang di bawah garis pemisah, baris aksi di dasar kartu.
- **Badge** — pil 999px, teks 12px/800, latar `status-*` sesuai vonis; teks gelap `on-status-dark` untuk PASS dan WARNING, teks putih `on-status` untuk REJECT (demi WCAG AA — lihat tabel kontras). Vonis REJECT menonaktifkan tombol aksi utama dan tombol upvote (opacity .45 pada tombol disabled).
- **Button** — latar `button-surface`, garis `button-border`, radius 8px. Varian `button-primary` memakai `primary` untuk latar dan garis, font-weight 700.
- **Gate row** — ikon status (✅ ⚠️ ⛔ ❔) + label gerbang berwarna `gate-*` + alasan dalam `text-muted` 12px di baris berikutnya.

## Do's and Don'ts

- Pakai token bernama dari file ini; jangan menulis hex baru di halaman turunan.
- Status UNKNOWN selalu `text-muted` — jangan beri warna sendiri.
- Jangan menambah warna status keempat; vonis produk hanya PASS / WARNING / REJECT dan status gerbang hanya PASS / WARNING / FAIL / UNKNOWN.
- Jangan memakai ulang token ini untuk halaman bertema terang tanpa cek kontras ulang — semua rasio di atas dihitung untuk tema gelap.
- Badge PASS dan WARNING serta tombol utama SUDAH diperbaiki di token ini (22 Nov 2026) agar lolos WCAG AA teks normal (lihat tabel); halaman turunan wajib mengambil warna dari token ini — jangan memperbaiki atau mengubahnya diam-diam di CSS halaman.
- Pasangan file GateRadar `web/index.html` dan `web/gateradar-live.html` memuat blok `<style>` yang sama: setiap perubahan warna/token di satu file WAJIB diterapkan juga di file pasangannya pada run yang sama (diselaraskan 22 Nov 2026).
