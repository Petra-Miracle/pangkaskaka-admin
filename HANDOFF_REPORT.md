# SuperAdmin Dashboard — Laporan Serah Terima

> Ringkasan pekerjaan yang belum selesai di repo `SuperAdmin APP-PangkasKAKA`,
> disiapkan supaya siapa pun yang melanjutkan pengembangan dashboard ini tahu
> persis di mana harus mulai.

- **Cakupan:** repo dashboard SuperAdmin (Next.js) saja — bukan mobile app / backend
- **Per tanggal:** 2026-09-08
- **Branch:** `master` — bersih, sinkron dengan `origin/master`
- **Ringkasan cepat:** 1 item *blocking*, 7 endpoint backend baru tanpa UI, 43 commit sejak proyek dimulai (14 Agu 2026)

---

## Daftar Isi

1. [Model peran belum disinkronkan ke dashboard ini](#1-model-peran-belum-disinkronkan-ke-dashboard-ini) — **Blocking**
2. [Endpoint superadmin baru — belum ada layar sama sekali](#2-endpoint-superadmin-baru--belum-ada-layar-sama-sekali) — Fitur baru
3. [Masih terblokir menunggu backend](#3-masih-terblokir-menunggu-backend) — Open
4. [Item keamanan yang sengaja belum ditutup](#4-item-keamanan-yang-sengaja-belum-ditutup)
5. [Insiden 8 September — sudah pulih, pola risikonya akan terulang](#5-insiden-8-september--sudah-pulih-tapi-pola-risikonya-akan-terulang) — Resolved
6. [Sudah selesai — jangan dikerjakan ulang](#6-sudah-selesai--jangan-dikerjakan-ulang)
7. [Aturan main di repo ini](#7-aturan-main-di-repo-ini)

---

## 1. Model peran belum disinkronkan ke dashboard ini

**Status: 🟢 Diperbaiki 2026-09-08** — teman kami sempat terhalang login dengan
pesan "Akun ini bukan akun admin. Akses ditolak." persis seperti yang
diprediksi di bawah, sehingga ini langsung diperbaiki alih-alih menunggu.
Keempat file di bawah sudah diubah (`login/page.tsx`, `proxy.ts`,
`types/admin.ts`, `chat-panel.tsx`), plus dampak lanjutannya di
`users/page.tsx` dan `statistics.tsx` (`ROLE_META`/`ROLE_LABELS` lengkap
untuk 5 peran, kunci baris "tidak bisa diubah" dipindah dari `admin` ke
`superadmin`). `npx tsc --noEmit` dan `npm run build` sudah hijau. **Belum
di-commit** — tinjau diff di bawah dulu sebelum push.

Backend (`D:\APP-PangkasKAKA\backend\server.py`) sudah direstrukturisasi dari 4
peran (`customer / owner / karyawan / admin`) menjadi 5 peran: `customer /
owner / streetbarber / admin / superadmin`. Otoritas tertinggi — yang
sebelumnya bernilai `"admin"` — sekarang bernilai `"superadmin"`. String
`"admin"` kini berarti sesuatu yang **sama sekali berbeda**: peran sempit
yang hanya memvalidasi pengajuan StreetBarber di toko-toko tertentu.

Setiap endpoint yang dipakai dashboard ini (`/admin/dashboard`,
`/admin/users`, `/admin/pending-shops`, `/analytics/admin`, dst.) sekarang
mewajibkan token dengan `role: "superadmin"` — tapi kode di repo ini **masih
hardcode memeriksa `"admin"`** di tiga tempat. Akibatnya: begitu akun
SuperAdmin login ulang dengan token baru (`role: "superadmin"`), dashboard
**akan menolaknya sendiri di sisi klien** sebelum sempat memanggil API sama
sekali.

### Yang perlu diubah

**1 — `src/app/login/page.tsx:116`**
```diff
- if (user?.role !== "admin") {
-   throw new Error("Akun ini bukan akun admin. Akses ditolak.");
- }
+ if (user?.role !== "superadmin") {
+   throw new Error("Akun ini bukan akun superadmin. Akses ditolak.");
+ }
```

**2 — `src/proxy.ts:22`**
```diff
- if (claims.role !== "admin") return null;
+ if (claims.role !== "superadmin") return null;
```

**3 — `src/types/admin.ts:127`**
```diff
- export const ADMIN_USER_ROLES = ["customer", "owner", "karyawan", "admin"] as const;
+ export const ADMIN_USER_ROLES = ["customer", "owner", "streetbarber", "admin", "superadmin"] as const;
```

### Dampak lanjutan dari perubahan #3 — perlu keputusan desain, bukan cuma ganti string

Mengubah `ADMIN_USER_ROLES` merambat ke `src/app/(dashboard)/users/page.tsx`:

- `ROLE_META` (baris ~42) cuma punya entri untuk `admin` dan `karyawan` —
  butuh entri baru untuk `streetbarber` dan `superadmin` (label, warna chip,
  ikon).
- `isAdminRow` (baris 440) mengunci baris `role === "admin"` dari
  suspend/hapus/ubah-peran — ini **terbalik** sekarang. Yang harus dikunci
  adalah `superadmin` (otoritas tertinggi), bukan `admin` (peran sempit yang
  sekarang justru boleh dikelola dari sini).
- Backend sendiri sudah benar soal ini — `server.py:2366` dan `:2409`
  menolak suspend/hapus terhadap `role == "superadmin"`, bukan `"admin"`.
  Dashboard tinggal mengikuti sumber kebenaran itu.

### Satu tempat lagi yang gampang terlewat

`src/components/verifications/chat-panel.tsx:98`

```js
const isAdmin = msg.sender_role === "admin";
```

Dipakai untuk menaruh bubble chat SuperAdmin di sisi kanan. Pesan baru dari
SuperAdmin sekarang punya `sender_role: "superadmin"`, jadi bubble-nya akan
salah render seolah-olah dari pemilik toko. Ganti nilainya sama seperti di
atas.

---

## 2. Endpoint superadmin baru — belum ada layar sama sekali

**Status: 🟡 Fitur baru**

Dicek langsung ke `server.py` (repo backend) hari ini — bukan dari dokumen
lama. Semua di bawah sudah live di backend, tapi dashboard ini belum punya
halaman yang memanggilnya.

| Area | Endpoint | Fungsi |
|---|---|---|
| **Kelola Admin** *(setara "Kelola Admin" yang sudah ada di app mobile, versi web belum ada)* | `POST /superadmin/admins` | Buat akun Admin baru (peran sempit, dibatasi ke sekumpulan toko) |
| | `GET /superadmin/admins` | Daftar semua akun Admin |
| | `PUT /superadmin/admins/{id}` | Ubah cakupan toko yang dikelola seorang Admin |
| | `POST /superadmin/admins/{id}/reset-password` | Reset password akun Admin |
| **Keuangan / payout** *(lebih spesifik dari yang disebut "Payments" di dokumen lama)* | `GET /admin/payouts?status=` | Daftar permintaan pencairan dana milik toko |
| | `POST /admin/payouts/{id}/mark-paid` | Tandai payout sudah dibayar manual |
| | `POST /admin/wallets/reconcile` | Rekonsiliasi saldo dompet sistem |
| **Booking bermasalah** | `GET /admin/bookings/held` | Booking yang dananya tertahan (sengketa/escrow) |
| | `POST /admin/bookings/{id}/force-release` | Paksa lepaskan dana booking yang tertahan |
| **Katalog produk** | `POST/PUT/DELETE /admin/products/{id}` | CRUD produk yang dijual lewat katalog resmi SuperAdmin |

Belum ada urgensi darurat di sini (semuanya operasional, bukan insiden) —
tapi ini pekerjaan nyata yang sudah bisa dimulai kapan saja tanpa menunggu
perubahan backend lagi, karena endpoint-nya sudah jadi.

---

## 3. Masih terblokir menunggu backend

**Status: 🟡 Open**

Dari `BACKEND_ENDPOINTS_NEEDED.md` (repo ini) — status terakhir diverifikasi
2026-08-20, sebelum restrukturisasi peran. Cek ulang ke API produksi sebelum
dipercaya penuh, terutama baris "Payments" karena §2 di atas membuktikan
sebagian sudah berubah.

| Area | Yang hilang | Status |
|---|---|---|
| Direktori toko | Toko berstatus `rejected` tidak muncul di endpoint manapun (workaround gabungan `/shops` + `/admin/pending-shops` dipakai untuk sisanya) | Open |
| Booking lintas toko | `GET /admin/bookings?shop_id=&status=` untuk pencarian dukungan sengketa (beda dari `/admin/bookings/held` yang sudah ada — itu cuma yang tertahan) | Open |
| Audit log | Tidak ada jejak siapa admin yang approve/reject/suspend apa — butuh koleksi baru + instrumentasi di banyak endpoint backend | Open, besar |

---

## 4. Item keamanan yang sengaja belum ditutup

Bukan bug — sudah didokumentasikan sebagai keputusan sadar di
`SECURITY_AUDIT.md`, tapi tetap perlu diingat supaya tidak dikira "beres"
begitu saja.

- **Token masih di `localStorage` + cookie non-httpOnly** — strategi minimal
  (umur cookie dipotong ke 8 jam, validasi payload di proxy) sudah jalan;
  migrasi penuh ke cookie httpOnly via route handler Next.js (strategi A)
  belum dikerjakan, perubahan arsitektural besar.
- **Registrasi backend tidak validasi `role`** — di luar repo ini, perlu
  dilaporkan ke pemilik backend: siapa pun secara teori bisa kirim
  `"role": "superadmin"` saat daftar.
- **Tidak ada rate-limit di backend untuk `/auth/login`** — pengaman sisi
  klien (lockout 5x percobaan) sudah ada, tapi itu bisa dilewati siapa pun
  yang tidak lewat browser.
- **Tidak ada banner "sesi berakhir"** — saat ini 401 langsung redirect
  paksa ke `/login` tanpa penjelasan. Murni UX, bukan celah.

---

## 5. Insiden 8 September — sudah pulih, tapi pola risikonya akan terulang

**Status: 🟢 Resolved**

Setelah commit backend `568bf3b` (restrukturisasi peran) di-deploy, tiga
akun SuperAdmin asli masih tersimpan dengan `role: "admin"` di database
produksi — semua endpoint `/admin/*` membalas `403` untuk mereka. Sudah
diperbaiki lewat migrasi data manual (3 dokumen di koleksi `profiles`
diubah ke `role: "superadmin"`), diverifikasi `0` akun tersisa dengan
`role: "admin"` lama.

**Pelajaran untuk ke depan:** setiap kali repo backend mengubah nilai
literal sebuah `role`, dua hal harus terjadi *bersamaan*, bukan berurutan —
migrasi data akun yang sudah ada, *dan* audit semua tempat di dashboard ini
yang membandingkan `role` dengan string literal (persis kasus §1 di atas,
yang baru ketahuan sekarang, tiga minggu setelah insiden pertama).

---

## 6. Sudah selesai — jangan dikerjakan ulang

Ringkasan dari 43 commit sejak proyek dimulai, biar konteksnya utuh.

- Shell dashboard, login, route guard, design system dasar
- Verifikasi toko — antrian, review dokumen per-item, chat dengan pemilik
- Direktori toko + aksi suspend
- Manajemen user — suspend, aktifkan, ubah peran, hapus, atur password
- Katalog Hairstyle — CRUD penuh + impor CSV/Excel/JSON massal
- Editor kriteria rekrutmen
- Grafik analitik dashboard — layout anti-tabrakan, sumbu, footer berlabel
- Review dokumen dibantu AI di kartu verifikasi
- Logo PangkasKAKA baru diterapkan di seluruh dashboard
- Pesan error 4xx asli ditampilkan (bukan pesan generik)
- Perbaikan S1/S3/S5/S6 dari audit keamanan (lihat §4 untuk yang tersisa)
- Placeholder Payments/Bookings/Audit-log dipoles dengan spek backend
  konkret (lihat §3)

---

## 7. Aturan main di repo ini

Dari `AGENT_BRIEF.md`:

- Ini proyek **terpisah** dari `D:\APP-PangkasKAKA` (mobile + backend) — git
  history sendiri, deploy sendiri (Vercel). Jangan digabung.
- Dashboard **tidak boleh** pernah konek langsung ke MongoDB atau menyimpan
  secret backend (connection string, JWT secret, key Durianpay). Semua
  akses data lewat REST API produksi, pakai Bearer token seorang SuperAdmin
  yang login — sama seperti app mobile.
- API produksi: `https://app-pangkaskaka-production.up.railway.app/api`.
  Kalau sebuah fitur butuh endpoint yang belum ada, jangan menebak bentuk
  datanya atau akses DB langsung — dokumentasikan di
  `BACKEND_ENDPOINTS_NEEDED.md` dan serahkan ke pengelola repo backend.
- Folder `Noted/` di root saat ini **untracked** (belum di-commit, isinya
  catatan error log pribadi) — putuskan mau di-`.gitignore` atau dihapus,
  supaya tidak ke-commit tanpa sengaja.

---

### Referensi

- `AGENT_BRIEF.md` — konteks proyek & batasan arsitektur
- `SECURITY_AUDIT.md` — detail §4
- `BACKEND_ENDPOINTS_NEEDED.md` — detail §3

Ketiga dokumen di atas hidup di root repo ini — perbarui saat statusnya
berubah, jangan biarkan basi seperti yang terjadi di §1 dan §2.
