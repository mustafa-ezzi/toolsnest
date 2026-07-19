# ToolsNest — Research & Development (RnD)

**Product:** ToolsNest Hardware E-Commerce  
**Version:** 1.0 · July 2026

Related: [PRD](./PRD.md) · [REPLIT-UI](./REPLIT-UI.md) · [PHASES](./PHASES.md)

---

## 1. Architecture Decision

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  React (Vite)   │ ─────────────► │  Django REST API │
│  Railway svc    │                │  Railway svc     │
│  toolsnest.tools│                │  api.toolsnest…  │
└─────────────────┘                └────────┬─────────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     ▼                      ▼                      ▼
              PostgreSQL              Cloudflare R2           Env secrets
              (Railway)               (images/media)          (Railway vars)
```

**Why this stack**

| Choice | Rationale |
|--------|-----------|
| React + Vite | Fast SPA, easy component UI, Replit/design handoff |
| Django + DRF | Strong admin auth, ORM, validation, batteries-included |
| PostgreSQL | Reliable relational model for products/orders |
| R2 | S3-compatible, cheap egress, CDN-friendly for product images |
| Railway Hobby | One project: web + API + Postgres; custom domains supported |

---

## 2. Frontend RnD Notes

- **Router:** React Router
- **State:** Context or Zustand for cart (persist `localStorage`)
- **Styling:** Tailwind CSS recommended (speed + consistent spacing); CSS variables for brand colors at section level
- **Carousel:** Embla / Swiper / lightweight custom
- **Marquee:** CSS animation (`@keyframes`) — no heavy lib
- **Charts (admin):** Recharts
- **Forms:** React Hook Form + Zod (or simple controlled forms in MVP)
- **HTTP:** Axios or Fetch wrapper with base URL from env

---

## 3. Backend RnD Notes

- Django 5.x + Django REST Framework
- Auth: SimpleJWT for admin SPA, or Django session + CSRF if cookie-based
- Image upload: python `boto3` / `django-storages` → R2 endpoint
- Order number: generate server-side (unique, human-readable)
- Soft-delete optional; MVP prefer `is_active=False` over hard-delete when order history exists
- CORS: allow frontend origin only

---

## 4. Image Strategy (Cloudflare R2)

1. Admin uploads file via `POST /api/admin/upload/`
2. Backend stores object in R2 bucket with key like `products/{uuid}.webp`
3. Return public URL (`https://media.toolsnest.tools/...` or R2 public bucket URL)
4. Store URL on ProductImage / Banner / Brand

**Env vars:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`

---

## 5. Security RnD

- Never expose R2 secret keys to frontend
- Rate-limit `POST /api/orders/` lightly
- Sanitize admin HTML if rich text added later
- HTTPS everywhere via Railway certs

---

## 6. UX Research Directions

- Hardware shoppers scan by **brand** and **tool type** — prioritize filters + visual brand strips
- Trust signals on checkout: phone support link, clear “no login needed”
- Admin: dense tables OK; large tap targets on mobile for status actions

---

## 7. Railway Hobby Constraints

- Usage-based; keep services lean
- Hobby allows **custom domains** (up to **2 custom domains per service**)
- Prefer 2 services: `frontend`, `backend` + managed Postgres plugin
- Avoid storing uploads on ephemeral container disk — use R2
- Sleep/idle behavior: Hobby may cold-start; keep healthchecks simple

---

## 8. Deployment & Custom Domain

### 8.1 Recommended Railway Layout

| Service | What |
|---------|------|
| `toolsnest-web` | React build (static serve / Nginx / `vite preview` / Caddy) |
| `toolsnest-api` | Django + Gunicorn / Uvicorn |
| `Postgres` | Railway plugin |

**Env on API:** `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ORIGINS`, R2 keys, `FRONTEND_URL`  
**Env on Web:** `VITE_API_URL=https://api.toolsnest.tools` (or single-domain reverse proxy pattern)

### 8.2 Can you host `toolsnest.tools` on Railway frontend?

**Yes.** Railway supports custom domains on Hobby plan (limit: **2 custom domains per service**). Attach `toolsnest.tools` (and optionally `www.toolsnest.tools`) to the **frontend** service. Railway issues Let’s Encrypt SSL automatically after DNS verification.

**Suggested DNS setup**

1. In Railway → Frontend service → **Settings → Public Networking → Custom Domain** → add `toolsnest.tools`
2. Railway shows a **CNAME** and a **TXT** (`_railway-verify...`) — **both required**
3. At your DNS provider (Cloudflare recommended since you use R2):
   - Add CNAME → Railway target
   - Add TXT verification record
4. If using Cloudflare proxy: keep proxy **DNS only (grey cloud)** until Railway shows domain **Active**, then optionally enable proxy; set SSL mode to **Full**
5. Optionally add `api.toolsnest.tools` on the **API** service (counts as a custom domain on that service)

**Apex domain note:** Some DNS hosts need CNAME flattening (Cloudflare supports this).

**Hobby limits**

- Trial: 1 custom domain — Hobby is better for real launch
- Hobby: **2 custom domains per service** — enough for `toolsnest.tools` + `www.toolsnest.tools` on frontend, and `api.toolsnest.tools` on API separately

### 8.3 Cloudflare R2 + Domain

- Bucket for media: `toolsnest-media`
- Optional custom media host: `media.toolsnest.tools` → R2 public access / custom domain in Cloudflare
- Frontend never uploads to R2 directly in production; API signs/uploads

### 8.4 Launch Checklist

- [ ] API + Web + Postgres on Railway
- [ ] Migrations run
- [ ] R2 upload verified
- [ ] `toolsnest.tools` Active + HTTPS
- [ ] CORS locked to production origin
- [ ] Admin password rotated
- [ ] Test order placed end-to-end
- [ ] Mobile responsive spot-check

---

## 9. Suggested Folder Structure

```
toolsnest/
  frontend/                 # React + Vite
    src/
      components/
      pages/
        Landing.jsx
        Products.jsx
        ProductDetail.jsx
        Cart.jsx
        Checkout.jsx
        About.jsx
        Support.jsx
        admin/...
      context/CartContext.jsx
      api/
  backend/                  # Django
    config/
    catalog/                # brands, products, categories, banners
    orders/
    accounts/
    media_upload/           # R2
  docs/
    README.md
    PRD.md
    RND.md
    REPLIT-UI.md
    PHASES.md
```
