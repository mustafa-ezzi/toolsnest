# ToolsNest — Replit-Ready UI Design Spec

**Product:** ToolsNest Hardware E-Commerce  
**Version:** 1.0 · July 2026

Related: [PRD](./PRD.md) · [RND](./RND.md) · [PHASES](./PHASES.md)

> **How to use:** Copy **Section 1 (Replit Prompt)** into Replit as the UI generation brief. Ask Replit to build **static UI only** (mock data), customer pages + admin pages. No real backend required for the UI pass.

---

## 1. Replit Prompt (paste as-is)

```
Build a polished, responsive multi-brand HARDWARE e-commerce UI for "ToolsNest" (domain vibe: toolsnest.tools).

TECH (UI only): React + Vite + Tailwind CSS + React Router. Use placeholder images (Unsplash / picsum) and mock JSON arrays. No backend.

BRAND: ToolsNest — industrial-premium hardware marketplace. Visual direction:
- Neutral warm-gray / stone base backgrounds with subtle metal/mesh texture or soft radial gradients (NOT flat white, NOT purple/indigo gradients, NOT dark neon, NOT cream+terracotta newspaper look).
- Accent: deep teal/steel (primary site accent #0F4C5C). Body text charcoal.
- Typography: expressive but readable — use "Outfit" or "Sora" for headings + "Source Sans 3" for body (Google Fonts). Avoid Inter/Roboto/Arial.
- Lots of whitespace control, strong hierarchy, intentional micro-motion (carousel fade, marquee, card hover lift).

HEADER (sticky):
- Left: ToolsNest wordmark / logo
- Center or right links: Products | About Us | Support
- Far right: Cart icon with badge count
- Mobile: hamburger drawer

LANDING PAGE sections (in order):
1) HERO CAROUSEL — full-bleed edge-to-edge (not inset card). 4 slides. Each: large product/workshop image, short headline, CTA button. Smooth autoplay + dots + arrows. First viewport must feel like ONE composition: brand + one headline + short line + CTAs + hero visual. No stats strips, no promo chips overlaying the image.
2) BRAND LOGO MARQUEE — infinite scroll left-to-right of brand logos (Total, Ingco, Makita, DeWalt, Stanley, Bosch, Hilti). Logos grayscale by default, color on hover. Seamless loop.
3) FEATURED CATEGORIES — simple horizontal row or grid of 4–6 categories (Power Tools, Hand Tools, Measuring, Safety, Electrical, Fasteners). Not card-heavy if avoidable; clean tiles with icon/image.
4) BRAND PRODUCT SECTIONS — repeatable blocks. For EACH brand:
   - Section header bar tinted with that brand’s primary color
   - Brand logo + name + short line + "View all"
   - Horizontal scroll or responsive grid of 4–8 product cards
   Brand theme examples:
     - Total: #117076
     - Ingco: #E30613 (use carefully as accent only)
     - Makita: #008C95 / teal-blue
     - DeWalt: #FFCC00 (with dark text)
     - Stanley: #000000 / yellow accent
5) PRODUCT CARD — image, brand color badge, title (2 lines max), price, Add to cart button. Hover: slight lift + image zoom.
6) ABOUT TEASER + SUPPORT TEASER footer band
7) FOOTER — contact, quick links, copyright ToolsNest

OTHER CUSTOMER PAGES:
- /products — filters: brand, category, search; grid of products
- /products/:id — gallery, price, qty stepper, add to cart, specs table
- /cart — line items, qty, remove, order summary, Checkout CTA
- /checkout — form: Full name*, Email*, Phone*, Address*, City*, Area, Notes; order summary sidebar; Place Order
- /order-success — order number confirmation
- /about — story / mission
- /support — FAQ accordion + contact (phone, email, WhatsApp placeholder)

ADMIN PANEL (separate route group /admin):
Look professional, dashboard-like but clean (sidebar + topbar). Responsive (sidebar collapses on mobile).
Pages:
- Login
- Dashboard home: KPI cards (orders today, revenue, pending orders) + small charts
- Products list (table + search + Add Product) and Product form (fields: name, sku, brand select, category, price, stock, description, image upload UI mock)
- Orders list + Order detail with status dropdown (pending/confirmed/processing/shipped/delivered/cancelled)
- Brands CRUD (name, hex color picker, logo upload mock)
- Banners CRUD mock
- Sales Reports page: date range, bar/line chart, top products table
- Categories list mock

QUALITY BAR:
- Fully responsive
- Consistent spacing scale
- Loading skeletons optional
- Empty states for cart/admin tables
- Accessible buttons/labels
- Cool, modern hardware-store feel — premium tool shop, not toy template

Deliver navigable mock UI with React Router between all pages above.
```

---

## 2. Design Tokens (CSS variables)

```css
:root {
  --tn-bg: #F3F4F6;
  --tn-surface: #FFFFFF;
  --tn-ink: #1C1917;
  --tn-muted: #57534E;
  --tn-accent: #0F4C5C;
  --tn-accent-2: #147D8A;
  --tn-border: #E7E5E4;
  --tn-danger: #B91C1C;
  --tn-success: #15803D;
  --font-display: "Outfit", system-ui, sans-serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
  --radius: 12px;
  --shadow-soft: 0 10px 30px rgba(28, 25, 23, 0.08);
}

/* Per-section brand override example */
.brand-section[data-brand="total"] {
  --brand: #117076;
}
```

---

## 3. Key Screens Wire Map

| Screen | Must include |
|--------|----------------|
| Landing | Carousel, marquee, brand sections, header/footer |
| Products | Filters + grid |
| Product detail | Gallery + ATC |
| Cart | Lines + summary |
| Checkout | Form + summary |
| Success | Order ID |
| Admin Products | Table + form |
| Admin Orders | List + status |
| Admin Reports | Charts |

---

## 4. Motion Spec (minimum 2–3)

1. Hero carousel crossfade / slide  
2. Brand logo marquee continuous scroll  
3. Product card hover lift (transform + shadow)  

Optional: page fade on route change; admin sidebar collapse animation.

---

## 5. Figma / Hand-off Note

If using Figma later: 1 mobile (390) + 1 desktop (1440) artboard per key screen; export assets to R2 after build.
