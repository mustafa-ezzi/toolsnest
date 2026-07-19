# ToolsNest — Product Requirements Document (PRD)

**Product:** ToolsNest Hardware E-Commerce  
**Domain:** `toolsnest.tools`  
**Stack:** React · Django · PostgreSQL · Cloudflare R2 · Railway Hobby  
**Version:** 1.0 · July 2026

Related: [RND](./RND.md) · [REPLIT-UI](./REPLIT-UI.md) · [PHASES](./PHASES.md)

---

## 1. Executive Summary

ToolsNest is a multi-brand hardware e-commerce store. Customers browse brand-themed product sections, add items to cart, and check out with full contact/shipping details. Admins manage products, track orders, and view basic sales reports in a polished, responsive dashboard.

**Core goals**

- Look like a premium hardware marketplace (not a generic template)
- Support multiple brands, each with its own color theme (e.g. Total = `#117076`)
- Full cart + checkout without requiring customer accounts in v1 (guest checkout)
- Clean admin CRUD for products, orders, and reports
- Deployable on Railway Hobby with images on Cloudflare R2 and custom domain `toolsnest.tools`

---

## 2. Problem

Hardware buyers shop across many brands (Total, Ingco, Makita, DeWalt, Stanley, etc.). Existing small-store sites are cluttered, brand-blind, and weak on order tracking. ToolsNest should feel brand-aware, trustworthy, and easy to buy from.

---

## 3. Product Vision

A modern multi-brand hardware storefront where brands are first-class: colors, logos, and product sections reinforce identity, while checkout and admin stay simple and reliable.

---

## 4. Target Users

| Persona | Needs |
|--------|--------|
| **Retail customer** | Find tools by brand/category, compare, buy quickly |
| **Trade / workshop buyer** | Repeat orders, clear specs, phone contact |
| **Store admin** | Manage catalog, fulfill orders, see what sells |

---

## 5. Scope — In (MVP)

### Customer site

- Landing page with hero carousel/banners
- Brand logo marquee (continuous left → right)
- Brand-colored product sections
- Product listing + product detail
- Header nav: Products, About Us, Support (+ logo home)
- Cart (add / update qty / remove)
- Checkout form: name, email, phone, address (+ city, notes optional)
- Order confirmation page with order ID
- Responsive mobile / tablet / desktop

### Admin panel

- Auth (admin login)
- Products: Create / Edit / Delete / Get All (list + search/filter)
- Orders: list, status update, detail view
- Sales reports: basic charts + totals (orders, revenue, top products)
- Responsive admin layout

### Platform

- PostgreSQL data model
- Image upload → Cloudflare R2 public URLs
- React SPA + Django REST API
- Railway deployment (frontend + backend + Postgres)

---

## 6. Out of Scope (initial release)

- Customer accounts / wishlist (later phases — see [PHASES.md](./PHASES.md))
- Online payment gateway (COD / bank transfer first; cards later)
- Inventory sync with suppliers
- Multi-warehouse / shipping rate calculators
- Native mobile apps
- Multilingual UI (optional later)

---

## 7. Functional Requirements

### FR-C — Customer

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C01 | Hero carousel with 3–6 banners (image, title, CTA link) | P0 |
| FR-C02 | Scrolling brand logo strip (infinite marquee L→R) | P0 |
| FR-C03 | Landing sections per brand; section chrome uses brand primary color | P0 |
| FR-C04 | Product cards: image, name, brand badge, price, Add to cart | P0 |
| FR-C05 | Product detail: gallery, description, specs, price, qty, Add to cart | P0 |
| FR-C06 | Header: logo, Products, About Us, Support, Cart icon + count | P0 |
| FR-C07 | Cart page: line items, qty edit, remove, subtotal | P0 |
| FR-C08 | Checkout fields: full name, email, phone, address (street, city, area optional), order notes | P0 |
| FR-C09 | Place order creates DB order + line items; shows confirmation | P0 |
| FR-C10 | About Us + Support static/content pages | P1 |
| FR-C11 | Category + brand filter on Products page | P1 |
| FR-C12 | Search products by name/SKU | P1 |

### FR-A — Admin

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A01 | Secure admin login (JWT or session) | P0 |
| FR-A02 | Product CRUD + image upload | P0 |
| FR-A03 | Product list: pagination, search, filter by brand/category | P0 |
| FR-A04 | Orders list + detail + status workflow | P0 |
| FR-A05 | Sales report: revenue, order count, date range, top products | P1 |
| FR-A06 | Manage brands (name, logo, primary color hex) | P0 |
| FR-A07 | Manage banners for carousel | P1 |
| FR-A08 | Manage categories | P1 |

### Order statuses (P0)

`pending` → `confirmed` → `processing` → `shipped` → `delivered` · also `cancelled`

---

## 8. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR01 | Mobile-first responsive UI (320px → 1440px+) |
| NFR02 | API responses targeted under ~500ms for list endpoints (cached where sensible) |
| NFR03 | Images served from R2/CDN, not Railway disk |
| NFR04 | Admin routes protected; XSS/CSRF best practices on forms |
| NFR05 | Accessible basics: alt text, keyboard nav, contrast |
| NFR06 | Railway Hobby–friendly: single Postgres, modest traffic, env-based config |

---

## 9. Data Model (logical)

```
Brand
  id, name, slug, logo_url, primary_color (#hex), secondary_color?, sort_order, is_active

Category
  id, name, slug, parent_id?, is_active

Product
  id, name, slug, sku, brand_id, category_id
  description, specs (JSON or text)
  price, compare_at_price?, stock_qty, is_active, featured
  created_at, updated_at

ProductImage
  id, product_id, url, alt, sort_order

Banner
  id, title, subtitle?, image_url, cta_label?, cta_url?, sort_order, is_active

Order
  id, order_number (e.g. TN-20260715-0042)
  customer_name, email, phone
  address_line, city, area?, notes?
  status, subtotal, total
  created_at, updated_at

OrderItem
  id, order_id, product_id, product_name_snapshot, unit_price, quantity, line_total

AdminUser
  id, email/username, password_hash, is_staff
```

---

## 10. API Surface (Django REST — high level)

```
Public:
  GET  /api/brands/
  GET  /api/categories/
  GET  /api/products/                ?brand=&category=&q=&featured=
  GET  /api/products/:slug/
  GET  /api/banners/
  POST /api/orders/                  # checkout

Admin (auth required):
  POST /api/auth/login/
  CRUD /api/admin/products/
  CRUD /api/admin/brands/
  CRUD /api/admin/categories/
  CRUD /api/admin/banners/
  GET  /api/admin/orders/
  GET  /api/admin/orders/:id/
  PATCH /api/admin/orders/:id/status/
  GET  /api/admin/reports/sales/     ?from=&to=
  POST /api/admin/upload/            # → R2 URL
```

---

## 11. Checkout Fields (validation)

| Field | Required | Rules |
|-------|----------|-------|
| Full name | Yes | 2–100 chars |
| Email | Yes | Valid email |
| Phone | Yes | Digits / + ; local format OK |
| Address | Yes | Street / building |
| City | Yes | Text |
| Area / landmark | No | Text |
| Notes | No | Max ~500 chars |

Cart must be non-empty to submit.

---

## 12. Brand Theme Behavior

- Each `Brand` stores `primary_color` (required), optional `secondary_color`
- Landing brand section header, accent underline, “Shop brand” button use primary color
- Product cards show brand color as thin left border or badge background
- Total example: `#117076` — other brands set in admin
- Prefer brand colors on accents only; keep page background neutral so sections don’t clash

---

## 13. Acceptance Criteria

### Customer

- [ ] Carousel works; banners from API/admin
- [ ] Brand logos scroll L→R continuously
- [ ] Each brand section uses that brand’s hex color
- [ ] Cart add/update/remove works; count in header
- [ ] Checkout requires name, email, phone, address (+ city)
- [ ] Order confirmation shows order number
- [ ] Products / About / Support reachable from header
- [ ] Mobile layout usable (no horizontal overflow)

### Admin

- [ ] Login required for admin routes
- [ ] Product create/edit/delete/list
- [ ] Orders trackable with status changes
- [ ] Sales report shows revenue + order counts for a date range
- [ ] Brands have editable color + logo
- [ ] Admin usable on tablet/phone

### Ops

- [ ] Images load from R2 URLs
- [ ] Site live on custom domain with HTTPS
- [ ] Postgres persists data across deploys

---

## Appendix — Sample Seed Brands

| Brand | Primary |
|-------|---------|
| Total | `#117076` |
| Ingco | `#E30613` |
| Makita | `#003DA5` or brand teal `#00A3E0` (confirm official) |
| DeWalt | `#FFCC00` |
| Stanley | `#1D1D1D` + yellow accent `#FFD100` |
| Bosch | `#E20015` |

*(Confirm official brand guidelines before public launch; hex values are illustrative for theme system.)*
