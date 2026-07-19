# ToolsNest — Phased Development Plan

**Product:** ToolsNest Hardware E-Commerce  
**Version:** 1.0 · July 2026

Related: [PRD](./PRD.md) · [RND](./RND.md) · [REPLIT-UI](./REPLIT-UI.md)

Use this as the build backlog. Finish a phase’s **exit criteria** before starting the next.

---

## Timeline Overview

| Phase | Focus | Approx. |
|-------|--------|---------|
| 0 | Foundations | 3–5 days |
| 1 | Catalog + admin auth | 5–8 days |
| 2 | Storefront UI | 7–10 days |
| 3 | Cart checkout + orders | 5–7 days |
| 4 | Reports + banners | 5–7 days |
| 5 | Deploy + domain | 4–6 days |
| 6+ | Growth features | Ongoing |

**Realistic MVP:** Phases 0–5 ≈ **5–7 weeks** part-time / **3–4 weeks** focused full-time.

---

## Phase 0 — Foundations (3–5 days) ✅ Done

**Goals:** Repo, environments, skeleton apps.

- Monorepo or twin repos: `frontend/` (React Vite), `backend/` (Django)
- PostgreSQL local + Railway project created
- Env templates (`.env.example`)
- CORS + health endpoints
- Tailwind + router shell (empty pages)
- CI optional (lint)

**Exit criteria:** Frontend and API deployable to Railway separately; `/api/health/` returns OK.

---

## Phase 1 — Core Catalog Data + Admin Auth (5–8 days) ✅ Done

**Goals:** Brands, categories, products, images.

- Models: Brand, Category, Product, ProductImage, AdminUser
- Admin JWT/login
- Product CRUD APIs + Django admin fallback optional
- R2 upload endpoint wired
- Seed script: 4–5 brands with real colors + sample products

**Exit criteria:** Admin can log in, upload image, create/edit/delete product, list products.

---

## Phase 2 — Customer Storefront UI (7–10 days) ✅ Done

**Goals:** Pixel-polished customer UX (from Replit UI or rebuild to match [REPLIT-UI.md](./REPLIT-UI.md)).

- Landing: carousel, marquee, brand sections (dynamic from API)
- Products list + detail
- About + Support pages
- Cart context + `localStorage`
- Responsive QA

**Exit criteria:** Browse entire catalog, add to cart, cart persists on refresh.

---

## Phase 3 — Checkout & Orders (5–7 days) ✅ Done

**Goals:** End-to-end purchase flow.

- Checkout form validation
- `POST /api/orders/` creates Order + OrderItems
- Order confirmation page
- Admin orders list/detail + status updates
- Email notification optional (Phase 3b: transactional email later)

**Exit criteria:** Guest can place order; admin sees it and can change status.

---

## Phase 4 — Admin Polish + Reports + Banners (5–7 days) ✅ Done

**Goals:** Production-ready admin.

- Dashboard KPIs
- Sales reports (date range, revenue, top products)
- Banners CRUD (drives landing carousel)
- Brands/categories management UI polish
- Empty/loading/error states

**Exit criteria:** Non-developer can run store day-to-day from admin alone.

---

## Phase 5 — Hardening & Launch (4–6 days) ⏭ Skipped (domain pending)

**Goals:** Production on Railway + domain.

*(Deferred until `toolsnest.tools` is purchased.)*

---

## Phase 6 — Enhancements (ongoing) ✅ In progress / shipped first batch

Suggested first: search, WhatsApp order share, promo codes, customer order lookup by phone + email.

### Shipped in this phase

- Order lookup (`/track-order`)
- Floating WhatsApp help button
- Featured / New / Sale badges
- Related products on detail page
- Admin CSV export (products + orders)
- Low-stock alert on dashboard
- Promo / coupon codes (`TOOLS10` seeded — 10% off)

### High value / relatively easy

| Feature | Why |
|---------|-----|
| **Order lookup** (email + phone → status) | Customers track without accounts |
| **WhatsApp “Order help” button** | Hardware buyers prefer chat |
| **Featured / New / Sale badges** | Merchandising |
| **Related products** on detail page | Higher AOV |
| **SKU search** | Trade buyers know SKUs |
| **Admin CSV export** (orders/products) | Accounting |
| **Low-stock alerts** in admin | Ops |

### Medium effort

| Feature | Why |
|---------|-----|
| **Promo / coupon codes** | Campaigns |
| **Customer accounts** + order history | Retention |
| **Wishlist** | Return visits |
| **Product reviews** (moderated) | Trust |
| **Multi-currency / PKR formatting polish** | Local market |
| **Invoice PDF** download | B2B |
| **SMS order status** | Fulfillment |

### Larger / later

| Feature | Why |
|---------|-----|
| **Online payments** (Stripe / PayFast / JazzCash / EasyPaisa) | Scale |
| **Delivery zones + shipping fees** | Accurate checkout |
| **Inventory reservations** | Over-sell prevention |
| **Multi-admin roles** (staff vs owner) | Team |
| **Abandoned cart nudges** | Recover sales |
| **Blog / tips** (tool guides) | SEO |
| **PWA install** | Mobile return visits |
