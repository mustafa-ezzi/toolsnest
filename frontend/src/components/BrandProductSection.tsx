import { Link } from "react-router-dom";
import { useRef } from "react";
import type { Brand, Product } from "../types";
import ProductCard from "./ProductCard";
import { darken, readableTextColor, withAlpha } from "../utils/color";
import { useScrollReveal } from "../hooks/useScrollReveal";

type Props = {
  brand: Brand;
  products: Product[];
  tagline?: string;
};

export default function BrandProductSection({ brand, products, tagline }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useScrollReveal(sectionRef, {
    childSelector: ".product-card",
    y: 40,
    duration: 580,
    childStagger: 70,
  });

  if (!products.length) return null;

  const primary = brand.primary_color || "#0F4C5C";
  const secondary = brand.secondary_color || darken(primary, 0.28);
  const textColor = readableTextColor(primary);
  const isDarkText = textColor === "#111827";

  return (
    <section ref={sectionRef} className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div
          className="brand-band group/band relative mb-8 overflow-hidden rounded-[2rem] px-6 py-7 sm:px-9 sm:py-8"
          style={{
            background: `linear-gradient(125deg, ${primary} 0%, ${darken(primary, 0.16)} 55%, ${secondary} 100%)`,
            color: textColor,
            boxShadow: `
              14px 14px 28px ${withAlpha("#a3b1c6", 0.55)},
              -10px -10px 24px ${withAlpha("#ffffff", 0.85)},
              inset 0 1px 0 ${withAlpha("#ffffff", 0.25)}
            `,
          }}
        >
          <span
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: withAlpha("#ffffff", isDarkText ? 0.28 : 0.2) }}
          />
          <span
            className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full blur-3xl"
            style={{ background: withAlpha("#000000", 0.16) }}
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              {brand.logo_url && (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-2 sm:h-16 sm:w-16"
                  style={{
                    background: withAlpha(
                      isDarkText ? "#000000" : "#ffffff",
                      isDarkText ? 0.08 : 0.2
                    ),
                    boxShadow: `inset 3px 3px 8px ${withAlpha("#000000", 0.15)}, inset -3px -3px 8px ${withAlpha("#ffffff", 0.2)}`,
                  }}
                >
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </span>
              )}
              <div className="min-w-0">
                <span
                  className="mb-1 inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                  style={{
                    background: withAlpha(
                      isDarkText ? "#000000" : "#ffffff",
                      isDarkText ? 0.1 : 0.22
                    ),
                  }}
                >
                  Brand Spotlight
                </span>
                <h2 className="brand-font text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                  {brand.name}
                </h2>
                <p
                  className="mt-1 text-sm sm:text-base"
                  style={{ color: withAlpha(textColor, 0.85) }}
                >
                  {tagline || `Explore ${brand.name} tools built for the jobsite.`}
                </p>
              </div>
            </div>

            <Link
              to={`/products?brand=${brand.slug}`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 hover:gap-3 sm:w-auto"
              style={{
                background: isDarkText ? "#111827" : "#ffffff",
                color: isDarkText ? "#ffffff" : primary,
                boxShadow: isDarkText
                  ? `6px 6px 14px ${withAlpha("#000000", 0.35)}`
                  : `6px 6px 14px ${withAlpha("#000000", 0.18)}, -4px -4px 10px ${withAlpha("#ffffff", 0.4)}`,
              }}
            >
              View all {brand.name}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
