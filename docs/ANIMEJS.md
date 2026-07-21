# Anime.js — What It Is & How to Use It on ToolsNest

**Anime.js** is a lightweight JavaScript animation engine. It animates DOM elements, CSS properties, SVG, and plain objects with timelines, easing, and stagger — useful when CSS alone feels awkward (scroll-linked motion, sequenced UI, cart feedback, counters).

**Official docs:** [animejs.com/documentation](https://animejs.com/documentation)

---

## 1. Anime.js vs what ToolsNest uses today

Today the storefront mostly uses **CSS animations** in `frontend/src/index.css`:

| Current approach | Examples in ToolsNest |
|---|---|
| CSS `@keyframes` + utility classes | `animate-fade-up`, `animate-fade-in`, `marquee` |
| Stagger via inline `animationDelay` | `ProductCard` (`index * 0.05s`) |
| Infinite ambient motion | `.spatial-orb`, `.liquid-glass__sheen` |

That works well for simple entrance effects. **Anime.js** helps when you need:

- **Sequences** — hero text → CTA → image, one after another
- **Scroll-triggered** animations — sections animate in as user scrolls
- **Interactive feedback** — cart badge bounce, “Add to cart” pulse, modal open/close
- **Dynamic values** — animate a number from 0 → cart total, price counter
- **Fine control** — pause, reverse, speed, overlap timings

| Use CSS | Use Anime.js |
|---|---|
| Hover transitions, simple fades | Timelines with multiple steps |
| Marquee, floating orbs (loop forever) | Scroll-in product grids |
| `prefers-reduced-motion` one-liners | Programmatic stagger when list length changes |
| Static page load stagger | Cart count / checkout step animations |

You don’t have to replace existing CSS — Anime.js can **add** motion where CSS is clunky.

---

## 2. Install in our React + Vite frontend

From the `frontend` folder:

```bash
npm install animejs
```

**Anime.js v4** uses named imports (not `import anime from 'animejs'`):

```ts
import { animate } from "animejs";
import { createTimeline } from "animejs/timeline";
import { stagger } from "animejs/utils";
```

TypeScript types ship with the package — no extra `@types` package needed.

**Bundle size tip:** import only what you use (`animate`, `createTimeline`, `stagger`, etc.) so Vite can tree-shake.

---

## 3. Core concepts (v4)

### `animate()` — single animation

Animates targets (selector, element, or array) toward new values:

```ts
import { animate } from "animejs";

animate(".product-card", {
  opacity: [0, 1],
  translateY: [24, 0],
  duration: 600,
  ease: "out(3)",
  delay: stagger(80), // 80ms between each card
});
```

Common options:

| Option | Purpose |
|---|---|
| `duration` | Length in ms |
| `delay` | Wait before start (number or `stagger()`) |
| `ease` | Timing curve (`"out(3)"`, `"inOut(2)"`, spring presets) |
| `loop` | Repeat count or `true` for infinite |
| `alternate` | Reverse on even loops |
| `autoplay` | Start immediately (default `true`) |

### `createTimeline()` — chained sequence

```ts
import { createTimeline } from "animejs/timeline";

const tl = createTimeline({ defaults: { duration: 500, ease: "out(3)" } });

tl.add(".hero-title", { opacity: [0, 1], translateY: [20, 0] })
  .add(".hero-subtitle", { opacity: [0, 1], translateY: [16, 0] }, "-=200") // overlap 200ms
  .add(".hero-cta", { opacity: [0, 1], scale: [0.95, 1] }, "-=100");
```

Good for **landing hero**, **checkout steps**, **admin modal** open sequences.

### `stagger()` — list/grid entrance

```ts
import { animate } from "animejs";
import { stagger } from "animejs/utils";

animate(".product-card", {
  opacity: [0, 1],
  translateY: [20, 0],
  delay: stagger(60, { start: 100 }),
});
```

Replaces manual `animationDelay: index * 0.05` on every card when products load via infinite scroll.

### Scroll-linked animations (v4)

Anime.js v4 has a **Scroll** module for “animate when element enters viewport”:

```ts
import { animate } from "animejs";
import { onScroll, scroll } from "animejs/scroll";

animate(".brand-section", {
  opacity: [0, 1],
  translateY: [40, 0],
  autoplay: onScroll({
  }),
});
```

Use this on **BrandProductSection**, **CategoryGrid**, or **About** blocks instead of bolting on a separate library.

---

## 4. Using Anime.js in React (ToolsNest pattern)

React owns the DOM. Use **refs** + **`useEffect`** with cleanup.

### Reusable hook

```ts
// frontend/src/hooks/useAnime.ts
import { useEffect, type RefObject } from "react";
import { animate, type JSAnimation } from "animejs";

export function useAnimeIn(
  ref: RefObject<HTMLElement | null>,
  params: Parameters<typeof animate>[1],
  deps: unknown[] = [],
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anim = animate(el, params);
    return () => anim.pause();
  }, deps);
}
```

### Product grid on filter change

```tsx
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { stagger } from "animejs/utils";

function ProductGrid({ products }: { products: Product[] }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".product-card");
    if (!cards?.length) return;

    const anim = animate(cards, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 450,
      ease: "out(3)",
      delay: stagger(50, { start: 0 }),
    });

    return () => anim.pause();
  }, [products]);

  return (
    <div ref={gridRef} className="grid ...">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
```

**Important:** run animations **after** new products render (`useEffect` on `products`), not during render.

### Cart badge bounce

```tsx
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useCart } from "../context/CartContext";

function CartBadge() {
  const { count } = useCart();
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!badgeRef.current || count === 0) return;
    animate(badgeRef.current, {
      scale: [1, 1.25, 1],
      duration: 400,
      ease: "out(3)",
    });
  }, [count]);

  return <span ref={badgeRef}>{count}</span>;
}
```

---

## 5. Where Anime.js fits on ToolsNest (ideas)

| Area | Idea | Why Anime.js |
|---|---|---|
| **Landing hero** | Title → subtitle → CTA timeline | Cleaner than 3 CSS classes + delays |
| **Product grid** | Stagger cards when filters/search change | Works with infinite scroll append |
| **Product detail** | Image zoom-in, price slide-up | Single coordinated sequence |
| **Add to cart** | Button scale + cart icon bounce | Interactive feedback |
| **Cart page** | Line items slide in, totals count up | Object/value animation |
| **Checkout** | Step indicator progress | Timeline per step |
| **Header mobile menu** | Panel slide + link stagger | Open/close with `reverse()` |
| **Admin modals** | Backdrop fade + panel scale | Matches storefront polish |
| **Low-stock badge** | Subtle pulse on report rows | `loop: true` with low amplitude |

**Keep CSS for:** liquid-glass sheen, spatial orbs, marquee, simple hovers — they’re cheap and already look good.

---

## 6. Performance & accessibility

### Performance

- Prefer animating **`transform`** and **`opacity`** (GPU-friendly) — same rule as GSAP/CSS.
- Don’t animate thousands of nodes at once; stagger in batches or only animate visible items.
- **Pause/cleanup** in `useEffect` return when component unmounts or deps change.
- For infinite scroll, only animate **newly appended** cards, not the full list every time.

### `prefers-reduced-motion`

Respect user settings (you already disable some CSS in `index.css`):

```ts
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
  animate(cards, { opacity: [0, 1], duration: 400 });
} else {
  // instant or skip
}
```

Wrap site-wide in a small `shouldAnimate()` helper.

---

## 7. Anime.js vs GSAP (quick pick)

| | Anime.js | GSAP |
|---|---|---|
| **Size / feel** | Lightweight, simple API | Heavier, very powerful |
| **Best for** | UI micro-interactions, timelines | Complex scroll sites, SVG, Flip |
| **React** | Manual refs + useEffect | Official `@gsap/react` (`useGSAP`) |
| **Scroll** | Built-in Scroll module (v4) | ScrollTrigger plugin |
| **ToolsNest** | Great next step from CSS | Better if you want scroll-heavy marketing pages |

For ToolsNest’s current scope (e-commerce + admin), **Anime.js is a good fit** — enough power without a big dependency.

---

## 8. Suggested rollout (phased)

### Phase A — Low risk (1–2 hours)

1. `npm install animejs` in `frontend`
2. Cart badge bounce on `count` change
3. Optional: replace product-card CSS stagger with Anime `stagger()` on filter change only

### Phase B — Storefront polish

1. Landing hero timeline (`HeroCarousel` text layers)
2. Scroll-in for `BrandProductSection` blocks
3. Product detail entrance sequence

### Phase C — Admin (optional)

1. Modal open/close timeline
2. Table row highlight on save

---

## 9. Example: minimal first integration

**1. Install**

```bash
cd frontend
npm install animejs
```

**2. Add hook** — `frontend/src/hooks/useReducedMotion.ts`

```ts
export function useReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

**3. Animate cart count in `Header.tsx`** (snippet)

```tsx
const badgeRef = useRef<HTMLSpanElement>(null);
const reduceMotion = useReducedMotion();

useEffect(() => {
  if (reduceMotion || !badgeRef.current || count < 1) return;
  import("animejs").then(({ animate }) => {
    animate(badgeRef.current!, {
      scale: [1, 1.2, 1],
      duration: 350,
      ease: "out(3)",
    });
  });
}, [count, reduceMotion]);
```

Dynamic `import("animejs")` keeps the initial bundle smaller until you use it site-wide.

---

## 10. References

- [Anime.js documentation](https://animejs.com/documentation)
- [Installation (npm / CDN)](https://animejs.com/documentation/getting-started/installation/)
- [Migrating v3 → v4](https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4) — use `animate`, not global `anime()`
- ToolsNest CSS animations: `frontend/src/index.css`
- Product stagger today: `frontend/src/components/ProductCard.tsx`

---

## Summary

| Question | Answer |
|---|---|
| What is Anime.js? | JS animation engine for DOM/CSS/SVG/objects |
| Do we need it? | Not required — CSS works; Anime.js adds sequences, scroll, and interaction |
| How to add it? | `npm install animejs` in `frontend`, import `{ animate }` in React effects |
| Where to use it first? | Cart badge, product grid stagger, landing hero timeline |
| Replace CSS? | No — use both; keep orbs/marquee/hover in CSS |

When you want this implemented in code, say which phase (A/B/C) to start with.
