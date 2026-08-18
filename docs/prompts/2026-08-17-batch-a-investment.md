# Prompt — Batch A: Investment cluster (bf-z6w → bf-3ai → bf-z65 → bf-aq8)

> Paste ke sesi Claude BARU (Fable). Rename sesi: `/rename bf-z6w batch-a-investment`

---

CONTEXT:
Project prj-better-finance-v2 (Next.js 16 + Supabase + Drizzle). Kamu Claude Fable, eksekusi
langsung (mode B) satu batch penuh, long-horizon. Baca dulu, urut:

1. @CLAUDE.md dan @AGENTS.md — semua rules, pattern, gotcha. Wajib.
2. @docs/architecture-integration.md — model 1-source-of-truth (transaksi → derived).
3. `bd memories bf-z6w` — spec produk investasi dari spreadsheet user (sub-produk, current_value).
4. `bd show bf-z6w`, `bd show bf-3ai`, `bd show bf-z65`, `bd show bf-aq8`.
5. Plan lama: @docs/plans/2026-08-11-bf-z6w-investment-grouping.md dan
   @docs/plans/2026-08-11-bf-3ai-investment-tracker.md — SUDAH USANG sebagian, revisi dulu.

KONDISI DATA SEKARANG (2026-08-17, sudah diverifikasi):
- Net Worth app = spreadsheet (50.831.765). Jangan rusak ini.
- `accounts.current_balance` = MODAL/setoran (dari transaksi). `accounts.current_value` +
  `last_valued_at` = harga pasar — kolom ADA di schema, BELUM dipakai. `investment_group` ada,
  semua NULL.
- Akun investment aktif: BPJS JHT/JP, Emas, USD NVIDIA, Crypto, Saham, Jago, 9 reksadana
  (RDPU/RDPT/RDS + RDPT BNI-AM Ardhani). BNI + Rekapan inactive (jangan sentuh).
- Aset non-liquid punya opening balance manual: transaksi 2026-01-01, source_month
  '2026-Opening', hash `opening-2026-nl-<slug>`. Script migrate PRESERVE ini. Jangan hapus.
- Reksadana: transaksi 2026 OVERSTATED vs nilai riil (mis. Trimegah Kas net_tx 15,3jt vs
  target 8,355jt). Ditutup opening negatif → saldo cocok tapi RAPUH (bf-z65).
- Goal parkir di reksadana (Kontrakan/Qurban/Dana Darurat → Bibit). Total collected goal di
  Bibit = kolom Reksadana spreadsheet (19.187.054). Transfer ke reksadana TIDAK ber-goal_id.
- Migrasi: `pnpm migrate 2026 [--dry]`, natural-key dedup. Lihat AGENTS.md "Migrasi Sheet → DB".

TASK — kerjakan berurutan, jangan lompat:

### 1. bf-z6w — investment grouping + model sub-produk
Revisi plan lama dgn spec baru. Keputusan desain yang HARUS kamu tentukan & tulis di plan
(ini judgment terbesar batch ini — pikirkan matang, ini fondasi 3 issue berikutnya):
- Model sub-produk: 1 akun DB per sub-produk (Emas : Antam 1g, Saham : PGAS, dst — konsisten
  dgn pola nama existing "RDPU : Trimegah Kas") + `investment_group` sbg grup tampilan
  (Reksadana/Emas/Saham/USD/Crypto/BPJS)? Atau tabel terpisah? Pilih yang paling sederhana
  yang menutup spec (ponytail). Rekomendasi awal: akun per sub-produk + investment_group.
- Cara membagi akun agregat existing (Emas 7,83jt → 7 sub; Saham 355,9k → 3 sub) tanpa
  merusak Net Worth: opening-nl per sub-produk, hapus opening agregat lama.
- Net Worth /assets: kartu per grup (Reksadana, Emas, ...) tap → detail sub-produk.
Setelah plan direvisi → tulis ke docs/plans/ (file baru tanggal hari ini) → **STOP, minta
approval user** sebelum eksekusi. Ini satu-satunya checkpoint wajib di batch ini.
Lalu eksekusi penuh: schema (kalau perlu, via MCP better-finance apply_migration → sync
schema.ts), query, actions, hook, UI. Ikuti Page Pattern + UI kit di AGENTS.md.

### 2. bf-3ai — investment tracker: current_value + P&L
Bergantung model dari #1. Isi `current_value` (input manual per sub-produk, `last_valued_at`),
P&L = current_value − current_balance. Tampilkan di /assets. Data awal current_value dari
bd memory (Emas Antam 1g 3.047.000, USD NVIDIA 2.722.106, BPJS JHT 22.479.891, dst).

### 3. bf-z65 — audit reksadana overstated + opening tak rapuh
Dgn model #1 sudah ada: telusuri per akun reksadana kenapa net_tx 2026 >> target. Pisahkan
kemungkinan (withdrawal tak tercatat / salah akun tujuan / transfer goal). Tujuan: opening
reksadana jadi statis/kecil, `pnpm migrate` rutin TIDAK bikin saldo meleset. Kalau butuh data
dari user (mutasi Bibit) → tanya, jangan tebak.

### 4. bf-aq8 — breakdown produk investasi per akun
Kemungkinan sudah tercakup #1+#2. Kalau ya, close dgn catatan; kalau ada sisa, kerjakan.

RULES:
- Ikuti /new-feature-workflow tiap issue: plan file → eksekusi → verifikasi. Plan boleh ringkas
  untuk #2-#4 kalau desain sudah dikunci di #1.
- Server Actions: `requireUser()`, `ServerActionResult`, validasi di server, filter user_id.
- Balance mutation WAJIB `applyTransactionBalancesRpc`. Data seeding sekali-jalan boleh SQL MCP.
- UI wording English. Tailwind v4 (`bg-linear-to-*`, `shrink-0`). Privacy mask di semua saldo.
- JANGAN jalankan `npm run build`/test sendiri — minta user, analisa hasilnya. Wajib lolos
  build sebelum close issue.
- JANGAN commit tanpa approval user. Setelah tiap issue selesai + build lolos: tunjukkan diff
  ringkas → user commit → `bd close <id>`.
- Setiap issue selesai: update AGENTS.md (pattern baru), README.md (fitur user-facing),
  docs/roadmap.md (status). Ketiganya, jangan cuma satu.
- Verifikasi akhir tiap issue: Net Worth masih = spreadsheet (query SUM current_balance
  is_active & include_in_net_worth) — kalau berubah, jelaskan kenapa.
- Kalau ketemu keputusan produk yang bukan wewenangmu (mis. hapus akun, ubah angka user)
  → tanya. Selain itu jalan terus, jangan berhenti tanya hal yang bisa kamu putuskan sendiri.

OUTPUT per issue: "bf-xxx complete: [ringkasan 2-3 baris] · files: [list] · Net Worth: [angka]".

Mulai dari #1: baca semua referensi, lalu revisi plan bf-z6w dan minta approval.
