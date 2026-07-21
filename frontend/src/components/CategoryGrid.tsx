import { Link } from "react-router-dom";
import { useRef } from "react";
import type { Category } from "../types";
import { useScrollReveal } from "../hooks/useScrollReveal";

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
  const sectionRef = useRef<HTMLElement | null>(null);
  useScrollReveal(sectionRef, {
    childSelector: ".category-tile",
    y: 28,
    duration: 520,
    childStagger: 45,
  });

  return (
    <section ref={sectionRef} className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="brand-font text-2xl font-bold sm:text-3xl lg:text-4xl">
          <span className="section-title-accent">Shop by Category</span>
        </h2>
        <div className="section-underline" />
        <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--neo-muted)] sm:text-base">
          Find the exact tools you need from our comprehensive selection of
          professional-grade equipment.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => {
            const palette = CAT_COLORS[i % CAT_COLORS.length];
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="category-tile flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-[1.25rem] px-3 py-5 sm:min-h-0 sm:gap-3 sm:rounded-[1.5rem] sm:px-4 sm:py-8"
                style={{
                  background: `linear-gradient(165deg, ${palette.bg} 0%, var(--neo-surface) 70%)`,
                }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl sm:h-14 sm:w-14 sm:text-2xl"
                  style={{
                    background: palette.bg,
                    color: palette.fg,
                    boxShadow: `inset 3px 3px 8px rgba(163,177,198,0.35), inset -3px -3px 8px rgba(255,255,255,0.8), 0 0 0 2px ${palette.ring}33`,
                  }}
                >
                  {ICONS[cat.slug] || "🛠️"}
                </span>
                <span
                  className="line-clamp-2 text-center text-xs font-semibold sm:text-sm"
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
