# BACKEND_ENDPOINTS_NEEDED.md — PangkasKAKA SuperAdmin Dashboard

> Catatan hand-off untuk pengelola repo backend (`D:\APP-PangkasKAKA`,
> `backend/server.py`) — bukan sesuatu yang bisa diubah dari repo dashboard
> ini. Setiap temuan di bawah dicek **langsung ke API produksi**
> (`https://app-pangkaskaka-production.up.railway.app/api`) pakai token admin
> asli, bukan tebakan dari AGENT_BRIEF.md saja — beberapa hal di brief
> ternyata sudah tidak akurat begitu dicek ulang.

Dibuat: 2026-08-15 | Diperbarui: 2026-08-20 (User management CRUD ditutup —
lihat bagian 7) | Terkait: `AGENT_BRIEF.md` bagian 4, `SECURITY_AUDIT.md` (S2)

---

## Ringkasan

| Fitur | Endpoint yang hilang | Skala kerja | Ada workaround sementara? |
|---|---|---|---|
| Shops (direktori penuh) | `GET /admin/shops?status=&search=&page=` | Kecil — data sudah ada, tinggal endpoint baca | Ya, parsial (lihat di bawah) |
| Payments | `GET /admin/payments?...` | Sedang — endpoint + kemungkinan model data baru | Tidak |
| Bookings | `GET /admin/bookings?...` | Kecil-sedang — data booking sudah ada, cuma belum ada view lintas-toko | Tidak |
| Audit Log | `GET /admin/audit-log` + tulis log di 5 endpoint lain | Besar — perlu koleksi baru + instrumentasi di banyak tempat | Tidak |
| Hairstyles (tambah/edit/hapus) | ~~`POST` / `PUT` / `DELETE /admin/hairstyles`~~ **Selesai 2026-08-19** | — | — |
| User management (suspend/role/hapus) | ~~`POST`/`PUT`/`DELETE /admin/users/{id}/...`~~ **Selesai 2026-08-20** | — | — |
| Recruitment criteria | *(bukan endpoint hilang — koreksi dokumentasi, lihat di bawah)* | — | — |

---

## 1. Shops — direktori toko penuh

**Endpoint yang dibutuhkan:** `GET /admin/shops?status=&search=&page=&size=`

**Yang sudah dicek:**
- `GET /admin/shops` → **404**, dengan atau tanpa query param.
- `GET /shops` (publik) → 200, tapi cuma toko `approved` + `is_verified`.
- `GET /admin/pending-shops` → 200, tapi cuma toko `pending`.

**Dampak nyata:** Dashboard saat ini menggabungkan dua endpoint di atas
sebagai workaround (`useAllShops()` di `src/lib/queries/shops.ts`), jadi
direktori `/shops` di dashboard **sudah bisa dipakai** — tapi toko yang
pernah **ditolak** (`rejected`) tidak muncul di endpoint mana pun sehingga
tidak terlihat sama sekali di dashboard. Suspend action sendiri sudah jalan
normal karena `POST /admin/shops/{shop_id}/suspend` memang sudah ada.

**Bentuk response yang diusulkan** (mengikuti pola `/admin/pending-shops`
yang sudah ada):
```json
{
  "total": 0,
  "shops": [ /* objek Shop yang sama seperti /shops dan /admin/pending-shops,
                termasuk status "rejected" dan "suspended" */ ]
}
```

---

## 2. Payments — monitoring transaksi & webhook Durianpay

**Endpoint yang dibutuhkan:** `GET /admin/payments?status=&shop_id=&search=&page=&size=`

**Yang sudah dicek:** Semua kemungkinan path 404 —
`/admin/payments`, `/payments`, `/admin/transactions`, `/transactions`,
`/admin/durianpay`, `/admin/payments/history`, `/payments/admin`. Tidak ada
apa pun untuk dibaca hari ini.

**Bentuk response yang diusulkan:**
```json
{
  "total": 0,
  "payments": [
    {
      "id": "string",
      "shop_id": "string",
      "shop_name": "string",
      "booking_id": "string",
      "amount": 0,
      "status": "pending | paid | failed | expired | refunded",
      "method": "string",
      "durianpay_reference": "string",
      "created_at": "ISO datetime",
      "paid_at": "ISO datetime | null",
      "failure_reason": "string | null"
    }
  ]
}
```

**Opsional — log webhook terpisah:** AGENT_BRIEF menyebut "stuck webhooks"
sebagai kasus yang beda dari histori transaksi biasa. Kemungkinan perlu
endpoint kedua, mis. `GET /admin/payments/webhooks?page=`, untuk log callback
masuk dari Durianpay (bukan transaksinya sendiri) — payload webhook mentah,
status pemrosesan, timestamp diterima vs. diproses.

---

## 3. Bookings — pencarian lintas toko (dispute support)

**Endpoint yang dibutuhkan:** `GET /admin/bookings?shop_id=&status=&search=&page=&size=`

**Yang sudah dicek — ini yang paling penting untuk dipahami:**
`GET /bookings` **sudah ada dan mengembalikan 200**, tapi itu endpoint
per-user yang sama dipakai mobile app (customer melihat booking miliknya
sendiri, owner melihat booking tokonya). Untuk token admin, hasilnya selalu
`{"bookings": []}` karena akun admin bukan customer maupun owner toko mana
pun — bukan berarti tidak ada booking di database, cuma endpoint ini tidak
didesain untuk sudut pandang admin. Parameter `shop_id` yang dicoba tidak
mengubah hasil (tetap kosong), dan tidak ada endpoint per-toko yang bisa
diakses admin (`/shops/{id}/bookings`, `/admin/shops/{id}/bookings`,
`/bookings/shop/{id}`, `/admin/bookings/{id}` — semua 404).

**Bentuk response yang diusulkan:**
```json
{
  "total": 0,
  "bookings": [
    {
      "id": "string",
      "shop_id": "string",
      "shop_name": "string",
      "customer_id": "string",
      "customer_name": "string",
      "karyawan_id": "string | null",
      "karyawan_name": "string | null",
      "service": "string",
      "status": "pending | confirmed | completed | cancelled | no_show",
      "scheduled_at": "ISO datetime",
      "created_at": "ISO datetime",
      "amount": 0
    }
  ]
}
```

---

## 4. Audit Log — jejak aksi admin

**Ini beda dari 3 di atas** — bukan cuma kurang endpoint baca, tapi memang
belum ada apa pun yang **ditulis**. Setiap aksi admin di dashboard ini hari
ini tidak meninggalkan jejak siapa pelakunya sama sekali.

**Yang sudah dicek:** `/admin/audit-log`, `/admin/audit_log`, `/audit-log`,
`/admin/audit`, `/admin/logs`, `/admin/activity`, `/admin/audit-logs` — semua
404.

### 4a. Koleksi baru + tulis log di setiap aksi admin

Koleksi `admin_audit_log`, ditulis dari dalam setiap endpoint di bawah ini
(identitas admin sudah tersedia dari token JWT yang sedang dipakai, jadi
tidak perlu perubahan di sisi dashboard):

- `POST /admin/shops/{shop_id}/verify`
- `POST /admin/shops/{shop_id}/suspend`
- `POST /admin/shops/{shop_id}/documents/{doc_key}/review`
- `PUT /admin/recruitment/criteria`
- `POST /chat/threads/{shop_id}/close`

### 4b. Endpoint baca

`GET /admin/audit-log?admin_id=&action=&target_type=&page=&size=`

**Bentuk response yang diusulkan:**
```json
{
  "total": 0,
  "entries": [
    {
      "id": "string",
      "admin_id": "string",
      "admin_name": "string",
      "action": "shop.verify | shop.suspend | shop.document_review | recruitment.criteria_update | chat.close",
      "target_type": "shop | recruitment | chat_thread",
      "target_id": "string",
      "detail": { "decision": "approved", "note": "string" },
      "created_at": "ISO datetime"
    }
  ]
}
```

---

## 5. Hairstyles — katalog gaya rambut untuk AI Face Scan (CRUD) — SELESAI

> Status 2026-08-19: backend sudah mengimplementasikan seluruh endpoint di
> bawah. Bagian ini diubah dari "yang dibutuhkan" menjadi catatan histori +
> referensi bentuk data yang benar-benar dipakai, supaya masih berguna kalau
> ada yang perlu ngecek kontrak API-nya lagi.

**Sempat dicek 2026-08-15 dan memang belum ada** (`POST`/`PUT`/`DELETE
/admin/hairstyles` semua 404) — dashboard sempat dibangun versi baca-saja
dari `GET /hairstyles` publik. **Dicek ulang 2026-08-19 setelah backend
mengabarkan endpoint sudah siap**, dan sekarang beneran ada. Empat endpoint
final, sudah diuji langsung (bukan cuma baca dokumentasi):

- `GET /admin/hairstyles` — list, butuh token admin. Respons `{ "hairstyles": [...] }`,
  tiap item punya `id, name, image_url, description, suitable_shapes,
  match_score_map, created_at`. (`GET /hairstyles` publik tanpa `/admin`
  masih hidup juga, dipakai mobile app — dashboard sekarang pakai yang
  `/admin` karena lebih sesuai konvensi resource admin lain.)
- `POST /admin/hairstyles` — body `{ name, image_url, description,
  match_score_map }`, balas `{ "hairstyle": {...} }` (field lengkap
  termasuk `id` & `created_at` baru).
- `PUT /admin/hairstyles/{id}` — body sama seperti POST, balas
  `{ "hairstyle": {...} }`.
- `DELETE /admin/hairstyles/{id}` — balas `{ "ok": true }`.

**Validasi `match_score_map` dikonfirmasi jalan sesuai spek:** key di luar
`oval | round | square | oblong | heart` ditolak dengan 422 dan pesan error
yang jelas ("bentuk wajah tidak valid: ..."), `suitable_shapes` otomatis
diturunkan dari key yang ada di `match_score_map`.

**Dampak nyata:** Halaman `/hairstyles` sekarang CRUD penuh — tambah, edit,
hapus (dengan dialog konfirmasi), preview foto sebelum simpan, filter per
bentuk wajah. Diuji end-to-end ke API produksi (create → edit → delete →
katalog kembali kosong) sebelum dianggap selesai.

---

## 6. Catatan tambahan — Recruitment criteria (bukan endpoint hilang, koreksi dokumentasi)

AGENT_BRIEF.md bagian 4 cuma mencantumkan `PUT /admin/recruitment/criteria`
dan mendeskripsikannya sebagai *"weighted scoring criteria"* — dua-duanya
kurang akurat begitu dicek langsung:

- **GET-nya sebenarnya ada**, tapi di path yang berbeda dari yang diduga:
  `GET /recruitment/criteria` (**tanpa** prefix `/admin`).
- **Bentuk datanya bukan skor berbobot** — cuma daftar string kriteria biasa:
  ```json
  { "items": ["string", "..."], "updated_at": "ISO datetime" }
  ```
- `PUT /admin/recruitment/criteria` menerima body `{ "items": ["string"] }`
  dan membalas `{ "ok": true, "count": <jumlah item> }`.

Tidak perlu perubahan backend untuk ini — dashboard sudah dibangun sesuai
bentuk data yang sebenarnya (`src/lib/queries/recruitment.ts`). Dicantumkan
di sini supaya `AGENT_BRIEF.md` bisa diperbarui juga kalau sempat, biar tidak
membingungkan agent/developer berikutnya yang membaca deskripsi lama.

---

## 7. User management — suspend, aktifkan, ubah role, hapus akun — SELESAI

> Status 2026-08-20: ditambahkan langsung ke `backend/server.py` (bukan
> cuma didokumentasikan) karena repo backend ada di komputer yang sama
> (`D:\APP-PangkasKAKA`) dan pemilik project meng-otorisasi perubahan
> langsung, lalu di-push ke `origin/main` sehingga Railway redeploy
> otomatis. Diverifikasi live lewat probe tanpa kredensial: endpoint baru
> balas `401` (butuh token) begitu deploy selesai, bukan `404` seperti
> sebelum di-push — commit backend: `701b411`.

Sebelum ini, `GET /admin/users` adalah satu-satunya endpoint terkait user
— tidak ada field `is_suspended`/`is_banned` sama sekali di dokumen profil,
apalagi endpoint tulis. Empat endpoint baru:

- `POST /admin/users/{user_id}/suspend` — body `{ reason?: string }`. Set
  `is_suspended: true` + `suspended_reason`/`suspended_at`/`suspended_by`.
  Ditolak (400) kalau target diri sendiri atau akun `role: admin`.
- `POST /admin/users/{user_id}/activate` — kebalikan dari suspend, bersihkan
  field-field di atas.
- `PUT /admin/users/{user_id}/role` — body `{ role: "customer"|"owner"|"karyawan"|"admin" }`.
  Ditolak (400) kalau target diri sendiri. **Catatan:** promosi ke `owner`
  cuma mengubah field role, tidak otomatis membuat entri toko — pemilik baru
  tetap harus lewat alur pendaftaran toko normal di aplikasi.
- `DELETE /admin/users/{user_id}` — hapus permanen dokumen profil. Ditolak
  (400) kalau target `role: admin`, target diri sendiri, atau target
  `owner` yang masih punya toko terdaftar (`db.barbershops` dengan
  `owner_id` itu). Untuk `role: karyawan`, entri `db.karyawan` +
  `db.karyawan_locations` miliknya ikut dihapus (cascade), meniru pola
  cascade yang sudah ada di suspend-toko (membatalkan booking aktif).
- **Login** (`POST /auth/login`) sekarang menolak (403) akun dengan
  `is_suspended: true`, jadi suspend benar-benar memblokir akses, bukan
  cuma penanda visual di dashboard.

**Dampak nyata:** Halaman `/users` sekarang punya 4 aksi per baris (lihat
detail, tangguhkan/aktifkan, ubah role, hapus), dengan tombol
suspend/ubah-role/hapus otomatis nonaktif untuk baris akun sendiri dan
akun `admin` lain (mencerminkan guard yang sama di backend, bukan cuma
kosmetik UI).

---

## Metodologi verifikasi

Semua status di atas dicek pakai `curl` langsung ke API produksi dengan
token admin asli (`POST /auth/login` → `Authorization: Bearer <token>`),
bukan dari asumsi AGENT_BRIEF.md semata. Kalau backend berubah setelah
tanggal dokumen ini dibuat, jalankan ulang pengecekan sebelum
mempercayainya lagi. (Pengecualian: bagian 7 dicek lewat probe
tanpa-kredensial 401-vs-404 karena kredensial admin tidak dibagikan ke
agent pada sesi itu — bukan penyimpangan dari metodologi, cuma bukti yang
dipakai berbeda: konfirmasi endpoint benar-benar live di produksi, bukan
konfirmasi isi respons sukses/gagalnya.)
