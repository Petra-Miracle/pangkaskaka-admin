# SECURITY_AUDIT.md — PangkasKAKA SuperAdmin Dashboard

> Dokumen internal: temuan audit keamanan data & risiko peretasan, serta
> checklist perbaikan manual. Dibuat otomatis dari hasil analisis kode —
> periksa kembali setiap item sebelum/tanpa mengimplementasikannya.

Audit tanggal: 2026-08-15 | Target: `pangkaskaka-admin` (Next.js 16, React 19)
Cakupan: kode frontend dashboard + interaksi dengan backend Railway
(`https://app-pangkaskaka-production.up.railway.app/api`)

---

## 1. Ringkasan Risiko (severity)

> Diperbarui 2026-08-15: lihat catatan "Status" per baris. S1/S6 diperbaiki
> dengan strategi B (minimal) sesuai rekomendasi dokumen ini, bukan strategi A
> (httpOnly cookie via route handler) — lihat detail di §2.

| # | Risiko | Severity | Status |
|---|--------|----------|--------|
| S1 | Token JWT disimpan di `localStorage` + cookie non-httpOnly (bisa dibaca JS/XSS) | **Tinggi** | **Diperbaiki (parsial — strategi B)** |
| S2 | Backend: endpoint registrasi tidak memvalidasi `role` → siapa pun bisa self-register jadi `admin` | **Tinggi** (backend, di luar repo ini) | Terbuka — perlu lapor ke pemilik backend |
| S3 | Tidak ada rate limiting / brute-force protection pada `/auth/login` (klien) | Sedang | **Diperbaiki (klien) — backend rate-limit tetap perlu** |
| S4 | Peran admin hanya diverifikasi client-side (login + proxy guard) — semua data tetap diambil langsung dari browser dengan Bearer token | Sedang | Terbuka — guard diperkuat (S1), tetap defense-in-depth by design |
| S5 | Error `detail`/`message` dari backend ditampilkan mentah ke UI | Rendah | **Diperbaiki** |
| S6 | Cookie token di-mirror tanpa `Secure` saat HTTP, tanpa `HttpOnly` — rentan saat protokol turun ke HTTP | Rendah | **Diperbaiki (Secure) — HttpOnly tetap butuh strategi A** |
| S7 | Token tidak punya mekanisme refresh/revoke di sisi frontend (backend: `JWT_EXP_HOURS`) — sesi mati mendadak tanpa notifikasi | Informasional | Terbuka — redirect 401 dipertahankan, banner belum dibuat |

---

## 2. Detail Temuan & Rekomendasi Perbaikan Manual

### S1. Token JWT di localStorage + cookie non-httpOnly — TINGGI

**Lokasi kode:**
- `src/lib/auth.ts` — `getToken()`/`setSession()` pakai `window.localStorage`
  (`pk_admin_token`) dan cookie `pk_admin_token` via `setCookie()` (bukan
  httpOnly, `SameSite=Lax`, `Secure` hanya saat HTTPS).
- `src/proxy.ts` — route guard membaca cookie yang sama (optimistik).

**Mengapa berisiko:**
- `localStorage` dapat dibaca oleh *script apa pun* yang berhasil berjalan di
  halaman (stored/reflected XSS, supply-chain JS). Satu XSS = token dicuri =
  akses admin penuh ke API (approve/reject toko, suspend, lihat semua user).
- Cookie mirror non-httpOnly menambah permukaan yang sama tanpa nilai keamanan
  (guard di `proxy.ts` tidak memvalidasi token — hanya mengecek keberadaannya,
  sehingga mudah dipalsukan dengan cookie `pk_admin_token=dummy`).

**Checklist perbaikan manual (pilih salah satu strategi, rekomendasi: B):**

- [ ] **A. Pindah ke cookie httpOnly (direkomendasikan oleh tim produksi):**
  - [ ] Tambah endpoint Next.js `src/app/api/auth/session/route.ts` (proxy):
        menerima token dari body, set cookie `httpOnly; Secure; SameSite=Lax;
        path=/`.
  - [ ] Semua `apiFetch()` memanggil API backend *via* route handler Next.js
        (server-side), bukan langsung dari browser → token tidak pernah ada di JS.
  - [ ] Hapus `localStorage` + cookie lama dari `src/lib/auth.ts` dan
        `src/proxy.ts`.
  - [ ] Tambah `logout` route yang menghapus cookie.
  - Belum dikerjakan — perubahan arsitektural besar (semua fetch pindah ke
    server-side), di luar cakupan update ini. Lakukan kalau S1 mau ditutup
    tuntas, bukan cuma diperkecil jendela paparannya.
- [x] **B. Minimal — batasi jendela paparan (lebih cepat):**
  - [x] Kurangi umur cookie dari 7 hari → 8 jam
        (`src/lib/auth.ts` — `SESSION_COOKIE_MAX_AGE_MS`).
  - [ ] Jangan simpan `user` lengkap di localStorage; simpan hanya token,
        re-fetch profil dari `/auth/login` bila perlu.
        **Belum dikerjakan** — backend tidak punya endpoint profil terpisah
        (`/auth/login` butuh kredensial ulang, JWT sendiri cuma berisi
        `sub`/`role`), dan nama/email bukan rahasia bagi admin yang sedang
        login. Menghapusnya akan mematikan UI (nama di sidebar) tanpa
        manfaat keamanan nyata dibanding risiko token itu sendiri. Perlu
        endpoint `/auth/me` di backend dulu kalau ini mau dituntaskan.
  - [x] Validasi nyata di `src/proxy.ts`: decode JWT payload (bagian tengah,
        base64url) dan tolak jika `exp` sudah lewat / `role !== "admin"` —
        jangan hanya mengecek keberadaan cookie. Cookie yang gagal validasi
        juga langsung dihapus saat redirect.
- [ ] Setelah pindah strategi: bersihkan data lama di browser semua admin
      (token lama di localStorage tidak boleh dipakai lagi).
      **Tindakan manual** — minta semua admin logout/login ulang sekali
      setelah deploy ini supaya cookie lama (umur 7 hari) diganti yang baru
      (8 jam). Tidak bisa dipaksa dari kode.

### S2. Backend: registrasi tanpa validasi role — TINGGI (repo lain)

**Status:** Endpoint `/auth/register` di `D:\APP-PangkasKAKA\backend\server.py`
menerima field `role` tanpa validasi — klien bisa mengirim `"role": "admin"`.

**Mengapa berisiko:** Dashboard admin ini justru membuat celah itu lebih
terlihat dan lebih menggiurkan (permukaan admin yang nyata sekarang ada).

**Yang harus dilakukan (di luar repo ini, serahkan ke pemilik backend):**
- [ ] `role` pada registrasi tidak boleh diterima dari body (harus
      `customer`, atau daftar role valid + flag).
- [ ] Khusus role `admin`: harus dibuat via seeding DB, bukan via API.
- [ ] Setelah diperbaiki, kirim permintaan ini ke pemilik repo
      `D:\APP-PangkasKAKA` (tidak bisa diubah dari folder proyek ini).

### S3. Tidak ada proteksi brute-force login

**Lokasi:** `src/app/login/page.tsx` memanggil `/auth/login` tanpa jeda/limit.

**Rekomendasi (manual, frontend):**
- [x] Tambah backoff: blokir submit 3–5 detik setelah kegagalan ke-2+
      (`src/app/login/page.tsx` — 4 detik mulai kegagalan ke-2).
- [x] Tambah counter kegagalan lokal (localStorage) → kunci form 5 menit
      setelah 5 percobaan gagal (`pk_login_attempts`, bertahan lintas reload).
- [ ] Yang terpenting: minta pemilik backend menambah rate-limit per IP/email
      pada `/auth/login` (backend-side). **Masih terbuka** — ini hanya
      penghambat sisi klien; penyerang yang tidak lewat browser (script
      langsung ke API) bisa mengosongkan localStorage dan mengabaikannya
      sepenuhnya. Proteksi nyata wajib di backend.

### S4. Role hanya diverifikasi di client

**Lokasi:** `src/app/login/page.tsx:48` (cek `user.role !== "admin"`) dan
`src/proxy.ts`.

**Mengapa berisiko:** Guard ini murni UX — siapa pun yang menyalin token admin
(yang valid dari S1) tetap bisa mengakses. API sendiri sudah melindungi
(`/admin/*` → 403 untuk non-admin), jadi ini defense-in-depth:
- [x] `src/proxy.ts` sekarang benar-benar decode payload JWT dan menolak
      token yang `exp`-nya lewat atau `role !== "admin"` (S1), bukan cuma
      mengecek keberadaan cookie — tapi ini tetap guard optimistik tanpa
      verifikasi signature (secret JWT tidak boleh ada di frontend), API
      backend tetap satu-satunya otoritas nyata.
- [ ] Jangan pernah menaruh data sensitif yang tidak dilindungi API di
      client state. Tidak ada yang berubah di sini — masih berlaku sebagai
      prinsip umum, bukan item yang "selesai".
- [ ] Pertimbangkan menambah `role` check juga di route handler (jika
      memakai strategi A) supaya halaman non-admin tidak ter-render.
      **Tidak berlaku** — strategi A belum diambil (lihat S1).

### S5. Error detail backend tampil mentah

**Lokasi:** `src/lib/api.ts:51-54` mengambil `detail`/`message` langsung;
`src/app/login/page.tsx:43` menampilkan `data.detail`.

**Rekomendasi:**
- [x] Log `detail` ke console/error-reporting; tampilkan ke user pesan
      generik ("Permintaan gagal. Coba lagi.") kecuali untuk error 401/403.
      Implementasi: `getSafeErrorMessage()` di `src/lib/api.ts`, dipakai di
      semua `toast.error(...)` yang sebelumnya menampilkan `err.message`
      mentah (`document-review-card.tsx`, `chat-panel.tsx`,
      `verifications/[shopId]/page.tsx`), plus penanganan setara di
      `src/app/login/page.tsx` (yang tidak lewat `apiFetch`).
- [x] Pastikan tidak ada field sensitif (email, token parsial) yang bocor ke
      UI. Diperiksa — tidak ada tempat lain yang menampilkan `body`/`detail`
      mentah selain yang sudah disanitasi di atas.

### S6. Cookie tanpa `Secure` di HTTP

**Lokasi:** `src/lib/auth.ts:13` — `Secure` hanya ditambahkan bila protokol
`https:`.

**Rekomendasi:**
- [x] Karena production pasti HTTPS (Vercel), selalu set `Secure` (hapus
      kondisi). Catatan uji: `Secure` tetap berhasil di-set saat dev di
      `http://localhost` (browser modern memperlakukan localhost sebagai
      secure context terlepas dari skema), tapi TIDAK akan ter-set kalau
      dev server diakses lewat IP LAN non-HTTPS (mis. `http://192.168.x.x`)
      — batasan yang disengaja sesuai rekomendasi dokumen ini.
- [ ] Jika strategi A: cookie httpOnly + `Secure` + `SameSite=Strict`/`Lax`.
      **Tidak berlaku** — strategi A belum diambil (lihat S1).

### S7. Sesi tanpa refresh — UX keamanan

- [x] Saat 401: `src/lib/api.ts:38` sudah redirect ke `/login?next=...` —
      dipertahankan, tidak diubah.
- [ ] Pertimbangkan banner "Sesi berakhir" alih-alih redirect paksa, supaya
      admin paham bukan bug. **Belum dikerjakan** — murni UX, bukan celah
      keamanan; di luar cakupan update ini kecuali diminta terpisah.

---

## 3. Checklist Pra-Deploy (wajib sebelum produksi)

- [x] `npm run lint` bersih, `npm run build` sukses. Diverifikasi 2026-08-15
      (0 error; 1 warning pra-eksisting di `src/lib/api.ts` soal
      `window.location.href`, di luar cakupan update ini).
- [x] Tidak ada secret/connection string Mongo di mana pun di repo ini
      (AGENT_BRIEF §2) — `grep -ri "mongodb" src/ .env*` sudah dijalankan
      ulang, hasil kosong.
- [x] `.env.local` berisi hanya `NEXT_PUBLIC_API_BASE_URL`; tidak boleh ada
      JWT secret / Durianpay key. Diverifikasi isinya + `git ls-files` untuk
      memastikan `.env.local` tidak pernah ter-commit (sudah di `.gitignore`).
- [ ] Semua admin memakai password kuat + 2FA (kalau backend mendukung).
      **Tindakan manual** — bukan sesuatu yang bisa diverifikasi/diubah dari
      kode di repo ini.
- [ ] Konfirmasi ke pemilik backend: `/admin/*` semua mewajibkan token admin,
      CORS dibatasi dari `*` ke domain dashboard. **Tindakan manual** — perlu
      konfirmasi dari pemilik backend, di luar cakupan repo ini.
- [ ] Backup/review siapa saja yang punya akses deploy (Vercel) — akses ke
      Vercel = akses ke env vars. **Tindakan manual** — proses organisasi,
      bukan perubahan kode.

---

## 4. Referensi File

| File | Peran |
|---|---|
| `src/lib/auth.ts` | Token lifecycle (S1, S6) |
| `src/proxy.ts` | Route guard (S1, S4) |
| `src/lib/api.ts` | API client + handling 401 (S5, S7) |
| `src/app/login/page.tsx` | Login + cek role (S3, S4, S5) |
| `.env.local` / `.env.local.example` | Env vars (checklist deploy) |
