import { useState, type FormEvent } from "react";
import { lookupOrders, formatPrice } from "../api/client";
import { orderStatusLabel } from "../utils/orderStatus";
import type { Order } from "../types/order";

export default function OrderLookupPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await lookupOrders(email, phone);
      setOrders(data);
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="brand-font text-3xl font-bold text-slate-900 sm:text-4xl">
        Track your order
      </h1>
      <p className="mt-2 text-slate-500">
        Enter the email and phone used at checkout — no account needed.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#147D8A] focus:ring-2 focus:ring-[#147D8A]/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone
          </span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#147D8A] focus:ring-2 focus:ring-[#147D8A]/20"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-xl bg-[#0F4C5C] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Searching…" : "Find orders"}
        </button>
      </form>

      {orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-up"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#0F4C5C]">{o.order_number}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    o.status === "whatsapp_order"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {orderStatusLabel(o.status)}
                  {o.status === "whatsapp_order" ? " · needs confirm" : ""}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {o.items.map((item) => (
                  <li key={item.id}>
                    {item.product_name_snapshot} ×{item.quantity}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-lg font-bold text-slate-900">
                {formatPrice(o.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
