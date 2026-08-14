# SECURITY_AUDIT.md — PangkasKAKA SuperAdmin Dashboard

> Dokumen internal: temuan audit keamanan data & risiko peretasan, serta
> checklist perbaikan manual. Dibuat otomatis dari hasil analisis kode —
> periksa kembali setiap item sebelum/tanpa mengimplementasikannya.

Audit tanggal: 2026-08-15 | Target: `pangkaskaka-admin` (Next.js 16, React 19)
Cakupan: kode frontend dashboard + interaksi dengan backend Railway
(`https://app-pangkaskaka-production.up.railway.app/api`)

---

## 1. Ringkasan Risiko (severity)

| # | Risiko | Severity | Status |
|---|--------|----------|--------|
| S1 | Token JWT disimpan di `localStorage` + cookie non-httpOnly (bisa dibaca JS/XSS) | **Tinggi** | Terbuka |
| S2 | Backend: endpoint registrasi tidak memvalidasi `role` → siapa pun bisa self-register jadi `admin` | **Tinggi** (backend, di luar repo ini) | Terbuka — perlu lapor ke pemilik backend |
| S3 | Tidak ada rate limiting / brute-force protection pada `/auth/login` (klien) | Sedang | Terbuka |
| S4 | Peran admin hanya diverifikasi client-side (login + proxy guard) — semua data tetap diambil langsung dari browser dengan Bearer token | Sedang | Terbuka |
| S5 | Error `detail`/`message` dari backend ditampilkan mentah ke UI | Rendah | Terbuka |
| S6 | Cookie token di-mirror tanpa `Secure` saat HTTP, tanpa `HttpOnly` — rentan saat protokol turun ke HTTP | Rendah | Terbuka |
| S7 | Token tidak punya mekanisme refresh/revoke di sisi frontend (backend: `JWT_EXP_HOURS`) — sesi mati mendadak tanpa notifikasi | Informasional | Terbuka |

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
- [ ] **B. Minimal — batasi jendela paparan (lebih cepat):**
  - [ ] Kurangi umur cookie dari 7 hari → 8 jam (`setCookie(..., 0.33)`).
  - [ ] Jangan simpan `user` lengkap di localStorage; simpan hanya token,
        re-fetch profil dari `/auth/login` bila perlu.
  - [ ] Validasi nyata di `src/proxy.ts`: decode JWT payload (bagian tengah,
        base64url) dan tolak jika `exp` sudah lewat / `role !== "admin"` —
        jangan hanya mengecek keberadaan cookie.
- [ ] Setelah pindah strategi: bersihkan data lama di browser semua admin
      (token lama di localStorage tidak boleh dipakai lagi).

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
- [ ] Tambah backoff: blokir submit 3–5 detik setelah kegagalan ke-2+.
- [ ] Tambah counter kegagalan lokal (localStorage) → kunci form 5 menit
      setelah 5 percobaan gagal.
- [ ] Yang terpenting: minta pemilik backend menambah rate-limit per IP/email
      pada `/auth/login` (backend-side).

### S4. Role hanya diverifikasi di client

**Lokasi:** `src/app/login/page.tsx:48` (cek `user.role !== "admin"`) dan
`src/proxy.ts`.

**Mengapa berisiko:** Guard ini murni UX — siapa pun yang menyalin token admin
(yang valid dari S1) tetap bisa mengakses. API sendiri sudah melindungi
(`/admin/*` → 403 untuk non-admin), jadi ini defense-in-depth:
- [ ] Jangan pernah menaruh data sensitif yang tidak dilindungi API di
      client state.
- [ ] Pertimbangkan menambah `role` check juga di route handler (jika
      memakai strategi A) supaya halaman non-admin tidak ter-render.

### S5. Error detail backend tampil mentah

**Lokasi:** `src/lib/api.ts:51-54` mengambil `detail`/`message` langsung;
`src/app/login/page.tsx:43` menampilkan `data.detail`.

**Rekomendasi:**
- [ ] Log `detail` ke console/error-reporting; tampilkan ke user pesan
      generik ("Permintaan gagal. Coba lagi.") kecuali untuk error 401/403.
- [ ] Pastikan tidak ada field sensitif (email, token parsial) yang bocor ke
      UI.

### S6. Cookie tanpa `Secure` di HTTP

**Lokasi:** `src/lib/auth.ts:13` — `Secure` hanya ditambahkan bila protokol
`https:`.

**Rekomendasi:**
- [ ] Karena production pasti HTTPS (Vercel), selalu set `Secure` (hapus
      kondisi).
- [ ] Jika strategi A: cookie httpOnly + `Secure` + `SameSite=Strict`/`Lax`.

### S7. Sesi tanpa refresh — UX keamanan

- [ ] Saat 401: `src/lib/api.ts:38` sudah redirect ke `/login?next=...` —
      pertahankan.
- [ ] Pertimbangkan banner "Sesi berakhir" alih-alih redirect paksa, supaya
      admin paham bukan bug.

---

## 3. Checklist Pra-Deploy (wajib sebelum produksi)

- [ ] `npm run lint` bersih, `npm run build` sukses.
- [ ] Tidak ada secret/connection string Mongo di mana pun di repo ini
      (AGENT_BRIEF §2) — `grep -ri "mongodb" src/ .env*` harus kosong.
- [ ] `.env.local` berisi hanya `NEXT_PUBLIC_API_BASE_URL`; tidak boleh ada
      JWT secret / Durianpay key. Jangan commit `.env.local` (sudah di
      `.gitignore` — verifikasi ulang).
- [ ] Semua admin memakai password kuat + 2FA (kalau backend mendukung).
- [ ] Konfirmasi ke pemilik backend: `/admin/*` semua mewajibkan token admin,
      CORS dibatasi dari `*` ke domain dashboard.
- [ ] Backup/review siapa saja yang punya akses deploy (Vercel) — akses ke
      Vercel = akses ke env vars.

---

## 4. Referensi File

| File | Peran |
|---|---|
| `src/lib/auth.ts` | Token lifecycle (S1, S6) |
| `src/proxy.ts` | Route guard (S1, S4) |
| `src/lib/api.ts` | API client + handling 401 (S5, S7) |
| `src/app/login/page.tsx` | Login + cek role (S3, S4, S5) |
| `.env.local` / `.env.local.example` | Env vars (checklist deploy) |
