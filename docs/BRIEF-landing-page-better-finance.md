# BRIEF: Landing Page — Better Finance

> File ini dibuat untuk diserahkan ke Claude Code di mesin lokal.
> Isinya: hasil riset kompetitor, blueprint struktur halaman, arahan desain & copy, dan checklist.
>
> **Cara pakai:** letakkan file ini di root project, lalu buka Claude Code dan mulai dengan:
> `Baca BRIEF-landing-page-better-finance.md. Kerjakan BAGIAN 0 dulu — tanyakan ke saya semua yang belum terisi sebelum menulis kode apa pun.`

---

## BAGIAN 0 — YANG BELUM DIPUTUSKAN (WAJIB DIISI SEBELUM CODING)

Bagian ini sengaja dikosongkan. **Jangan menebak, jangan mengarang.** Tanyakan ke pemilik project, tunggu jawabannya, tulis jawabannya kembali ke file ini, baru mulai bekerja.

| # | Pertanyaan | Jawaban |
|---|---|---|
| 1 | Better Finance ini untuk **siapa** secara spesifik? (satu persona, bukan "semua orang") | _(kosong)_ |
| 2 | Masalah nomor satu yang dirasakan persona itu — pakai kalimat yang benar-benar mereka ucapkan | _(kosong)_ |
| 3 | Satu hal yang Better Finance lakukan dan **tidak** dilakukan ketiga kompetitor | _(kosong)_ |
| 4 | Daftar fitur yang **sudah jadi** hari ini (bukan roadmap) | _(kosong)_ |
| 5 | Model harga: sekali bayar / langganan / freemium? Berapa? | _(kosong)_ |
| 6 | Sudah punya pengguna nyata / testimoni / angka? Kalau belum, apa yang dipakai sebagai bukti? | _(kosong)_ |
| 7 | Bentuk aplikasinya: PWA, native, atau web? Ini menentukan section "Cara Install" | _(kosong)_ |
| 8 | Sumber traffic utama: TikTok/IG organik, iklan berbayar, SEO, atau word of mouth? | _(kosong)_ |
| 9 | CTA akhirnya ke mana: checkout, form WA, atau signup gratis? | _(kosong)_ |
| 10 | Sudah ada logo, warna, atau nama domain final? | _(kosong)_ |

**Aturan main:** kalau pertanyaan 1–3 belum terjawab, halaman ini tidak bisa dibuat dengan benar — yang jadi hanyalah versi keempat dari kompetitor yang sudah ada. Positioning menentukan hero, hero menentukan sisanya.

---

## BAGIAN 1 — KONTEKS PRODUK

- **Nama:** Better Finance
- **Kategori:** aplikasi pencatatan keuangan pribadi/keluarga, pasar Indonesia
- **Tujuan halaman:** satu halaman, satu pekerjaan — mengubah pengunjung dingin dari media sosial menjadi pembeli/pendaftar dalam satu kali scroll.
- **Bahasa:** Bahasa Indonesia sehari-hari (bukan bahasa korporat, bukan Inggris campur berlebihan)
- **Prioritas perangkat:** mobile-first mutlak. Asumsikan >85% traffic dari HP.

### Stack yang dipakai
- Next.js 15 (App Router) + React 19
- Tailwind CSS
- Static/SSG — halaman ini tidak butuh server rendering dinamis
- Deploy: Vercel

---

## BAGIAN 2 — ANALISA KOMPETITOR

Tiga kompetitor langsung, sudah dibedah dari sisi copy maupun visual.

### 2.1 CatatBareng — `amia.my.id/catetbareng`

| Aspek | Temuan |
|---|---|
| Target | Pasangan suami-istri |
| Sudut emosional | Konflik rumah tangga soal uang → transparansi berdua |
| Hero | "Pernah ribut kecil soal uang sama pasangan?" |
| Diferensiasi | Dua akun, data satu keluarga, sinkron real-time |
| Harga | Rp89rb/tahun (dicoret dari Rp149rb) + bonus 1,5 tahun → framing "Rp2.966/bulan" |
| Bukti sosial | Screenshot chat WhatsApp asli sebagai gambar testimoni |
| Senjata konversi | Bonus 4 kalkulator perencanaan (gaji, dana pendidikan, rumah, pensiun) |

**Visual:** background krem hangat, aksen hijau tua, satu section gelap navy sebagai pemecah ritme. Heading pakai serif klasik + body sans — kontras ini yang bikin terasa "hangat keluarga", bukan "startup". Kartu masalah berwarna pink lembut, kartu solusi hijau. Ikon = emoji, bukan icon set. Ada tabel perbandingan "Cara lama vs CatatBareng" yang efektif karena menyebut nama alternatif nyata (Notes HP, Spreadsheet, Bot Telegram).

**Kelemahan yang bisa dimanfaatkan:** layout terkunci di lebar mobile — dibuka di desktop jadi kolom sempit dengan margin kosong sangat lebar, terasa murah. Halaman sangat panjang dan padat; section bonus kalkulator hampir sepanjang produk utamanya sendiri sehingga fokus pecah. Model harga per tahun sementara dua pesaing lain sekali bayar.

### 2.2 KasRumah — `duitplan.id/kasrumah`

| Aspek | Temuan |
|---|---|
| Target | Ibu rumah tangga / bendahara keluarga, gaptek |
| Sudut emosional | "Capek dituduh boros, padahal kamu paling hemat serumah" → butuh **bukti** |
| Diferensiasi | Sesederhana mungkin: dua tombol, rekap sekali tekan kirim ke WA suami |
| Harga | Rp99.000 sekali bayar, tanpa biaya bulanan |
| Bukti sosial | Tidak ada testimoni sama sekali — pakai *authority transfer*: "dari pembuat CariStok & CariHPP, dipakai 5.400+ pemilik usaha" |
| Senjata konversi | 3 ebook untuk "10 pembeli pertama" + kalkulasi kebocoran (Rp20rb/hari = Rp7,3jt/tahun) |

**Visual:** paling rapi dari sisi disiplin. Hijau tua + oranye/amber sebagai satu-satunya aksen aksi, background krem. Sans-serif membulat, ukuran font besar — konsisten dengan janji "buat yang gaptek". Trio statistik di hero (5 detik / Rp99rb / 3 ebook) langsung menjawab tiga keberatan sekaligus. Mockup aplikasinya bisa di-scroll di dalam frame HP, dengan instruksi "geser layarnya ke atas" — ini elemen terkuat di seluruh halaman karena pengunjung *memegang* produknya sebelum bayar.

**Kelemahan yang bisa dimanfaatkan:** sama seperti CatatBareng, lebar terkunci mobile. `noindex,nofollow` — sepenuhnya bergantung traffic berbayar/sosial, tidak main SEO. Nol testimoni pengguna nyata. Segmen sangat sempit (ibu rumah tangga), tidak melayani individu.

### 2.3 Fundy — `fundy.id`

| Aspek | Temuan |
|---|---|
| Target | Individu melek digital, usia muda, urban |
| Sudut emosional | "Uangmu gahabis karena boros, tapi karena gatau larinya kemana" |
| Diferensiasi | Input lewat chat, suara, dan scan struk — AI yang merangkum otomatis |
| Harga | Rp139.000 sekali bayar (dari Rp278rb) + asisten AI Rp39rb/bulan setelah 30 hari |
| Bukti sosial | Klaim 10k+ pengguna, marquee testimoni dua arah, avatar dicebear (jelas bukan foto asli) |
| Fitur | Jauh terlengkap: multi akun, investasi & aset, debt manager, tagihan, kalender, tema, cloud sync |

**Visual:** satu-satunya yang benar-benar desktop-ready. Header sticky dengan nav, putih bersih, hijau sebagai aksen gradient pada potongan headline. Hero pakai device fan-out — satu HP di tengah, beberapa layar melayang di belakangnya. Section fitur berupa daftar accordion di kiri + preview layar di kanan. Pricing pakai tab toggle (Fundy+ / Pro+).

**Kelemahan yang bisa dimanfaatkan:** paling generik secara emosional — visualnya bisa dipakai SaaS apa pun. Avatar testimoni jelas generated, email disamarkan, sehingga bukti sosialnya justru terasa paling lemah meski jumlahnya paling banyak. Model harga paling membingungkan (sekali bayar tapi asisten mati setelah 30 hari). Fitur sangat banyak → risiko pengguna awam merasa kewalahan.

---

## BAGIAN 3 — POLA PASAR & CELAH

### Pola yang dipakai ketiganya (ikuti — ini sudah terbukti di pasar ini)
1. Hero adalah **kalimat rasa sakit**, bukan deskripsi fitur. Tidak satu pun membuka dengan "aplikasi pencatat keuangan terbaik".
2. Section kedua selalu "kamu pernah ngalamin ini?" — daftar 4 keluhan spesifik. Pengunjung harus mengangguk minimal sekali sebelum sampai ke harga.
3. Cara kerja disederhanakan jadi **3 langkah**, dengan janji waktu ("5 detik").
4. Mockup HP berisi angka rupiah realistis dan kategori khas Indonesia (SPP, kondangan, arisan, qurban, token listrik). Bukan "Groceries $45".
5. Harga di bawah Rp150rb, sekali bayar lebih disukai, dibandingkan dengan pengeluaran sehari-hari agar terasa murah.
6. PWA — "nggak perlu install dari Play Store" dijual sebagai keunggulan, bukan disembunyikan sebagai keterbatasan.
7. Ada mekanisme urgensi (promo periode ini / 10 pembeli pertama).
8. Satu CTA yang sama diulang 2–3 kali sepanjang halaman.

### Celah yang belum diisi siapa pun
- **Desktop yang layak.** Dua dari tiga rusak di layar lebar. Pengguna yang menerima link dari WA lalu membuka di laptop akan langsung meragukan kredibilitasnya.
- **Demo yang benar-benar bisa dicoba.** KasRumah baru sebatas mockup yang bisa di-scroll. Belum ada yang membiarkan pengunjung mencatat satu transaksi palsu langsung di landing page.
- **Bukti sosial yang jujur.** Semua lemah di sini: gambar screenshot, avatar generated, atau tidak ada sama sekali. Testimoni asli dengan nama dan konteks nyata akan langsung unggul.
- **Kejelasan soal data & privasi.** Cuma disinggung sekilas di FAQ. Padahal ini keberatan besar saat orang menyerahkan angka gaji ke aplikasi buatan indie developer.
- **Segmen di luar tiga ini:** freelancer/pekerja lepas dengan penghasilan tidak tetap, pedagang kecil yang uang usaha dan uang pribadinya tercampur, anak kos/mahasiswa, atau pengelolaan keuangan syariah.

> Catatan untuk Claude lokal: jangan otomatis mengambil salah satu celah di atas. Semua ini bahan diskusi — keputusan ada di pemilik project (lihat BAGIAN 0 pertanyaan 1–3).

---

## BAGIAN 4 — BLUEPRINT STRUKTUR HALAMAN

Urutan di bawah adalah rekomendasi, bukan harga mati. Setiap section punya **satu** tugas. Kalau ada section yang tugasnya tidak jelas, buang.

| # | Section | Tugas | Catatan |
|---|---|---|---|
| 1 | Hero | Membuat orang berhenti scroll dan merasa "ini gue" | Satu kalimat rasa sakit + satu kalimat solusi + satu CTA. Tanpa nav yang mengalihkan. |
| 2 | Bukti cepat | Mengurangi kecurigaan dalam 3 detik | Trio angka (misal: waktu input / harga / jumlah pengguna) — pola KasRumah, paling efisien |
| 3 | Pengakuan masalah | Membuat pengunjung mengangguk | 3–4 keluhan, kalimat langsung dari mulut persona. Bukan parafrase sopan. |
| 4 | Cara kerja | Menghilangkan rasa "pasti ribet" | Tepat 3 langkah, ada janji waktu konkret |
| 5 | Demo / mockup | Membiarkan orang "memegang" produk | Elemen terkuat halaman ini. Kalau bisa interaktif, jangan cuma gambar. Isi dengan data & kategori Indonesia yang realistis. |
| 6 | Fitur | Menjawab "apa aja yang saya dapat" | Maksimal 5–6. Tulis sebagai manfaat, bukan nama fitur. |
| 7 | Penanganan keberatan | Membunuh alasan untuk tidak beli | Pilih keberatan yang nyata: gaptek, data aman nggak, pasangan mau ikut nggak, kalau berhenti bayar data hilang nggak |
| 8 | Bukti sosial | Meyakinkan lewat orang lain | Kalau belum ada pengguna, **jangan mengarang**. Pakai bukti lain: jumlah unduhan, cerita pembuatan produk, atau jaminan uang kembali. |
| 9 | Harga | Menutup transaksi | Satu paket saja kalau memungkinkan. Bandingkan dengan pengeluaran harian. Sebutkan yang tidak ada (biaya tersembunyi, langganan). |
| 10 | FAQ | Menangkap keraguan sisa | 5–7 pertanyaan. Wajib ada: cara install, keamanan data, refund, dukungan bantuan. |
| 11 | CTA penutup | Kesempatan terakhir | Ulangi CTA yang sama persis dengan hero |

**Mobile:** CTA sticky di bawah setelah pengunjung melewati hero. Ini yang tidak dilakukan ketiga kompetitor.

---

## BAGIAN 5 — ARAHAN COPYWRITING

- Tulis seperti mengobrol, bukan seperti brosur. "Uangnya ke mana ya?" mengalahkan "optimalkan pengelolaan finansial Anda".
- Spesifik selalu menang atas pintar. "Rp65.000 buat sayur sama ayam di pasar" lebih kuat dari "catat pengeluaran harianmu".
- Angka rupiah harus masuk akal untuk kelas menengah Indonesia. Gaji Rp4,5jt, belanja dapur Rp2,3jt, jajan anak Rp5.000.
- Tombol menyebutkan apa yang terjadi setelah diklik. "Mulai catat sekarang" bukan "Submit" atau "Learn more".
- Jangan menjanjikan fitur yang belum ada. Kalau belum ada, jangan ditulis.
- Hindari klaim tanpa dasar ("aplikasi keuangan terbaik", "dipercaya ribuan orang") kalau belum ada datanya.

---

## BAGIAN 6 — ARAHAN VISUAL

**Yang harus dihindari — ini yang bikin halaman terlihat seperti buatan AI atau template:**
- Krem `#F4F1EA` + serif tebal + aksen terracotta `#D97757`. Kombinasi ini sudah jadi default; langsung ketahuan.
- Background hitam dengan satu aksen hijau neon.
- Gradient ungu-biru pada heading.
- Emoji sebagai pengganti ikon di semua tempat (CatatBareng melakukan ini dan hasilnya terasa murah pada layar besar).
- Section yang semuanya berpola sama: eyebrow kecil → heading tengah → tiga kartu. Ulangi tiga kali dan halaman terasa dihasilkan mesin.

**Yang harus dilakukan:**
- Tentukan palet 4–6 warna dengan nilai hex eksplisit sebelum menulis CSS, lalu turunkan semua warna dari situ. Perhatikan bahwa **ketiga kompetitor memakai hijau** — memilih hijau berarti langsung tenggelam.
- Pasangkan dua typeface dengan peran jelas: satu display berkarakter (dipakai hemat), satu body yang enak dibaca pada ukuran besar. Uji di lebar 360px sebelum apa pun.
- Pilih **satu** elemen tanda tangan yang akan diingat orang — kandidat terkuat di kategori ini adalah demo pencatatan yang benar-benar bisa dicoba. Habiskan keberanian desain di satu tempat itu, sisanya buat tenang.
- Desktop harus benar-benar dirancang, bukan kolom mobile yang dibiarkan mengambang di tengah. Ini pembeda paling murah dari dua kompetitor.
- Animasi secukupnya: reveal saat scroll pada mockup dan satu momen di hero sudah cukup. Hormati `prefers-reduced-motion`.

---

## BAGIAN 7 — SYARAT TEKNIS

- Skor Lighthouse mobile ≥90 pada Performance dan Accessibility
- LCP <2,5 detik pada 4G — hero image dioptimasi lewat `next/image`, font di-preload
- Metadata lengkap: title, description, OG image 1200×630, twitter card, canonical, locale `id_ID`
- `robots: index, follow` (kecuali diputuskan jalur berbayar saja)
- Data terstruktur JSON-LD `SoftwareApplication` + `FAQPage`
- Semantic HTML, satu `<h1>`, focus state terlihat, kontras minimal AA
- Event analytics pada setiap klik CTA, dibedakan per posisi (hero / tengah / harga / penutup / sticky)
- Tanpa dependensi berat: tidak perlu library animasi besar untuk halaman satu ini

---

## BAGIAN 8 — CHECKLIST SELESAI

- [ ] BAGIAN 0 sudah terisi dan ditulis ulang ke file ini
- [ ] Hero bisa dipahami dalam 3 detik oleh orang yang belum pernah dengar Better Finance
- [ ] Tidak ada klaim, angka, atau testimoni yang tidak nyata
- [ ] Setiap section bisa dijelaskan tugasnya dalam satu kalimat
- [ ] Rapi di 360px, 768px, dan 1440px — desktop dirancang, bukan diregangkan
- [ ] CTA sama persis di semua posisi, mengarah ke satu tujuan
- [ ] Palet dan typeface tidak jatuh ke daftar "hindari" di BAGIAN 6
- [ ] Tidak memakai hijau sebagai warna utama tanpa alasan yang bisa dipertahankan
- [ ] Lighthouse mobile dicek, bukan diasumsikan
- [ ] Sudah dibaca ulang keras-keras: kalau ada kalimat yang tidak mungkin diucapkan manusia, tulis ulang
