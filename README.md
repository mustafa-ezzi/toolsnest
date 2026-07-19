# ToolsNest

Multi-brand hardware e-commerce — React + Django + PostgreSQL.

## Docs

See [`docs/`](./docs/) for PRD, RnD, Replit UI, and phased plan.

## Quick start (local)

### Backend

```bash
# from repo root
.\.venv\Scripts\Activate.ps1   # Windows
cd backend
pip install -r requirements.txt
copy .env.example .env         # first time
python manage.py migrate
python manage.py seed_catalog
python manage.py runserver 8001
```

API: `http://127.0.0.1:8001/api/health/` (port `8001` — change if free)  
Admin login: `POST /api/auth/login/` — default `admin` / `admin123`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://127.0.0.1:5173` (proxies `/api` → `http://127.0.0.1:8001`)

## Phase status

- **Phase 0:** Foundations ✅
- **Phase 1:** Catalog models, JWT auth, CRUD APIs, R2/local upload, seed ✅
- **Phase 2:** Storefront UI (landing, products, cart, animations) ✅
- **Phase 3:** Checkout, orders API, WhatsApp handoff ✅
- **Phase 4:** Admin panel (dashboard, CRUD, reports) ✅
- **Phase 5:** Deploy + domain — skipped until domain purchased
- **Phase 6:** Order lookup, WhatsApp float, badges, related products, coupons, CSV ✅

### Admin panel

Open http://127.0.0.1:5173/admin/login — default `admin` / `admin123`

### Customer extras (Phase 6)

- Track order: http://127.0.0.1:5173/track-order
- Checkout coupon sample: `TOOLS10` (10% off)
