import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createOrder, formatPrice, validateCoupon } from "../api/client";
import type { CouponValidation } from "../api/client";
import { useCart } from "../context/CartContext";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
} from "../utils/whatsapp";

type FormState = {
  customer_name: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  notes: string;
};

const initial: FormState = {
  customer_name: "",
  email: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  postal_code: "",
  notes: "",
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = coupon ? Number(coupon.discount_amount) : 0;
  const total = Math.max(0, subtotal - discount);

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const payloadItems = useMemo(
    () =>
      items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    [items]
  );

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.customer_name.trim().length < 2) next.customer_name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Valid email required";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Valid phone required";
    if (!form.address_line.trim()) next.address_line = "Required";
    if (!form.city.trim()) next.city = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function applyCoupon() {
    setCouponError("");
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponInput.trim(), subtotal);
      setCoupon(result);
    } catch (e) {
      setCoupon(null);
      setCouponError(e instanceof Error ? e.message : "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  }

  async function placeOrder(source: "web" | "whatsapp") {
    setApiError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        ...form,
        coupon_code: coupon?.code || "",
        source,
        items: payloadItems,
      });

      if (source === "whatsapp") {
        const message = buildWhatsAppOrderMessage(form, items, order.order_number);
        window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
      }

      clear();
      navigate(`/order-success/${order.order_number}`, {
        state: { order, openedWhatsApp: source === "whatsapp" },
      });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void placeOrder("web");
  }

  if (!items.length) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="brand-font mb-8 text-3xl font-bold text-slate-900 sm:text-4xl animate-fade-up">
        Checkout
      </h1>

      <form
        onSubmit={onSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_340px]"
      >
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm animate-fade-up sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              error={errors.customer_name}
              className="sm:col-span-2"
            >
              <input
                {...field("customer_name")}
                className={inputClass(errors.customer_name)}
                placeholder="John Doe"
                autoComplete="name"
              />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input
                {...field("email")}
                type="email"
                className={inputClass(errors.email)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Phone Number" error={errors.phone}>
              <input
                {...field("phone")}
                className={inputClass(errors.phone)}
                placeholder="+92 363 1212321"
                autoComplete="tel"
              />
            </Field>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Address</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Street Address"
                error={errors.address_line}
                className="sm:col-span-3"
              >
                <input
                  {...field("address_line")}
                  className={inputClass(errors.address_line)}
                  placeholder="123 Industrial Parkway"
                  autoComplete="street-address"
                />
              </Field>
              <Field label="City" error={errors.city}>
                <input
                  {...field("city")}
                  className={inputClass(errors.city)}
                  placeholder="City"
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="State / Province">
                <input
                  {...field("state")}
                  className={inputClass()}
                  placeholder="State"
                  autoComplete="address-level1"
                />
              </Field>
              <Field label="ZIP / Postal">
                <input
                  {...field("postal_code")}
                  className={inputClass()}
                  placeholder="90210"
                  autoComplete="postal-code"
                />
              </Field>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Order Notes (Optional)
            </h2>
            <textarea
              {...field("notes")}
              rows={4}
              className={`${inputClass()} resize-y`}
              placeholder="Delivery instructions, etc."
            />
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm animate-slide-in">
          <h2 className="brand-font text-xl font-bold text-slate-900">
            Your Order
          </h2>

          <ul className="mt-5 max-h-64 space-y-4 overflow-y-auto">
            {items.map((item) => (
              <li key={item.product.id} className="flex gap-3">
                <img
                  src={
                    item.product.primary_image ||
                    "https://placehold.co/64x64"
                  }
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold text-[#0F4C5C]">
                    {formatPrice(Number(item.product.price) * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#147D8A]"
              />
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={couponLoading || !couponInput.trim()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-[#0F4C5C] hover:bg-slate-50 disabled:opacity-50"
              >
                {couponLoading ? "…" : "Apply"}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-red-600">{couponError}</p>
            )}
            {coupon && (
              <p className="text-xs text-emerald-600">
                Coupon {coupon.code} applied (−{formatPrice(coupon.discount_amount)})
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput("");
                  }}
                >
                  Remove
                </button>
              </p>
            )}
            <div className="flex justify-between pt-2">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="font-semibold text-emerald-600">Free</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-bold text-[#0F4C5C]">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {apiError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-5 w-full rounded-xl bg-[#0F4C5C] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Place Order"}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void placeOrder("whatsapp")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            <WhatsAppIcon />
            Order via WhatsApp
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
            By placing your order you agree to our terms. WhatsApp sends your
            details and cart to the store owner for direct confirmation.
          </p>

          <Link
            to="/cart"
            className="mt-3 block text-center text-sm text-[#0F4C5C] hover:underline"
          >
            ← Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#147D8A]/20 ${
    error
      ? "border-red-400 focus:border-red-400"
      : "border-slate-200 focus:border-[#147D8A]"
  }`;
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.4-1.4A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.2.8.9-3.1-.2-.3a9 9 0 1 1 7.4 4.1zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.6-1.4-.8-1.9-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3s-1 1-1 2.4 1 2.8 1.2 3 .9 1.9 3.5 3.1a12 12 0 0 0 1.2.5 2.9 2.9 0 0 0 1.3.1c.4-.1 1.6-.7 1.8-1.3s.2-1.2.2-1.3-.2-.2-.4-.3z" />
    </svg>
  );
}
