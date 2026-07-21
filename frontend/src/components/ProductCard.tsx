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
      className="product-card group flex flex-col overflow-hidden rounded-2xl sm:rounded-[1.75rem]"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden"
      >
        <div className="aspect-square overflow-hidden m-1.5 rounded-xl neo-inset-sm sm:aspect-[4/3] sm:m-3 sm:rounded-[1.25rem]">
          <img
            src={image}
            alt={product.name}
            className="product-card__image h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="product-card__shine pointer-events-none absolute inset-0" />
        <span
          className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-md sm:left-5 sm:top-5 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[11px]"
          style={{ backgroundColor: brandColor }}
        >
          {product.brand?.name}
        </span>
        {badges.length > 0 && (
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-0.5 sm:right-5 sm:top-5 sm:gap-1">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide shadow-sm sm:px-2 sm:text-[10px] ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-0.5 px-2.5 pb-2.5 pt-0.5 sm:gap-1.5 sm:px-5 sm:pb-5 sm:pt-1">
        <p className="hidden text-xs font-medium uppercase tracking-wide text-[var(--neo-muted)] sm:block">
          {product.category?.name || "Tools"}
        </p>
        <Link
          to={`/products/${product.slug}`}
          className="brand-font line-clamp-2 text-[12px] font-semibold leading-snug text-[var(--neo-ink)] transition group-hover:text-[var(--neo-accent)] sm:text-[15px]"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-2 sm:gap-3 sm:pt-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--neo-accent)] sm:text-lg">
              {formatPrice(product.price)}
            </p>
            {product.compare_at_price && (
              <p className="text-[10px] text-[var(--neo-muted)] line-through sm:text-xs">
                {formatPrice(product.compare_at_price)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="neo-btn-fill shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-semibold min-h-8 sm:min-h-11 sm:min-w-[4.5rem] sm:px-4 sm:py-2.5 sm:text-xs"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
