import type { Brand } from "../types";
import { Link } from "react-router-dom";
import { withAlpha } from "../utils/color";

export default function BrandMarquee({ brands }: { brands: Brand[] }) {
  const items = brands.length ? [...brands, ...brands] : [];

  if (!items.length) return null;

  return (
    <section className="overflow-hidden py-8">
      <div className="mx-auto mb-4 max-w-7xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--neo-accent-2)]">
          Trusted brands
        </p>
        <div className="section-underline !mt-2" />
      </div>
      <div className="marquee-track gap-5 px-4">
        {items.map((brand, i) => {
          const color = brand.primary_color || "#0F4C5C";
          return (
            <Link
              key={`${brand.id}-${i}`}
              to={`/products?brand=${brand.slug}`}
              className="neo-pressable flex h-16 min-w-[160px] items-center justify-center gap-2 rounded-full px-7 transition duration-300"
              title={brand.name}
              style={{
                background: `linear-gradient(145deg, ${withAlpha(color, 0.14)}, var(--neo-surface) 65%)`,
                boxShadow: `
                  6px 6px 14px rgba(163,177,198,0.5),
                  -6px -6px 14px rgba(255,255,255,0.9),
                  inset 0 0 0 2px ${withAlpha(color, 0.35)}
                `,
              }}
            >
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="max-h-8 max-w-[110px] object-contain"
                />
              ) : (
                <span
                  className="text-sm font-bold"
                  style={{ color }}
                >
                  {brand.name}
                </span>
              )}
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
