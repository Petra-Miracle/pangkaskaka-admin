# AUDIT — Redesign UI SuperAdmin Console (Langkah 1)

> Tanggal: 2026-09-09 · Repo: `pangkaskaka-admin` (frontend) · Belum ada kode ditulis, menunggu konfirmasi.

## Konteks repo (mengisi bagian "ISI DULU")

| Item | Nilai |
|---|---|
| Repo frontend | `D:\SuperAdmin APP-PangkasKAKA` (GitHub `Petra-Miracle/pangkaskaka-admin`) |
| Stack | **Next.js 16.3.0** App Router + Turbopack, React 19.2, TypeScript 5 |
| Styling | **Tailwind v4** (`@theme` / `@theme inline` di `src/app/globals.css`, tanpa `tailwind.config`), + `@heroui/react`, `@base-ui/react`, `shadcn`, `tw-animate-css` |
| Library chart | **ApexCharts `^3.46.0`** (bukan Recharts), dipakai lewat wrapper imperatif `src/components/ui/apex-chart.tsx` |
| Backend di repo ini | **TIDAK ADA.** Ini SPA murni sisi-klien. Semua data lewat `apiFetch` (`src/lib/api.ts`) ke API Railway. Satu-satunya kode server: `src/proxy.ts` (route guard). → syarat "tidak ada file backend berubah" otomatis terpenuhi. |

---

## 1. Struktur folder komponen

```
src/
  app/
    layout.tsx                     ← root: font Inter, ThemeProvider, QueryProvider, Toaster
    globals.css                    ← SEMUA token tema ada di sini
    loading.tsx
    login/page.tsx
    (dashboard)/
      layout.tsx                   ← Sidebar + Topbar + MobileNav + CommandPalette + <main>
      template.tsx                 ← membungkus SETIAP halaman dengan .animate-fade-up
      loading.tsx
      page.tsx                     ← Dashboard (KPI + StatisticsSection)
      shops/ admins/ users/ verifications/ verifications/[shopId]/
      recruitment/ hairstyles/ audit-log/ bookings/ payments/
  components/
    nav/        sidebar, topbar, mobile-nav, page-header, placeholder-page,
                command-palette, theme-toggle
    ui/         apex-chart, badge, button, table, data-table, skeleton, spinner,
                select, dialog, dropdown-menu, input, label, textarea, tabs,
                avatar, separator, search-box, code-block, sonner, logo-loading
    dashboard/  statistics.tsx     ← 6 kartu chart + helper lokal
    admins/     create-admin-dialog, credential-dialog
    verifications/  document-review-card, chat-panel
    hairstyles/ import-dialog
    providers/  query-provider, theme-provider
  lib/
    utils.ts                       ← formatRupiah, formatNumber, formatRelativeTime, cn
    chart-colors.ts                ← getChartPalette() (baca CSS var + fallback hex)
    client-values.ts               ← useAnimatedNumber, useGreeting, useTodayLabel, useStoredAdminUser
    nav-items.ts                   ← NAV_SECTIONS (Utama / Manajemen / Monitoring)
    api.ts, auth.ts
    queries/    dashboard, analytics, shops, users, admins, recruitment, hairstyles, chat
  types/admin.ts
```

Catatan: **tidak ada komponen `Card` lokal** — dipakai `Card` dari `@heroui/react` (`Card.Header/Title/Description/Content/Footer`) hampir selalu dengan `className="glass-card ..."`. Tidak ada `StatTile`, `SectionHeader`, `EmptyState` bersama — tiap halaman bikin sendiri.

---

## 2. Di mana token warna/tema didefinisikan

**Satu tempat: `src/app/globals.css`.**

| Blok | Baris | Isi |
|---|---|---|
| `@theme { … }` | 8–85 | hanya keyframes animasi (fade-up, aurora, shimmer, float, pulse-soft, …) |
| `@theme inline { … }` | 87–146 | memetakan utilitas Tailwind `--color-*`, `--radius-*` ke CSS var `--*` |
| `:root { … }` | 148–206 | **palet terang, format OKLCH.** `--primary: oklch(0.52 0.19 260)` = biru/indigo. `--chart-1..5` semua biru-ungu. `--background` biru sangat muda. Plus `--spinner-*` & `--dropdown-*` (menarik skala warna Tailwind: `blue-700`, `emerald-700`, `rose-700`, `orange-500`, …), lalu `--shadow-*` & `--shadow-glow` (bernuansa biru). |
| `.dark { … }` | 208–265 | palet gelap, struktur token sama. |
| `@layer utilities` | 311–618 | kelas dekoratif: `.bg-gradient-mesh`, `.bg-aurora`, `.hero-panel`, `.glass-card` (+`-hover`), `.card-glow`, `.text-gradient-brand`, `.btn-shine`, `.icon-tile` (**hardcode** `border-primary/15 bg-gradient-to-br from-primary/12 to-primary/5 text-primary`), `.skeleton`, `.divider-gradient`, `.stagger-children`, `.table-rows`, `.img-zoom`. |

Tempat lain yang menyimpan warna:
- `src/lib/chart-colors.ts` — fallback hex **hardcode**: `#3b82f6 #2563eb #1d4ed8 #93c5fd #1e3a8a` (biru), `#047857 #be123c #f97316` (semantik).
- `src/app/layout.tsx` baris 23–26 — `viewport.themeColor` hardcode `#f3f6ff` / `#0a0f1e`.

---

## 3. Daftar warna yang benar-benar dipakai sekarang

### Token (globals.css)
- **Aksen/brand:** `--primary` biru `oklch(0.52 0.19 260)` (terang) / `oklch(0.68 0.15 240)` (gelap). Dipakai untuk tombol, item sidebar aktif, ikon tile, seri chart, ring fokus.
- **Chart:** `--chart-1..5` — 5 nuansa biru/ungu.
- **Netral:** `--background --foreground --card --muted --border --secondary --accent` — abu **kebiruan** (bukan hangat).
- **Semantik (spinner tokens):** success = `emerald-700/500`, danger = `rose-700/500`, warning = `orange-500/400`, purple, pink.

### Kelas warna Tailwind hardcode di komponen — **48 kemunculan, 17 file**
| Warna | Arti dipakai | Lokasi (contoh) |
|---|---|---|
| `emerald-*` | sukses / aktif / naik / titik "online" | `page.tsx` (TrendChip, KPI accent), `sidebar.tsx`, `mobile-nav.tsx`, `users`, `shops`, `verifications`, `hairstyles`, `document-review-card`, `credential-dialog`, `audit-log` |
| `amber-*` | menunggu / peringatan / blok "dev-note" | `page.tsx` (KPI accent), `shops` (banner info), `verifications` (badge + summary), `verifications/[shopId]`, `users`, `admins/create-admin-dialog`, `bookings`, `payments`, `audit-log`, `placeholder-page`, `hairstyles` |
| `violet-*` | KPI "Revenue" / role StreetBarber | `page.tsx`, `users`, `login` |
| `sky-*` | role "Pemilik toko" | `users` |
| `rose` (via `destructive`) | gagal / ditolak / hapus | seluruh app lewat `--destructive` |
| `white/40`, `black` | ring logo, bayangan | `sidebar`, `mobile-nav`, `login` |

Kesimpulan: **empat KPI di dashboard memakai empat warna ikon berbeda** (`primary`/biru, `amber`, `emerald`, `violet`) — persis keramaian yang brief ingin hilangkan. Status di tiap halaman ditulis ulang manual (`bg-emerald-500/10 text-emerald-700 …`) alih-alih satu komponen.

---

## 4. Komponen penyusun halaman Dashboard superadmin

`src/app/(dashboard)/page.tsx` → `DashboardHomePage`:

1. **Baris KPI** — `grid ... lg:grid-cols-4` berisi 4× `KpiCard` (komponen lokal di file yang sama):
   - `Card` HeroUI `glass-card glass-card-hover card-glow h-40`
   - `useAnimatedNumber()` — angka menghitung naik saat load
   - prop `accent` = string kelas gradient per kartu (4 warna beda)
   - `TrendChip` — `value.toFixed(1)` + `%` → sumber bug **"+8.0"** & **"-66.7%"**
   - data: `useDashboardStats()` (`/admin/dashboard`) + `useAdminAnalytics()` (`/analytics/admin`)
2. **`<StatisticsSection>`** (`src/components/dashboard/statistics.tsx`):
   - Header bagian: `icon-tile` + `<h2>Statistik</h2>` + subjudul → blok besar yang brief ingin ganti jadi garis tipis
   - `grid lg:grid-cols-2` berisi 6 kartu, semua `ChartCard` lokal (`glass-card card-glow`):
     | # | Komponen | Chart | Sumber data |
     |---|---|---|---|
     | 1 | `ShopsByFilterChart` (col-span-2) | **area/kurva** (baru diubah; sebelumnya bar) + dropdown Kategori/Kecamatan/Status | `useAllShops` |
     | 2 | `UserRolesPieChart` | pie | `useAllUsers` |
     | 3 | `AvgRatingRadialChart` | radialBar | `useAdminAnalytics` |
     | 4 | `GrowthBarChart` | bar horizontal | `useAdminAnalytics` |
     | 5 | `KecamatanDonutChart` | donut | `useAdminAnalytics` |
     | 6 | `AtRiskShopsList` | list biasa (bukan chart) | `useAdminAnalytics` |
   - Helper lokal di file itu: `ChartCard`, `ChartLoading`, `ChartEmptyState`, `integerAxis`, `extractArea`.
   - **Teks catatan developer bocor** (item #4 brief), semuanya di deskripsi kartu:
     - Pie: *"…karena API belum menyimpan relasi karyawan ke toko."*
     - Growth: *"…dari `/analytics/admin`."*
     - Donut: *"Dihitung langsung oleh backend (`distribution`), bukan hasil filter di halaman ini."*

---

## 5. Komponen bersama lintas halaman

| Komponen | File | Catatan untuk redesign |
|---|---|---|
| Layout dashboard | `(dashboard)/layout.tsx` | `bg-gradient-mesh`, `max-w-[1440px]` |
| `template.tsx` | `(dashboard)/template.tsx` | membungkus **tiap** halaman dengan `animate-fade-up` (animasi masuk yang brief minta dihapus) |
| `Sidebar` | `nav/sidebar.tsx` | **terang** (`bg-sidebar/80` glass), item aktif = gradient biru + indikator kiri, judul grup uppercase tracking, badge "Segera" `variant=outline`, blok "API Production Online" dengan `animate-ping`. Bisa collapse ke rail. Brief minta **sidebar gelap**. |
| `Topbar` | `nav/topbar.tsx` | breadcrumb → search → `ThemeToggle` → avatar dropdown. **Tidak ada pemilih rentang waktu**, tidak ada teks "Diperbarui … WITA". |
| `MobileNav` | `nav/mobile-nav.tsx` | top bar + bottom tab (4 item) + drawer |
| `PageHeader` | `nav/page-header.tsx` | eyebrow pill biru + `<h1>` besar + deskripsi. Dipakai di shops, users, verifications, dst. |
| `PlaceholderPage` | `nav/placeholder-page.tsx` | halaman "Segera hadir" (payments/bookings/audit-log) |
| `Badge` | `ui/badge.tsx` | varian: default/secondary/destructive/outline/ghost/link. **Tidak ada varian semantik `success`/`warning`/`neutral`** — tiap halaman menambal manual. Belum ada ikon di dalam badge. |
| `Button` | `ui/button.tsx` | `cva`; default = gradient biru + shadow. |
| `Table` + `DataTable` | `ui/table.tsx`, `ui/data-table.tsx` | TanStack Table **v9 legacy API**. Header sticky `bg-muted/90`, baris `hover:bg-primary/[0.03]`, skeleton rows, paginasi. Tidak ada mode "kartu bertumpuk" di layar sempit — tabel scroll horizontal. |
| `Skeleton` / `.skeleton` | `ui/skeleton.tsx` + util | ada, tapi banyak halaman masih pakai satu `Spinner` besar |
| lain | `select, dialog, dropdown-menu, input, label, textarea, tabs, avatar, separator, search-box` | shadcn/base-ui standar |
| `Card` | **`@heroui/react`** (bukan lokal) | selalu dibungkus `.glass-card` |

---

## 6. Library chart & konfigurasinya

- **ApexCharts 3.46**, tanpa `react-apexcharts`. Wrapper `src/components/ui/apex-chart.tsx`:
  ```
  useEffect(keyed on JSON.stringify(options)) → import("apexcharts") → new ApexCharts(el, options).render() → destroy() saat unmount
  ```
- Konfigurasi ditulis **inline per chart** di `statistics.tsx` sebagai objek `ApexOptions`.
- Warna dari `getChartPalette()` (`src/lib/chart-colors.ts`).
- Kesadaran tema: `useTheme()` → `resolvedTheme === "dark"` → hanya dipakai untuk `tooltip.theme`.
- **Hanya halaman Dashboard yang memakai chart.** Halaman lain tidak ada chart.
- Tooltip: default ApexCharts (belum "pil gelap + panah" seperti brief).
- Grid: `grid.borderColor` di-set, garis vertikal masih tampil di beberapa chart.

---

## 7. Di mana angka diformat

**Terpusat (`src/lib/utils.ts`):**
- `formatRupiah(n)` → `` `Rp ${n.toLocaleString("id-ID")}` `` — dipakai untuk "Revenue today".
- `formatNumber(n)` → `n.toLocaleString("id-ID")`.
- `formatRelativeTime(date)` → "3 jam lalu" / fallback `toLocaleDateString("id-ID")`.
- `cn()`.

**Tersebar (tidak lewat helper):**
- `page.tsx` `TrendChip`: `value.toFixed(1)` → **"+8.0"**, **"-66.7%"** (item #2 & #5 brief).
- `statistics.tsx`: formatter chart `Math.round(...)`, `.toFixed(0)`, `.toFixed(1)` di 6 tempat.
- `shops/page.tsx` `rowRating`: `shop.rating.toFixed(1)`.
- Tanggal/jam: `new Date(x).toLocaleString("id-ID")` di ~6 tempat (`shops`, `verifications`, `verifications/[shopId]`, `document-review-card`, `admins`, `users`) — **tanpa penetapan zona waktu**, ikut zona browser. Tidak ada "WITA" di mana pun.
- `client-values.ts`: `toLocaleDateString("id-ID", …)` untuk label tanggal.
- **Belum ada** helper `hasEnoughSample` / ambang sampel kecil di `master` (ada di branch PR #1 yang belum di-merge).

---

## 8. Hal yang TIDAK BISA dikerjakan tanpa menyentuh backend (repo lain `APP-PangkasKAKA`)

| Keinginan brief | Kenapa terblokir |
|---|---|
| Pemilih rentang waktu **7/30/90 hari yang benar-benar mengubah data** | `/admin/dashboard` dan `/analytics/admin` tidak menerima parameter rentang. → brief sendiri bilang: buat komponennya, simpan di state lokal, **jangan ubah panggilan API**. Akan saya buat sebagai UI saja + catat. |
| **Sparkline** di kartu KPI | Tidak ada endpoint deret-waktu (hanya angka tunggal + 1 pct pertumbuhan). → brief: "kalau belum tersedia, jangan dibuat". Tidak akan dibuat. |
| Metrik GMV / fee platform | Tidak ada di API. Brief sudah menyatakan ini di luar lingkup. |
| "Diperbarui HH:mm WITA" yang akurat | API mengirim timestamp; konversi ke WITA **murni tampilan** → BISA dikerjakan (Intl `timeZone: "Asia/Makassar"`). Bukan blocker. |
| Sembunyikan % saat sampel < 10 | **Murni tampilan** (angka mentahnya sudah ada) → BISA. Bukan blocker. |

---

## 9. Ketidakkonsistenan visual yang ditemukan (untuk laporan akhir nanti)

1. Empat KPI = empat warna ikon (biru/amber/emerald/violet).
2. Status ("Disetujui/Menunggu/Ditolak/Disuspend/Aktif/Ditangguhkan") ditulis ulang manual di 6+ halaman, kelas warna beda-beda, **tanpa ikon**.
3. `PlaceholderPage` judulnya `text-primary` + `text-4xl`; `PageHeader` judulnya `text-foreground` + `text-3xl` → dua gaya judul halaman.
4. Blok "catatan dev" berlatar amber tampil sebagai UI di `shops` (banner endpoint), `statistics` (deskripsi kartu), `placeholder-page`.
5. Animasi masuk di mana-mana: `template.tsx`, `.stagger-children`, `.animate-fade-up`, `useAnimatedNumber` (hitung naik), `.card-glow` (glow ikut kursor), `.btn-shine`, `.bg-aurora`.
6. Latar halaman abu **kebiruan** (`--background` chroma 0.004 hue 255), bukan netral hangat.
7. `DataTable` tidak responsif di <480px (scroll-x), sedangkan brief minta "kartu bertumpuk".
8. Ikon tile biru (`.icon-tile`) dipakai di header bagian, verifikasi, placeholder — konsisten tapi semuanya biru gradient.
9. Logo `pangkaskaka-logo.png` biru — akan bentrok kalau UI jadi oranye.

---

## 10. Konflik dengan pekerjaan yang BARU SAJA dikerjakan — perlu keputusan Anda

Chart **"Jumlah toko terdaftar"** baru saja diubah (atas permintaan Anda) menjadi: **kurva area mulus + gradien biru + sumbu Y tetap 0–40**. Brief redesign ini justru meminta hal yang berlawanan:

| Brief redesign minta | Kondisi sekarang (permintaan Anda terakhir) |
|---|---|
| §5.1 sumbu Y **ikut data**: `[0, max×1.25]`, minimum `[0, 5]` | tetap **0–40** ("biar lebih detail") |
| §5.3 kalau kategori cuma **1**, tampilkan **bar / angka besar**, bukan garis | sekarang **area/garis** |
| §4.5 & §6 batang/garis warna solid, **tanpa gradient** | sekarang **gradien** |

**Pertanyaan:** untuk chart ini, ikuti brief redesign (sumbu ikut data, bukan garis kalau 1 kategori, tanpa gradient) atau pertahankan yang barusan?

---

## 11. Rencana kerja bertahap (usulan — menunggu ACC)

| Tahap | Isi | Sentuh file |
|---|---|---|
| **1** | **Audit ini** — selesai, menunggu konfirmasi | — |
| **2** | Token warna oranye + netral hangat + varian gelap di `globals.css`; sinkronkan fallback `chart-colors.ts` & `themeColor` di `layout.tsx`. Belum ubah tampilan komponen. | `globals.css`, `chart-colors.ts`, `layout.tsx` |
| **3** | Helper format terpusat di `utils.ts`: `formatCount` (bulat), `formatPercent` (1 desimal), `formatDateTimeWITA`, `hasEnoughSample(n)` | `utils.ts` |
| **4** | Komponen dasar: `Card` lokal (varian non-glass), `StatTile`, `SectionHeader`, `EmptyState`, `Badge` + varian `success/warning/neutral` + ikon, skeleton per-kartu | `components/ui/*` (baru) |
| **5** | Sidebar gelap + Topbar (tambah pil rentang waktu **UI-only** + "Diperbarui HH:mm WITA") | `nav/sidebar.tsx`, `nav/topbar.tsx`, `nav/mobile-nav.tsx` |
| **6** | Dashboard: 4 KPI → **1 kartu bersekat** ikon seragam; `ChartCard` −40% tinggi, tooltip pil, dev-note → komentar, empty state terarah, fix chart 1-kategori | `app/(dashboard)/page.tsx`, `components/dashboard/statistics.tsx` |
| **7** | Rapikan halaman lain (Shops, Users, Verifications, Recruitment, Hairstyles, Placeholder): pakai `Badge`/`StatTile`/`SectionHeader` baru, buang blok amber dev-note, judul halaman satu gaya | halaman terkait + `nav/page-header.tsx`, `nav/placeholder-page.tsx` |
| **8** | QA: 360px, mode gelap, kontras oranye (teks pakai `accent-700`), ring fokus, `prefers-reduced-motion`, hapus animasi masuk | lintas file |

Tiap tahap: build + eslint hijau, lalu tunjukkan hasil sebelum lanjut.

---

## 12. Pertanyaan sebelum menulis kode

1. **Konflik chart di §10** — ikut brief atau pertahankan kurva 0–40 yang barusan?
2. **Sidebar** — gelap penuh (`#1C1917`) sesuai brief? (kalau ya, langsung saya kerjakan; kalau nanti mau oranye diredam, sebut saja)
3. **Logo** — brief melarang menyentuh logo tanpa izin. Sementara saya bungkus lingkaran/kotak putih netral. Setuju?
4. **Animasi masuk** — boleh saya hapus semua (`template.tsx` fade, `stagger-children`, `animate-fade-up`, count-up `useAnimatedNumber`, `card-glow`, `btn-shine`, `bg-aurora`)? Ini menyentuh banyak file.
5. **Lingkup** — kerjakan Dashboard dulu lalu berhenti untuk review (tahap 2–6), atau lanjut sekaligus sampai semua halaman (tahap 7)?
6. **Cara kirim** — tetap branch + PR + preview Vercel? Satu PR besar, atau PR per tahap? (`master` sekarang auto-deploy ke produksi)
7. **Rentang waktu 7/30/90** — cukup pil UI yang menyimpan pilihan di state (belum mempengaruhi data), sesuai brief? Konfirmasi saja.
