# Konsep Sistem Keuangan (Better Finance)

> **Tujuan file ini:** menjelaskan konsep pencatatan keuangan di balik Better Finance — dari akar akuntansinya sampai implementasi di Google Sheet (v1) dan aplikasi (v2). Dipakai untuk onboarding AI/developer/siapa pun tanpa perlu jelaskan dari nol.

---

## 1. Akar: 3 Laporan Keuangan dalam 1 Sistem

Sistem ini diadaptasi dari **kursus keuangan bisnis** yang mensyaratkan 3 laporan keuangan standar:

1. **Arus Kas (Cash Flow)** — uang masuk/keluar dari pos kas
2. **Laba Rugi (Income Statement)** — pendapatan vs beban → laba bersih
3. **Neraca (Balance Sheet)** — posisi Aktiva vs Passiva pada satu titik

Inovasi sistem ini: **satu sheet transaksi menghubungkan ketiganya sekaligus.** Setiap baris transaksi otomatis mengisi pos-pos yang relevan di ketiga laporan, menjaga persamaan akuntansi dasar:

```
AKTIVA = LIABILITAS + EKUITAS
(Assets)  (Liability)  (Equity)
```

Ini **double-entry accounting** — tiap transaksi menyentuh minimal 2 pos, dan kedua sisi persamaan selalu seimbang.

Awalnya dirancang untuk bisnis. Diadaptasi ke keuangan pribadi: kolom `Inventory` dihapus (tak relevan personal), ditambah `Investment` & `Saving` (kebutuhan tabungan pribadi).

---

## 2. Anatomi Kolom Transaksi (Google Sheet v1)

Tiap sheet bulanan (tab `Jan`–`Dec`) punya header:

```
Date | Transaction | Account | Category | Note | Wallet | ATM | Platform | Investment | Saving | AR | AP | NP | OI | RE | NET
```

### Kolom identitas
| Kolom | Arti |
|---|---|
| `Date` | Tanggal transaksi |
| `Transaction` | Tipe: `Earning` / `Spending` / `Transfer` |
| `Account` | Akun sumber (Wallet, Mandiri, BNI, Bibit, Jago, ...) |
| `Category` | Kategori (House, Transport, Salary, ...); untuk transfer bisa nama akun/tujuan |
| `Note` | Keterangan bebas |

### Kolom pos (bucket) — di sinilah akuntansinya

**AKTIVA (Assets) — apa yang dimiliki:**
| Kolom | Singkatan | Arti |
|---|---|---|
| `Wallet` | — | Kas tunai fisik |
| `ATM` | — | Saldo rekening bank utama (transaksional) |
| `Platform` | — | Saldo e-wallet/platform (GoPay, OVO, dll) |
| `Investment` | — | Tabungan jangka panjang (reksadana, saham, emas — Bibit/Reku/Ajaib) |
| `Saving` | — | Tabungan likuid (cepat cair — dulu BNI, sekarang Jago) |
| `AR` | Account Receivable | Piutang (uang yang akan diterima, mis. reimburse) |

**PASSIVA = Liabilitas + Ekuitas — sumber dana:**
| Kolom | Singkatan | Kelompok | Arti |
|---|---|---|---|
| `AP` | Account Payable | Liabilitas | Utang usaha (akan dibayar) |
| `NP` | Notes Payable | Liabilitas | Utang wesel/pinjaman formal |
| `OI` | Origin Investment | Ekuitas | Modal awal yang disetor |
| `RE` | Retained Earnings | Ekuitas | Laba ditahan (akumulasi) |
| `NET` | Net Profit | Ekuitas | Laba bersih periode |

### Cara satu transaksi mengisi kolom (contoh nyata)

| Transaction | Account | Category | Wallet | Investment | Saving | RE | NET |
|---|---|---|---|---|---|---|---|
| Transfer (JHT ke BPJS TK) | Mandiri | Investment | -231630 | +231630 | | | |
| Earning (Salary) | Mandiri | Salary | +11581500 | | | +11581500 | +11581500 |
| Spending (Groceries) | Wallet | Food | -50000 | | | | -50000 |

Baris 1: uang pindah dari kas (`Wallet -`) ke investasi (`Investment +`) — aktiva geser, total aktiva tetap.
Baris 2: pendapatan → kas naik + ekuitas (RE/NET) naik.

---

## 3. Turunan: Semua Laporan = Agregasi Kolom

Karena tiap transaksi sudah mengisi pos yang benar, **semua laporan lain tinggal menjumlahkan kolom**:

| Laporan / View | Cara hitung |
|---|---|
| **Saldo akun (Summary)** | `SUM` kolom pos untuk tiap akun sepanjang tahun |
| **Assets** | Saldo akun dikelompokkan: liquid (Wallet/ATM/Platform/Saving) vs non-liquid (Investment, Emas, BPJS) |
| **Goals** (`Collected`) | `SUM` transaksi ber-`Account`+`Category` tertentu yang masuk pos `Saving`/`Investment` |
| **Budget** | `SUM` per `Category` per bulan |
| **Arus Kas** | Perubahan pos kas (Wallet/ATM/Platform) |
| **Laba Rugi** | Pos `RE` / `NET` / `OI` |
| **Neraca** | Snapshot semua Aktiva vs Passiva pada satu titik waktu |

**Satu source of truth (transaksi ber-pos) → semua laporan derived.** Ini keunggulan utama sistem.

---

## 4. Konsep Tabungan: Saving vs Investment

| | **Saving** | **Investment** |
|---|---|---|
| Tujuan | Jangka pendek-menengah, dana siap pakai | Jangka panjang |
| Likuiditas | Cepat cair | Cair lambat (butuh beberapa hari) |
| Tempat | Bank (dulu BNI, sekarang **Jago** — punya kantong terpisah) | Bibit, Reku, Ajaib (reksadana/saham/emas) |

**Kantong (Jago) / tujuan tabungan (Bibit):** satu rekening bisa memuat banyak tujuan. Contoh: rekening Jago berisi kantong "Kontrakan", "Qurban", "Dana Darurat". Uang bisnis pun kini disimpan di kantong Jago terpisah.

- Mau tahu **total 1 akun** (Jago/Bibit) → langsung dari saldo akun.
- Mau tahu **per tujuan** → lihat daftar tabungan/goal di akun itu.

---

## 5. Implementasi di Aplikasi (v2)

Sistem sheet dipindah ke database (Postgres/Drizzle). Prinsip akuntansi **dipertahankan**, tapi disederhanakan untuk UX personal.

### Pemetaan konsep → v2

| Konsep sheet | v2 |
|---|---|
| Kolom pos (Wallet/ATM/...) | `accounts` + `accounts.current_balance` (live dari transaksi via RPC) |
| Baris transaksi | tabel `transactions` |
| Goal (kantong/tujuan) | `savings_goals` dengan `linked_account_id` (akun tempat disimpan) |
| Goal `Collected` | `SUM(transactions WHERE goal_id = X)` — derived, bukan input manual |
| Assets | agregat `accounts.current_balance` per `asset_category` (liquid/non-liquid) |
| Budget | sudah ada — SUM per category per bulan |
| Pos equity/liability (OI/RE/AP/NP) | **disimpan sebagai fondasi laten** — belum ditampilkan di UI personal, dibuka nanti untuk laporan bisnis |

### Model "kantong = Goal" (keputusan v2)

- **1 akun** Jago/Bibit → total nilai = `current_balance`.
- **Banyak goal** dengan `linked_account_id` sama = kantong/tujuan.
- `SUM(collected goal di akun X) ≈ current_balance akun X` → built-in reality check (selisih = dana belum dialokasi).

### Alur transfer ke goal (UX simpel)

1. Buat goal → set `linked_account_id` (akun tempat disimpan).
2. Input transaksi **Transfer** → dropdown tujuan dikelompokkan:
   ```
   AKUN
     Mandiri, BCA, Jago, ...
   GOALS
     Kontrakan (→ Jago), Qurban (→ Bibit), ...
   ```
3. Pilih **Akun** = transfer biasa. Pilih **Goal** = app otomatis transfer ke `goal.linked_account_id` + set `transactions.goal_id`. Satu klik, dua hal tercatat.

---

## 6. Visi Produk: 1 Produk Berlapis (Personal → Bisnis)

Sistem ini secara struktur **sudah** memakai kerangka akuntansi bisnis, walau dipakai personal. Maka arahnya:

**Satu produk, satu codebase, berlapis (progressive disclosure):**

```
Better Finance
├── Core: transactions + accounts (mesin double-entry, disembunyikan)
├── Personal mode (default): dashboard, goals, assets, budget — simpel
└── Business mode (tier Pro/Business): buka Arus Kas + Laba Rugi + Neraca
    dari data transaksi yang SAMA
```

- **Bukan 2 produk terpisah** — akuntansinya satu, cuma beda kedalaman tampilan. Memisah = duplikasi mesin sama + 2x maintenance.
- **Bukan full-accounting untuk semua** — user personal awam tak mau lihat debit/credit/Notes Payable.
- Business reports = fitur tier berbayar → monetisasi natural (sesuai rencana tier free/pro/family).

**Konsekuensi desain:** skema `transactions` harus menyimpan cukup info untuk rekonstruksi neraca nanti (jangan buang konsep OI/RE/AP/NP), walau UI personal tidak menampilkannya. Fondasi laten, dibuka saat mode bisnis aktif.

---

## 7. Sharing: Shared Ledger + Keuangan Pribadi (Household)

**Kasus nyata:** suami & istri. Prinsip _"uang suami = uang istri, uang istri = uang istri"_ → istri boleh akses & kelola keuangan suami (shared), tapi punya keuangan sendiri (private) yang tidak otomatis diakses suami.

Jadi ini **bukan sekadar multi-user** — tapi **shared ledger dengan audit trail**.

### Model konseptual

```
User A (suami) ──owns──> Ledger "Keuangan Suami" ──shared with──> User B (istri, role: editor)
User B (istri) ──owns──> Ledger "Keuangan Istri"  (private, tidak di-share)
```

- **Ledger / workspace** = wadah data keuangan (accounts, transactions, goals, budget). Satu user bisa punya/akses beberapa ledger.
- **Kepemilikan (owner)** — pembuat ledger, kontrol penuh (termasuk hapus & atur akses).
- **Membership + role** — user lain diundang ke ledger dengan peran:
  - `owner` — penuh
  - `editor` — baca + tulis (input/edit transaksi, goal, dll)
  - `viewer` — baca saja
- **Audit trail** — tiap mutasi (create/edit/delete transaksi, goal, akun) tercatat **siapa** & **kapan** & **apa yang diubah**. Penting untuk shared ledger — tahu istri input transaksi mana, suami edit yang mana.

### Konsekuensi arsitektur (untuk dicatat, belum implementasi)

Saat ini semua tabel scoped ke `user_id`. Untuk sharing, perlu bergeser ke scope **`ledger_id` / `workspace_id`**, dengan tabel membership yang memetakan `user_id` → `ledger_id` + `role`. Ini perubahan fundamental — makanya **ditulis sekarang sebagai kebutuhan**, supaya keputusan skema ke depan mempertimbangkannya sejak awal (mis. jangan hard-code asumsi 1 user = 1 dataset).

Selaras dengan rencana komersial: **sharing = fitur tier Family** (roadmap: free/pro/family).

> Status: **konsep / ditunda.** Fokus sekarang tetap personal single-user. Tapi keputusan skema besar (mis. reimplement goals/assets) sebaiknya tidak menutup pintu ke model ledger ini.

---

## Lampiran: Struktur File Google Sheet v1

- 1 file spreadsheet = 1 tahun. Ganti URL/ID tiap tahun baru.
- Format machine-readable (mudah di-fetch API) sejak **2025**. Data 2024 ke bawah belum disesuaikan formatnya.
- Tab: `Jan`–`Dec` (transaksi bulanan), `Summary`, `Assets`, `Goals`, `Budget`, `Account`/`Data` (config range-mapping).
- Fetch via gviz endpoint (sheet share publik):
  ```
  https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<NamaTab>
  ```
