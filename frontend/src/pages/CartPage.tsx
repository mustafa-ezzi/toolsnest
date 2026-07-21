import { Link } from "react-router-dom";
import { formatPrice } from "../api/client";
import { useCart } from "../context/CartContext";

const FREE_SHIPPING_THRESHOLD = 15000;

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal > 0;
  // Design shows Free shipping always in screenshot; keep free for MVP
  const shippingLabel = shippingFree ? "Free" : formatPrice(0);
  const total = subtotal;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center animate-fade-up">
        <h1 className="brand-font text-3xl font-bold text-slate-900">
          Shopping Cart
        </h1>
        <p className="mt-3 text-slate-500">Your cart is empty.</p>
        <Link
          to="/products"
          className="btn-primary mt-8 inline-flex rounded-xl bg-[#0F4C5C] px-6 py-3 text-sm font-semibold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="brand-font mb-8 text-3xl font-bold text-slate-900 sm:text-4xl animate-fade-up">
        Shopping Cart
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {items.map((item, index) => {
            const lineTotal = Number(item.product.price) * item.quantity;
            const brandColor = item.product.brand.primary_color || "#0F4C5C";
            return (
              <div
                key={item.product.id}
                className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <img
                  src={
                    item.product.primary_image ||
                    "https://placehold.co/160x160/e2e8f0/64748b?text=Tool"
                  }
                  alt={item.product.name}
                  className="h-28 w-full rounded-xl object-cover sm:h-24 sm:w-24"
                />

                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {item.product.brand.name}
                  </span>
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="mt-1.5 block font-semibold text-slate-900 hover:text-[#0F4C5C]"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-1 text-sm font-medium text-[#0F4C5C]">
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="flex h-11 items-center rounded-full bg-slate-100 px-1">
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:text-[#0F4C5C]"
                      onClick={() =>
                        updateQty(item.product.id, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:text-[#0F4C5C]"
                      onClick={() =>
                        updateQty(item.product.id, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      {formatPrice(lineTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm animate-slide-in">
          <h2 className="brand-font text-xl font-bold text-slate-900">
            Order Summary
          </h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-800">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="font-semibold text-emerald-600">
                {shippingLabel}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-[#0F4C5C]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/checkout"
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] py-3.5 text-sm font-semibold text-white hover:bg-[#147D8A]"
          >
            Proceed to Checkout <span aria-hidden>→</span>
          </Link>

          <div className="mt-5 flex items-center justify-center gap-3 text-[10px] font-semibold tracking-wider text-slate-300">
            <span className="rounded border border-slate-200 px-2 py-1">VISA</span>
            <span className="rounded border border-slate-200 px-2 py-1">MC</span>
            <span className="rounded border border-slate-200 px-2 py-1">AMEX</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
