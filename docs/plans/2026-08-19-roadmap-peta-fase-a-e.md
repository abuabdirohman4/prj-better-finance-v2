# Peta Roadmap Better Finance v2 — 2026-08-19

## Context

Batch investasi (bf-z6w ✅, bf-v4r ✅) baru selesai. 19 issue open tersisa, tersebar di 5 klaster, sebagian punya plan+prompt siap Antigravity sejak 2026-08-11. User minta pemetaan urutan seluruh issue + sub-issue yang bakal muncul, sebelum lanjut eksekusi.

**Keputusan user (2026-08-19):**
- Target: **ganti spreadsheet secepatnya, pakai harian** → prioritas = integritas data + kenyamanan input harian. Import historis & landing belakangan.
- Landing (bf-3mb): setelah investasi + onboarding user baru beres.
- Eksekutor: **Antigravity paralel** untuk issue yang plan-nya siap, Claude review batch. Claude direct hanya untuk yang sentuh data / butuh judgment.
- Data Bibit untuk audit reksadana: belum tahu → audit dirancang 2 jalur.

**Insight kunci:** "ganti spreadsheet" = suatu saat `pnpm migrate` **berhenti**, app jadi sumber kebenaran. Maka bf-z65 berubah dari "opening tahan migrate rutin" (sulit, derived) jadi **"rekonsiliasi sekali di titik cutover"** (mudah: opening statis = saldo riil Bibit saat cutover). Perlu 1 issue baru: **Cutover checklist**.

---

## Urutan Fase (rekomendasi)

### Fase A — Investasi tuntas · Claude direct (sesi ini + 1 sesi audit)
| # | Issue | Eksekutor | Sesi | Catatan |
|---|---|---|---|---|
| A1 | **bf-3ai** current_value + P&L | Claude | sesi ini (lanjutan batch-a) | butuh kolom Current Value dari sheet (screenshot kepotong). Net Worth tetap modal-based; market value + P&L tampil terpisah di `/assets` + `/assets/[group]` |
| A2 | **bf-aq8** breakdown produk | — | — | close dgn catatan "ter-cover z6w+3ai" setelah A1 |
| A3 | **bf-m2s** alur tambah produk | Antigravity (plan Claude) | plan di sesi ini, review terpisah | kecil: tombol Add product di `/assets/[group]`, field Group jadi SingleSelect existing + new |
| A4 | **bf-z65** audit reksadana | Claude | **sesi sendiri** `bf-z65 bugfix-audit-reksadana` | 2 jalur: (a) ada mutasi Bibit → cocokkan per transfer; (b) cuma saldo → cari dobel/salah akun di DB, sisa selisih jadi opening statis + catatan. Hipotesis awal: penarikan/pemakaian goal dari Bibit tak tercatat sebagai keluar dari reksadana (reksadana tak pernah jadi source di 2026: 0 transfer keluar, cuma 14 spending kecil). **Sebaiknya setelah bf-dac** (list transaksi per akun bantu audit) |

### Fase B — Input harian nyaman · Antigravity paralel, Claude review batch
Plan+prompt sudah ada semua (2026-08-11). Urutan menghindari konflik file:
| # | Issue | Files | Review batch | Catatan |
|---|---|---|---|---|
| B0 | **bf-alx** rename `/assets` → `/net-worth` | mekanis | gabung B1 | **kerjakan SEBELUM dac** (dac nambah href ke halaman ini). Setelah Fase A selesai (3ai sentuh `/assets`) |
| B1 | **bf-dac** account detail → list transaksi | 5 | `review-accounts-ux` (alx+dac+uaw) | universal termasuk AR/AP + sub-produk investasi (`/assets/[group]` tap produk → transaksi). Prasyarat audit z65 |
| B1 | **bf-uaw** sort order akun | 3 | ↑ | |
| B2 | **bf-6rl** goal account_id + pre-fill | 7 | `review-goals-budget` (6rl+ayj) | migration ✅. Nyambung investasi: goal per sub-produk (USD→Pendidikan SD, BPJS→Pensiun) = isi `savings_goals.account_id` ke akun sub-produk. **Cek plan lama masih valid vs model sub-produk** sebelum paste ke Antigravity |
| B2 | **bf-ayj** budget_period | 5 | ↑ | migration ✅. Kebiasaan nyata user: gaji tgl 25 untuk bulan depan. Sentuh query budget — review teliti |
| B3 | **bf-9vf** settings + privacy persist | 5 | `review-settings` atau gabung B1 | plan 2026-07-22, cek masih valid |
| B3 | **bf-7m3** edit tipe akun | 1-2 | gabung mana saja | belum ada plan; kecil |

### Fase C — Cutover: berhenti pakai spreadsheet · Claude (data) + Antigravity (form)
| # | Issue | Catatan |
|---|---|---|
| C1 | **BARU: alur tarik/jual investasi** | Cair 1,2jt dari modal 1jt = 2 baris (transfer 1jt modal + earning 200rb untung). Tanpa bantuan form, user pasti salah catat → saldo investasi minus. Form: mode "Withdraw" → input nilai cair + pilih produk → auto-split transfer + earning/spending. Depends 3ai (tahu modal per produk). Brainstorm dulu. |
| C2 | **BARU: cutover checklist** | Task interaktif Claude: (1) migrate final, (2) reconcile SEMUA akun vs Summary sheet + saldo riil (Bibit/bank), (3) opening reksadana statis (hasil z65), (4) freeze sheet, (5) tandai tanggal cutover di bd memory + roadmap. Setelah ini `pnpm migrate` tidak dipakai lagi kecuali import historis (4m1/noo, yang tidak sentuh 2026). |
| C3 | **bf-kvk** goal reality check | Depends 6rl. Setelah cutover baru berguna (data harian sudah dari app). |

### Fase D — Historis + insight · Claude interaktif
| # | Issue | Catatan |
|---|---|---|
| D1 | **bf-noo** import budget historis | 1 script, plan ✅ |
| D2 | **bf-4m1** import 2025 | plan ✅, interaktif dry-run. Format AKTIVA/PASIVA beda. Aset non-liquid 2025 → opening `opening-2025-nl-*` per sub-produk (pola z6w) |
| D3 | **bf-gv5** CFP insights | **brainstorm** (fitur AI, tabel ai_insights ada). Baru bermakna setelah D1+D2 |

### Fase E — Publik · Antigravity
| # | Issue | Catatan |
|---|---|---|
| E1 | **BARU: onboarding + empty state user baru** | App dibangun di atas data user sendiri. User baru: `/assets` kosong, tak ada produk investasi, tak ada goal. Butuh: empty state tiap halaman + CTA "add first X", seed default sudah ada (trigger `seed_defaults_for_new_user`) — cek cukup. **Wajib sebelum landing.** Brainstorm scope. |
| E2 | **bf-bp5** i18n pass | keputusan: hardcode EN dulu vs next-intl. Setelah semua fitur EN-first (sudah aturan). |
| E3 | **bf-lp4** cursor-pointer | batch polish |
| E4 | **bf-qxb** UI kit lengkap | on-demand — jangan dikerjakan sekaligus, ambil komponen saat fitur butuh |
| E5 | **bf-3mb** landing | plan+prompt ✅ Antigravity. Terakhir. |
| E6 | **BARU: README** | chore, tulis ulang boilerplate → deskripsi produk + setup |

---

## Sub-issue baru yang akan di-create (saat approve)

| Judul | Type | P | Fase | Depends |
|---|---|---|---|---|
| feat: alur tarik/jual investasi (auto-split modal + untung/rugi) | feature | 2 | C1 | bf-3ai |
| task: cutover checklist — berhenti spreadsheet, app jadi sumber kebenaran | task | 2 | C2 | bf-z65, bf-dac |
| feat: onboarding + empty state user baru | feature | 2 | E1 | — (sebelum bf-3mb) |
| chore: README tulis ulang | chore | 3 | E6 | — |

Dependency yang ditambah: bf-z65 ← bf-dac (soft, urutan) · bf-kvk ← bf-6rl · bf-3mb ← onboarding · bf-aq8 ← bf-3ai (close setelah).

## Topik brainstorm (pakai `superpowers:brainstorming` saat sampai)
1. **C1 withdraw flow** — UX form, realized gain = earning kategori apa, rugi = spending kategori apa, efek ke goal collected.
2. **z65 root cause** — setelah lihat data Bibit / list transaksi per akun (dac).
3. **E1 onboarding** — scope minimal vs wizard.
4. **D3 gv5 CFP** — apa yang dihitung, AI atau rule-based dulu.
5. **ayj budget_period** — validasi plan lama sebelum Antigravity.

## Deferred (tidak jadi issue, YAGNI)
- Riwayat current_value (bisa reuse `account_balance_snapshots` kalau nanti perlu grafik).
- Emas detail berat/karat, multi-lot.
- Group "Other"/reorder grup di Net Worth.

---

## Aksi saat approve (keluar plan mode)
1. `bd close bf-z6w` (build lolos, sudah di-push user).
2. `bd create` 4 issue baru + `bd dep add` sesuai tabel.
3. Update `docs/roadmap.md`: tabel "Kerjaan Aktif" jadi per-fase (A–E) + kolom Eksekutor/Sesi; parkiran dibersihkan; changelog.
4. Update bd memory `bf-z6w-investment-detail` → status z6w done + keputusan cutover.
5. Lanjut A1 (bf-3ai) — minta kolom Current Value.

## Verifikasi
- `bd ready` menampilkan urutan yang masuk akal (A1 dulu, tak ada blocked palsu).
- roadmap.md tabel aktif konsisten dengan beads (setiap issue open ada di salah satu fase).
