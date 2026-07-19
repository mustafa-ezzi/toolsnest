import type { Product } from "../types";
import { formatPrice } from "../api/client";
import { useCart } from "../context/CartContext";
import { getProductBadges } from "../utils/badges";
import { Link } from "react-router-dom";

type Props = {
  product: Product;
  index?: number;
};

export default function ProductCard({ product, index = 0 }: Props) {
  const { addItem } = useCart();
  const brandColor = product.brand?.primary_color || "#0F4C5C";
  const badges = getProductBadges(product);
  const image =
    product.primary_image ||
    product.images?.[0]?.url ||
    "https://placehold.co/600x600/e2e8f0/64748b?text=ToolsNest";

  return (
    <article
      className="product-card group flex flex-col overflow-hidden rounded-[1.75rem]"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden"
      >
        <div className="aspect-[4/3] overflow-hidden m-3 rounded-[1.25rem] neo-inset-sm">
          <img
            src={image}
            alt={product.name}
            className="product-card__image h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="product-card__shine pointer-events-none absolute inset-0" />
        <span
          className="absolute left-5 top-5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-md"
          style={{ backgroundColor: brandColor }}
        >
          {product.brand?.name}
        </span>
        {badges.length > 0 && (
          <div className="absolute right-5 top-5 flex flex-col gap-1">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--neo-muted)]">
          {product.category?.name || "Tools"}
        </p>
        <Link
          to={`/products/${product.slug}`}
          className="brand-font line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--neo-ink)] transition group-hover:text-[var(--neo-accent)]"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div>
            <p className="text-lg font-semibold text-[var(--neo-accent)]">
              {formatPrice(product.price)}
            </p>
            {product.compare_at_price && (
              <p className="text-xs text-[var(--neo-muted)] line-through">
                {formatPrice(product.compare_at_price)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="neo-btn-fill rounded-full px-4 py-2 text-xs font-semibold"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
