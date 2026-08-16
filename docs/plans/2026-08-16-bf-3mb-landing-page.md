# Plan: Landing Page Better Finance

**Beads:** bf-3mb  
**Tanggal:** 2026-08-16  
**Estimasi:** ~15 file baru, >100 baris — Mode A (Antigravity)

---

## Context

Better Finance belum punya landing page. Brief: `docs/BRIEF-landing-page-better-finance.md`.

**Positioning (FINAL — dari sesi planning 2026-08-16):**
- **Persona:** individu perencana serius (mau lihat net worth LENGKAP, bukan sekadar catat pengeluaran).
- **Diferensiasi:** "Net worth utuh, bukan cuma catat" — BF satu-satunya gabung rekening + investasi + aset non-liquid (emas/BPJS/JHT) + piutang/utang + goals + wishlist jadi 1 angka. 3 kompetitor berhenti di transaction-logging. Semua klaim = fitur SHIPPED.
- **Harga:** GRATIS DULU (bayar nanti). CTA "Coba gratis sekarang" → `/signup`. Urgensi jujur: "daftar sekarang dapat harga khusus kelak".
- **Bukti sosial:** belum ada user → cerita pembuat / jaminan. JANGAN ngarang avatar/angka.
- **Privasi:** SKIP di v1.
- **PWA:** manifest ada (installable). Klaim "gak perlu Play Store". JANGAN klaim offline (no SW).
- **Bahasa:** Indonesia sehari-hari (pengecualian dari aturan UI-English-first proyek).

**Visual — "Ink & Paper" (dipilih owner):**
```
BG:      #FFFFFF / #F7F8FA
INK:     #0F172A
ACCENT:  #2563EB (blue-600) + #4F46E5 (indigo)
MUTED:   #64748B
BORDER:  #E2E8F0
Font display: Space Grotesk (next/font/google)
Font body:    Inter (sudah ada)
```
- JANGAN hijau (3 kompetitor semua hijau).
- JANGAN: krem+serif+terracotta, gradient ungu-biru, emoji-as-icon, eyebrow→heading→3-kartu berulang.
- Desktop DIRANCANG (celah vs kompetitor).

**Signature element:** kartu Net Worth interaktif di hero — toggle chip, angka + bar liquid/non-liquid berubah live, data dummy client-side.

---

## Routing Architecture

**Temuan verified di codebase:**
- `src/app/(app)/page.tsx` = route `/` sekarang (dashboard, `"use client"`).
- `(app)/layout.tsx` TIDAK punya auth guard — auth di data layer via `requireUser()`.
- **Tidak ada root `middleware.ts` aktif.** `src/lib/supabase/middleware.ts` (`updateSession`) belum di-wire. ⚠️ Kalau kelak diaktifkan, `/` publik akan ke-redirect → harus tambah `/` ke allowlist.
- Tidak ada `middleware.ts` di `src/`.

**Keputusan:**
1. `/` → landing publik (baru, SSG).
2. Dashboard pindah: `src/app/(app)/page.tsx` → `src/app/(app)/dashboard/page.tsx` (URL `/dashboard`).
3. Fix semua link internal yang hardcode `/` sebagai dashboard → `/dashboard`.
4. Landing: CTA → `/signup`, ada link "Buka Dashboard" → `/dashboard` (untuk yang sudah login).

---

## File Structure

```
src/app/
  page.tsx                              # Landing (SSG, Server Component)
  (marketing)/
    _components/
      Hero.tsx
      NetWorthDemo.tsx                  # "use client" — signature interaktif
      QuickProof.tsx
      ProblemSection.tsx
      HowItWorks.tsx
      FeaturesSection.tsx
      ObjectionSection.tsx
      SocialProof.tsx
      PricingSection.tsx
      FaqSection.tsx
      FinalCta.tsx
      StickyCta.tsx                     # "use client" — sticky mobile CTA
      landing.data.ts                   # semua copy + dummy data terpusat
  (app)/
    dashboard/
      page.tsx                          # dashboard dipindah ke sini
```

---

## Tasks

### Task 1 — Pindah dashboard `/` → `/dashboard`

```bash
mkdir -p "src/app/(app)/dashboard"
git mv "src/app/(app)/page.tsx" "src/app/(app)/dashboard/page.tsx"
```

Fix import relatif di `src/app/(app)/dashboard/page.tsx`:
- `./accounts/...` → `../accounts/...`
- `./_hooks/...` → `../_hooks/...`
- `./accounts/_components/AccountCard` → `../accounts/_components/AccountCard`

Cari & fix semua link internal dashboard:
```bash
grep -rn 'href="/"\|push("/")\|redirect("/")' src/components/layouts src/app/(auth)
```
Ganti yang bermaksud "ke dashboard" → `/dashboard`. Cek khusus:
- `src/components/layouts/BottomNav.tsx` — home link
- `src/app/(auth)/signin/actions.ts` atau redirect setelah login sukses

Verifikasi: `npm run build` lolos.

### Task 2 — Setup font Space Grotesk + design tokens

`src/app/layout.tsx`:
```typescript
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

// pada <html>: className={`${inter.variable} ${spaceGrotesk.variable}`}
// pada <body>: className={inter.className} (body tetap Inter)
```

`src/app/globals.css` — tambah CSS vars (Tailwind v4, pakai `@theme` atau arbitrary):
```css
:root {
  --ink: #0F172A;
  --accent: #2563EB;
  --accent-2: #4F46E5;
  --muted: #64748B;
  --line: #E2E8F0;
  --paper: #FFFFFF;
  --paper-2: #F7F8FA;
}
```

Tambah utility di globals.css:
```css
.font-display { font-family: var(--font-display), sans-serif; }
```

### Task 3 — `landing.data.ts`

Buat `src/app/(marketing)/_components/landing.data.ts`. Semua copy Indonesia + dummy data terpusat.

**Wajib export:**
```typescript
// CTA (sama semua posisi)
export const CTA = { label: "Coba gratis sekarang", href: "/signup" } as const;

// Hero
export const hero = {
  pain: "Tiap bulan kerja keras, tapi nggak pernah tahu kekayaanmu naik atau turun.",
  solution: "Better Finance nyatuin rekening, investasi, aset, sampai utang jadi satu angka net worth — update tiap kamu catat.",
};

// Net Worth Demo — data dummy khas Indonesia
export const netWorthBase = {
  accounts: [
    { label: "Wallet", amount: 1_850_000, type: "liquid" as const },
    { label: "Mandiri", amount: 12_300_000, type: "liquid" as const },
    { label: "GoPay", amount: 450_000, type: "liquid" as const },
  ],
};

export const netWorthToggles = [
  { id: "reksadana", label: "Reksadana", delta: 8_500_000, type: "nonliquid" as const, icon: "+" },
  { id: "emas", label: "Emas", delta: 12_000_000, type: "nonliquid" as const, icon: "+" },
  { id: "cicilan", label: "Cicilan HP", delta: -1_200_000, type: "liability" as const, icon: "−" },
];

// Fungsi pure (testable)
export function computeNetWorth(
  base: typeof netWorthBase,
  activeIds: Set<string>
): { total: number; liquid: number; nonliquid: number } {
  const liquid = base.accounts.reduce((s, a) => s + a.amount, 0);
  const nonliquidDelta = netWorthToggles
    .filter(t => activeIds.has(t.id) && t.type !== "liability")
    .reduce((s, t) => s + t.delta, 0);
  const liabilityDelta = netWorthToggles
    .filter(t => activeIds.has(t.id) && t.type === "liability")
    .reduce((s, t) => s + t.delta, 0);
  return {
    total: liquid + nonliquidDelta + liabilityDelta,
    liquid,
    nonliquid: nonliquidDelta,
  };
}

// Quick proof (3 angka jujur — BUKAN jumlah user)
export const quickProof = [
  { value: "11", label: "fitur siap pakai" },
  { value: "Gratis", label: "selamanya untuk versi dasar" },
  { value: "<5 detik", label: "catat satu transaksi" },
];

// Problems — kalimat persona asli
export const problems = [
  "Gaji masuk, tiba-tiba habis, tapi nggak tahu ke mana.",
  "Punya rekening, reksadana, emas — tapi nggak tahu total kekayaan itu berapa.",
  "Sudah pakai spreadsheet, tapi males update manual setiap hari.",
  "Goals nabung ada, tapi nggak tahu udah cukup belum buat beli itu.",
];

// How it works — 3 langkah + janji waktu
export const steps = [
  { n: "1", title: "Daftar, gratis", desc: "Buat akun dalam 30 detik. Langsung pakai, tanpa install." },
  { n: "2", title: "Catat akun & transaksi", desc: "Tambah rekening, investasi, dan aset kamu. Catat tiap transaksi < 5 detik." },
  { n: "3", title: "Lihat net worth kamu", desc: "Semua tergabung jadi satu angka. Tahu kamu maju atau mundur, real-time." },
];

// Features — manfaat (SEMUA shipped)
export const features = [
  { title: "Satu angka net worth", desc: "Rekening, reksadana, emas, BPJS, cicilan — semua masuk, satu hasil." },
  { title: "Lacak investasi & aset", desc: "Bukan cuma rekening. Emas, reksadana, dan aset non-liquid lain punya tempatnya." },
  { title: "Goals yang nyambung ke saldo", desc: "Nabung buat liburan atau DP rumah — tahu udah cukup belum dari uang bebas real." },
  { title: "Wishlist affordability", desc: "Item impian kamu dicek otomatis: uang bebas cukup buat beli, atau belum?" },
  { title: "Budget bulanan & mingguan", desc: "Atur anggaran per kategori, pantau minggu per minggu biar nggak boros di awal bulan." },
  { title: "Langsung pakai dari HP", desc: "Nggak perlu install dari Play Store. Tambah ke home screen, beres." },
];

// Objections — keberatan nyata
export const objections = [
  {
    q: "Ribet nggak nyettingnya?",
    a: "Tambah akun 1 menit. Catat transaksi pertama < 5 detik. Nggak ada konfigurasi panjang.",
  },
  {
    q: "Data keuanganku aman?",
    a: "Data kamu tersimpan di server, login pakai email pribadi. Nggak ada iklan, nggak dijual ke siapapun.",
  },
  {
    q: "Kalau nanti berbayar, data ku gimana?",
    a: "Yang daftar sekarang dapat harga khusus. Datamu tetap ada — bisa export kapan saja.",
  },
  {
    q: "Beda apa sama spreadsheet?",
    a: "Spreadsheet kamu update manual, gak ngitung net worth, gak tahu affordability wishlist. BF lakuin itu semua otomatis.",
  },
];

// Social proof — jujur, tanpa ngarang
export const socialProof = {
  type: "builder" as const,
  title: "Dibuat karena frustrasi yang sama",
  body: "Better Finance dibuat oleh satu orang yang capek buka 4 aplikasi untuk tahu kekayaan sendiri — satu untuk rekening, satu untuk investasi, satu untuk goals, satu untuk budget. Sekarang semua ada di satu tempat.",
  guarantee: "Coba gratis — kalau nggak suka, tinggalkan. Tanpa kartu kredit, tanpa trik.",
};

// Pricing — jujur
export const pricing = {
  headline: "Gratis sekarang.",
  subline: "Yang daftar di fase awal ini dapat harga khusus saat kami rilis versi berbayar.",
  items: [
    "Semua 11 fitur tersedia",
    "Tanpa iklan",
    "Tanpa batas transaksi",
    "Data kamu, bukan kami",
  ],
  urgency: "Harga khusus hanya untuk pendaftar awal.",
};

// FAQs
export const faqs = [
  { q: "Bagaimana cara install?", a: "Buka di browser HP, ketuk ikon 'Tambah ke Home Screen'. Selesai — tanpa Play Store, tanpa App Store." },
  { q: "Gratis sampai kapan?", a: "Selama fase awal ini, semua fitur gratis. Pendaftar sekarang dapat harga khusus saat kami rilis versi berbayar." },
  { q: "Data saya disimpan di mana?", a: "Di server yang aman. Login pakai email pribadi. Data tidak dijual, tidak dipakai untuk iklan." },
  { q: "Bisa dipakai di laptop juga?", a: "Ya. Better Finance dirancang untuk HP dan laptop. Buka di browser mana pun." },
  { q: "Ada bantuan kalau saya bingung?", a: "Bisa hubungi langsung via email. Kami tim kecil yang respons cepat." },
  { q: "Kalau saya berhenti pakai, data hilang?", a: "Tidak. Data tetap ada. Bisa kamu export kapan saja." },
  { q: "Aman nggak masukin data keuangan pribadi?", a: "Aman. Koneksi terenkripsi HTTPS, login pribadi, tidak ada pihak ketiga yang mengakses data transaksimu." },
];
```

### Task 4 — `NetWorthDemo.tsx` (signature)

`"use client"`. Reuse `computeNetWorth` dari `landing.data.ts`. Reuse `formatCurrency` dari `@/lib/helper`.

```typescript
"use client";
import { useState } from "react";
import { netWorthBase, netWorthToggles, computeNetWorth } from "./landing.data";
import { formatCurrency } from "@/lib/helper";

export function NetWorthDemo() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const { total, liquid, nonliquid } = computeNetWorth(netWorthBase, active);
  const liquidPct = total > 0 ? (liquid / (total > 0 ? total + Math.abs(total - liquid - nonliquid) : 1)) * 100 : 60;

  const toggle = (id: string) =>
    setActive(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-lg max-w-sm mx-auto">
      <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Net Worth</p>
      <p className="font-display text-3xl font-bold text-[#0F172A] tabular-nums transition-all duration-300">
        {formatCurrency(total)}
      </p>
      {/* Bar liquid/non-liquid */}
      <div className="mt-3 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
        <div
          className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(10, liquidPct))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#64748B] mt-1">
        <span>Rekening {formatCurrency(liquid)}</span>
        <span>Aset {formatCurrency(nonliquid)}</span>
      </div>
      {/* Accounts */}
      <div className="mt-4 space-y-1 border-t border-[#E2E8F0] pt-3">
        {netWorthBase.accounts.map(a => (
          <div key={a.label} className="flex justify-between text-sm">
            <span className="text-[#0F172A]">{a.label}</span>
            <span className="text-[#64748B]">{formatCurrency(a.amount)}</span>
          </div>
        ))}
      </div>
      {/* Toggle chips */}
      <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-3">
        <p className="text-xs text-[#64748B]">Tambahkan ke net worth kamu:</p>
        <div className="flex flex-wrap gap-2">
          {netWorthToggles.map(t => (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium border transition-all duration-200 ${
                active.has(t.id)
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB]"
              }`}
            >
              <span>{active.has(t.id) ? "−" : "+"}</span>
              <span>{t.label}</span>
              <span className={active.has(t.id) ? "text-blue-200" : "text-[#64748B]"}>
                {t.type === "liability" ? formatCurrency(t.delta) : `+${formatCurrency(t.delta)}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Buat `src/app/(marketing)/_components/NetWorthDemo.test.ts` (vitest):
```typescript
import { describe, it, expect } from "vitest";
import { computeNetWorth, netWorthBase, netWorthToggles } from "./landing.data";

describe("computeNetWorth", () => {
  it("base only", () => {
    const r = computeNetWorth(netWorthBase, new Set());
    expect(r.total).toBe(14_600_000); // 1.85 + 12.3 + 0.45 jt
  });
  it("toggle emas adds nonliquid", () => {
    const r = computeNetWorth(netWorthBase, new Set(["emas"]));
    expect(r.total).toBe(14_600_000 + 12_000_000);
    expect(r.nonliquid).toBe(12_000_000);
  });
  it("toggle cicilan reduces total", () => {
    const r = computeNetWorth(netWorthBase, new Set(["cicilan"]));
    expect(r.total).toBe(14_600_000 - 1_200_000);
  });
});
```

### Task 5 — Section components

Buat tiap section dari data di `landing.data.ts`. Hindari pola berulang — variasikan layout:

| Component | Layout hint |
|---|---|
| `Hero.tsx` | 2 kolom di ≥lg (copy kiri, NetWorthDemo kanan). Mobile: stack vertikal. |
| `QuickProof.tsx` | 3 kolom horizontal (trio angka), divider vertikal tipis antar kolom. Bukan kartu. |
| `ProblemSection.tsx` | Background `#F7F8FA`, list 4 keluhan dengan check/dot, rata kiri bukan center. |
| `HowItWorks.tsx` | Timeline vertikal mobile, 3 kolom horizontal desktop. Nomor besar biru. |
| `FeaturesSection.tsx` | Grid 2×3, icon lucide (bukan emoji), teks manfaat. |
| `ObjectionSection.tsx` | Accordion atau Q&A simple, alternating bg (bukan kartu semua). |
| `SocialProof.tsx` | Satu blockquote besar + guarantee tag — bukan list kartu. |
| `PricingSection.tsx` | Satu kotak pricing besar, list fitur checklist, urgency badge. |
| `FaqSection.tsx` | Accordion. JSON-LD ditaruh di `page.tsx`. |
| `FinalCta.tsx` | Mirror hero CTA — sederhana, satu tombol besar. |
| `StickyCta.tsx` | Fixed bottom, `lg:hidden`, muncul via IntersectionObserver pada hero. |

**Reuse:** `Button` dari `src/components/ui/Button.tsx` untuk semua CTA. Kalau variant/ukuran kurang cocok, extend className — jangan bikin komponen baru.

### Task 6 — Rakit `src/app/page.tsx`

Server Component (SSG), tanpa `"use client"`. Susun semua section. Export `metadata`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Better Finance — Net worth kamu dalam satu angka",
  description: "Catat rekening, investasi, emas, goals, dan wishlist. Lihat total kekayaanmu update real-time. Gratis.",
  metadataBase: new URL("https://better-finance.vercel.app"), // ganti URL final
  openGraph: {
    title: "Better Finance — Net worth kamu dalam satu angka",
    description: "Catat rekening, investasi, emas, goals, dan wishlist. Lihat total kekayaanmu update real-time. Gratis.",
    images: [{ url: "/og-landing.png", width: 1200, height: 630 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

// JSON-LD di dalam component:
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Better Finance",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, Android, iOS",
      offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
      description: "Aplikasi net worth pribadi — catat rekening, investasi, aset, dan goals.",
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};
```

**OG image:** buat `public/og-landing.png` (1200×630) — bisa pakai Next.js `opengraph-image.tsx` convention, atau taruh PNG statis. Pilih yang lebih cepat.

### Task 7 — Analytics per CTA

```bash
grep -rn 'analytics\|gtag\|track\|posthog\|mixpanel' src
```

Kalau belum ada provider: buat wrapper no-op `src/lib/analytics.ts`:
```typescript
export function trackCta(position: "hero" | "mid" | "pricing" | "footer" | "sticky") {
  if (typeof window === "undefined") return;
  // no-op sampai provider dipasang — replace implementation saat siap
  console.debug("[analytics] cta_click", position);
}
```

Panggil `trackCta(position)` di tiap CTA button `onClick`.

### Task 8 — Verifikasi

```bash
npm run build        # WAJIB lolos — satu-satunya cara catch typo import/route
npm run test:run     # NetWorthDemo compute tests harus pass
```

Manual (owner):
- `/` = landing tampil, hero + NetWorthDemo interaktif.
- Klik CTA → `/signup`.
- `/dashboard` → dashboard utuh (login).
- Link "Buka Dashboard" → `/dashboard`.
- Responsif 360 / 768 / 1440 (desktop dirancang, bukan kolom mengambang).
- `prefers-reduced-motion: reduce` → animasi mati.
- View source: ada JSON-LD, OG meta, lang id.
- Lighthouse mobile ≥90 Perf & A11y.

---

## Reuse (jangan bikin baru)

| Yang dibutuhkan | Pakai ini |
|---|---|
| Format angka Rp | `formatCurrency` — `src/lib/helper.ts` |
| Tombol CTA | `Button` — `src/components/ui/Button.tsx` |
| Font body | Inter — sudah di `layout.tsx` |
| Icon | lucide-react — sudah terpasang |
| className merge | `cn()` — sudah ada |

---

## Yang TIDAK dilakukan

- Tidak ada backend/DB untuk landing (SSG murni).
- Tidak ada section privasi (owner skip v1).
- Tidak ada testimoni palsu / avatar generated.
- Tidak klaim offline PWA.
- Tidak tambah library animasi baru.
- Tidak bikin root middleware baru (catat: kalau kelak `updateSession` di-wire, tambah `/` ke public allowlist).

---

## CLAUDE.md Check (after implementation)

- [ ] Route `/` (landing) + `/dashboard` (pindah) → update AGENTS.md § Feature Pages.
- [ ] Font Space Grotesk + tokens Ink & Paper → dokumentasikan jika jadi pattern global.
- [ ] Pengecualian bahasa landing = Indonesian → catat di AGENTS.md § Language.
- [ ] README: tambah landing page ke deskripsi produk.
- [ ] roadmap.md: update status bf-3mb.
- [ ] ⚠️ Kalau kelak wire `updateSession` middleware: tambah `/` ke public allowlist.
