# PangkasKAKA — SuperAdmin Dashboard: Agent Brief

This file is a self-contained brief for an AI coding agent starting a brand-new
project in this folder. Read it fully before writing any code. If anything
here conflicts with what you find once you start, stop and ask the human
rather than guessing.

## 1. Context

PangkasKAKA is a barbershop booking platform for Kupang, NTT (Indonesia) — a
React Native/Expo mobile app (customer, owner, karyawan/barber roles) backed
by a FastAPI + MongoDB backend, deployed on Railway. The mobile app and
backend already exist and are **not part of this project** — they live in a
separate repo (`D:\APP-PangkasKAKA`) that you do not have access to and must
not assume you can edit.

There is a 4th role in the system, `admin`, whose job is to verify new shop
registrations, moderate the platform, and monitor operations. Today that role
has **no dedicated interface** — the mobile app's UI only exposes
customer/owner/karyawan screens. This project builds a **separate web
dashboard** for that admin role.

## 2. Scope & architectural boundary

- This is a **new, independent project** in this folder, with its own git
  history, own deploy target, own repo. Do not try to merge it into or run it
  from `D:\APP-PangkasKAKA`.
- It talks to the **existing production backend exclusively over HTTPS**,
  using the same REST API the mobile app already uses. It must **never**
  connect to MongoDB directly, and must never embed a Mongo connection string
  or any backend secret (JWT secret, Durianpay keys, etc.) in this project.
  All data access goes through the API, using a logged-in admin's Bearer
  token, exactly like the mobile app does.
- Production API base URL: `https://app-pangkaskaka-production.up.railway.app/api`
- The API is public internet-reachable, CORS is currently open (`*`), so
  browser-based calls from this dashboard's own domain will work without
  backend changes for everything listed under "Endpoints that already exist"
  below.

### If a feature needs an endpoint that doesn't exist yet

Section 4 below marks several needed endpoints as **missing**. Those require
adding a few routes to `D:\APP-PangkasKAKA\backend\server.py` — a file in the
*other* repo. You cannot make that change yourself from this project folder.
When you reach a feature that depends on a missing endpoint:
1. Don't stub around it with direct DB access or guessed shapes.
2. Tell the human exactly which endpoint(s) are missing (method + path +
   expected request/response shape, drafted from the patterns in Section 4),
   so they can have it added in the backend repo in a separate session.
3. Build everything else first; treat missing-endpoint features as the last
   phase, not a blocker for the rest of the dashboard.

## 3. Auth

The backend uses stateless JWT bearer auth, identical for every role.

- `POST /auth/login` — body `{ "email": string, "password": string }` —
  returns `{ "token": string, "user": {...} }`. `user.role` must be `"admin"`
  for this dashboard; if it isn't, reject the login client-side with a clear
  message (the API itself doesn't scope login by role — it'll happily return
  a token for any valid account, but every `/admin/*` endpoint will 403 a
  non-admin token).
- Send `Authorization: Bearer <token>` on every subsequent request.
- Token expiry is controlled by the backend (`JWT_EXP_HOURS`); handle 401s by
  redirecting to login, don't try to refresh silently (there's no refresh
  endpoint).
- There is currently no way to self-register as admin through the mobile
  app's UI, but **the registration endpoint itself does not validate the
  `role` field it's given** — this is a known gap in the other repo (out of
  scope to fix from here, but flag it to the human if it comes up; a
  real admin-facing surface makes that gap higher-stakes than it was before).
- Get your own admin login by asking the human — they'll create the account
  directly in the database, or tell you the credentials to test with. Do not
  attempt to create one yourself via the API.

## 4. Backend API reference

All paths below are relative to `/api`. All require `Authorization: Bearer
<admin token>` unless noted.

### Already exist — build on these directly

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | KPI summary: `{ stats: { total_shops, pending_verifications, total_customers, revenue_today } }` |
| GET | `/admin/pending-shops` | Shops awaiting verification, each with `.owner` (name/email/phone) joined in |
| POST | `/admin/shops/{shop_id}/verify` | Body `{ decision: "approved"\|"rejected", note?: string }` — note required on reject |
| POST | `/admin/shops/{shop_id}/suspend` | Body `{ reason?: string }` — also auto-cancels that shop's active bookings |
| POST | `/admin/shops/{shop_id}/documents/{doc_key}/review` | Per-document approve/reject. `doc_key` ∈ `ktp\|nib\|npwp\|surat_usaha\|toko`. Body shape: check `DocReviewIn` in server.py, roughly `{ status: "valid"\|"invalid"\|"needs_revision", note?: string }` |
| GET | `/admin/users?role=&search=&page=&size=` | Paginated user list, filterable by role and search string |
| GET | `/analytics/admin` | Growth %, revenue trend, avg rating, "at risk" shops (rating dropped >0.5 in a week), kecamatan distribution — see server.py for the exact response shape before building charts against it |
| PUT | `/admin/recruitment/criteria` | Update the weighted scoring criteria owners use to evaluate karyawan applicants |
| POST | `/chat/threads/{shop_id}/close` | Close a shop's verification chat thread |
| GET | `/chat/threads` / `/chat/threads/{shop_id}` | List/read shop verification chat threads (admin can see all; used for the doc-review conversation with an owner) |
| POST | `/chat/threads/{shop_id}/messages` | Send a message in a shop's verification thread |
| GET | `/shops/{shop_id}` | Full shop detail (use this alongside pending-shops / users to drill into one shop) |

Shop documents are stored two ways on the barbershop record — a flat
`doc_ktp` / `doc_nib` / `doc_npwp` / `doc_surat_usaha` / `doc_toko` (base64 or
URL string, for quick display), and a structured `docs` object keyed the same
way with `{ url, status, note, reviewed_at, reviewed_by }` per document (this
is what the review endpoint updates). Use `docs` for status/history, the flat
fields for rendering the image.

### Missing — need to be added to the backend before these features work

| Feature | Suggested endpoint | Notes |
|---|---|---|
| All-shops list (not just pending) — needed to suspend an already-approved shop, or browse the full shop directory | `GET /admin/shops?status=&search=&page=` | Public `/shops` only returns approved+verified shops; there's currently no admin listing of everything |
| Payment / webhook monitoring — see failed payments, stuck webhooks, Durianpay transaction history | `GET /admin/payments?status=&page=` | No admin-facing payment listing exists at all today; this is genuinely new backend work, not just missing a filter |
| Audit log of admin actions (who approved/rejected/suspended what, when) | New `admin_audit_log` collection + `GET /admin/audit-log` + write on every admin mutation | Doesn't exist yet in any form — every admin action above currently leaves no trace of *which* admin did it |
| Booking oversight across all shops (for dispute resolution) | `GET /admin/bookings?shop_id=&status=&search=&page=` | No cross-shop booking listing exists; today bookings are only queryable per-customer or per-owner |

Don't build UI shells for these ahead of the endpoints existing — sequence
them last, and hand off the endpoint spec to the human first.

## 5. Recommended stack

- **Next.js (App Router) + TypeScript** — same JS/TS ecosystem as the mobile
  app, so it's a shallow context switch for whoever maintains both.
- **Tailwind CSS + shadcn/ui** — fast to build data-table-and-form-heavy
  admin UI without hand-rolling components.
- **TanStack Query** for API data fetching/caching, **TanStack Table** for
  the shop/user/booking list views.
- **Deploy to Vercel** — zero-config for Next.js, generous free tier, no
  reason to look elsewhere for a single-tenant internal tool.
- Auth state: store the JWT in an httpOnly-ish pattern isn't possible for a
  pure client-side SPA calling a separate API origin — a plain secure cookie
  or `localStorage` + middleware-based route guard is fine here, this is an
  internal tool, not a public-facing auth surface. Redirect to `/login`
  whenever a request 401s.

If the human already has a strong stack preference, defer to them — this is
a recommendation, not a requirement baked into the API contract.

## 6. Page structure

1. **`/login`** — email/password, calls `/auth/login`, rejects non-admin
   roles client-side, stores token.
2. **`/` (dashboard home)** — KPI cards from `/admin/dashboard`, growth
   figures and charts from `/analytics/admin`.
3. **`/verifications`** — queue from `/admin/pending-shops`; click into a
   shop to review its 5 documents individually (approve/reject each via the
   per-document endpoint), see the owner's verification chat thread inline,
   and issue the final approve/reject via `/admin/shops/{id}/verify`.
4. **`/shops`** *(blocked on missing endpoint)* — full shop directory,
   suspend action.
5. **`/users`** — searchable/filterable list from `/admin/users`, by role.
6. **`/recruitment`** — edit the scoring criteria weights via
   `/admin/recruitment/criteria`.
7. **`/payments`** *(blocked on missing endpoint)* — transaction/webhook
   monitoring.
8. **`/bookings`** *(blocked on missing endpoint)* — cross-shop booking
   search, for dispute support.
9. **`/audit-log`** *(blocked on missing endpoint)*.

## 7. Suggested build order

Not a fixed deadline — sequence by dependency and risk, cheapest/most
valuable first:

1. **Phase 0** — scaffold (Next.js + Tailwind + shadcn init), login page,
   auth guard, deploy pipeline proven end-to-end (empty dashboard shell live
   on Vercel) before building real screens.
2. **Phase 1** — Dashboard home + Verifications queue (the actual reason this
   project exists — ship this before anything else).
3. **Phase 2** — Users list, Recruitment criteria editor.
4. **Phase 3** — Analytics charts (`/analytics/admin`).
5. **Phase 4** — hand off the 4 missing-endpoint specs to the human, then
   build Shops directory, Payments, Bookings, Audit log once those land.

## 8. First steps for you, the agent

1. Confirm this plan (or your adjustments to it) with the human before
   scaffolding anything.
2. Ask them for an admin login to test against, and confirm the production
   API base URL above is still correct.
3. Scaffold Phase 0, get a deployed empty shell working, *then* start on
   real screens — don't build for hours before the human can see anything
   running.
