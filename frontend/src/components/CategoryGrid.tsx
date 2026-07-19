import { Link } from "react-router-dom";
import type { Category } from "../types";

const ICONS: Record<string, string> = {
  "power-tools": "⚡",
  "hand-tools": "🔧",
  measuring: "📏",
  safety: "🛡️",
  electrical: "💡",
  fasteners: "📎",
};

const CAT_COLORS = [
  { bg: "rgba(15, 76, 92, 0.14)", fg: "#0f4c5c", ring: "#1a7a88" },
  { bg: "rgba(232, 163, 23, 0.18)", fg: "#b7790f", ring: "#e8a317" },
  { bg: "rgba(42, 143, 191, 0.16)", fg: "#1a6f99", ring: "#2a8fbf" },
  { bg: "rgba(232, 93, 76, 0.15)", fg: "#c44536", ring: "#e85d4c" },
  { bg: "rgba(61, 155, 110, 0.16)", fg: "#2d7a54", ring: "#3d9b6e" },
  { bg: "rgba(240, 193, 75, 0.2)", fg: "#9a7b12", ring: "#f0c14b" },
];

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="brand-font text-3xl font-bold sm:text-4xl">
          <span className="section-title-accent">Shop by Category</span>
        </h2>
        <div className="section-underline" />
        <p className="mx-auto mt-4 max-w-2xl text-[var(--neo-muted)]">
          Find the exact tools you need from our comprehensive selection of
          professional-grade equipment.
        </p>
        <div className="stagger mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => {
            const palette = CAT_COLORS[i % CAT_COLORS.length];
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="category-tile flex flex-col items-center gap-3 rounded-[1.5rem] px-4 py-8"
                style={{
                  background: `linear-gradient(165deg, ${palette.bg} 0%, var(--neo-surface) 70%)`,
                }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    background: palette.bg,
                    color: palette.fg,
                    boxShadow: `inset 3px 3px 8px rgba(163,177,198,0.35), inset -3px -3px 8px rgba(255,255,255,0.8), 0 0 0 2px ${palette.ring}33`,
                  }}
                >
                  {ICONS[cat.slug] || "🛠️"}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: palette.fg }}
                >
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
