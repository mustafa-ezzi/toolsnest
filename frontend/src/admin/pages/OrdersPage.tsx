import { useEffect, useState } from "react";
import type { Order } from "../../types/order";
import {
  adminDelete,
  adminDownloadCsv,
  adminGet,
  adminPatch,
  type Paginated,
} from "../api";
import { formatPrice } from "../../api/client";
import {
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";
import {
  ORDER_STATUSES,
  orderStatusLabel,
} from "../../utils/orderStatus";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  function load() {
    setLoading(true);
    const q = search
      ? `?search=${encodeURIComponent(search)}&page_size=50`
      : "?page_size=50";
    adminGet<Paginated<Order>>(`/api/admin/orders/${q}`)
      .then((d) => {
        setOrders(d.results);
        setSelected((prev) =>
          prev ? d.results.find((o) => o.id === prev.id) || null : null
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = window.setTimeout(load, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  async function updateStatus(id: number, status: string) {
    await adminPatch(`/api/admin/orders/${id}/status/`, { status });
    load();
  }

  async function remove(id: number) {
    if (
      !confirm("Delete this order permanently? This cannot be undone.")
    ) {
      return;
    }
    await adminDelete(`/api/admin/orders/${id}/`);
    if (selected?.id === id) setSelected(null);
    load();
  }

  const needsWhatsAppConfirm = selected?.status === "whatsapp_order";

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Track and update customer orders. WhatsApp orders need your confirmation."
        action={
          <button
            type="button"
            onClick={() =>
              void adminDownloadCsv("/api/admin/orders/export/", "orders.csv")
            }
            className={adminBtnGhost}
          >
            Export CSV
          </button>
        }
      />

      <AdminSearch
        value={search}
        onChange={setSearch}
        placeholder="Search by order #, name, email, phone..."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <AdminTable>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/5 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={`cursor-pointer border-b border-white/5 hover:bg-white/[0.02] ${
                      selected?.id === o.id ? "bg-[#2dd4bf]/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#2dd4bf]">{o.order_number}</p>
                      {o.source === "whatsapp" && (
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                          via WhatsApp
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{o.customer_name}</p>
                      <p className="text-xs text-slate-500">{o.phone}</p>
                    </td>
                    <td className="px-4 py-3">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        title="Delete order"
                        onClick={(e) => {
                          e.stopPropagation();
                          void remove(o.id);
                        }}
                        className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTable>

        <div className="rounded-2xl border border-white/5 bg-[#111827] p-4 sm:p-5">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-white">
                    {selected.order_number}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selected.customer_name}
                  </p>
                  <p className="text-sm text-slate-400">{selected.email}</p>
                  <p className="text-sm text-slate-400">{selected.phone}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {selected.address_line}, {selected.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(selected.id)}
                  className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>

              {needsWhatsAppConfirm && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-sm font-medium text-emerald-300">
                    WhatsApp order — needs confirmation
                  </p>
                  <p className="mt-1 text-xs text-emerald-200/80">
                    Customer messaged you on WhatsApp. Confirm after you agree
                    on availability and delivery.
                  </p>
                  <button
                    type="button"
                    className={`${adminBtnPrimary} mt-3 w-full`}
                    onClick={() => void updateStatus(selected.id, "confirmed")}
                  >
                    Confirm WhatsApp order
                  </button>
                </div>
              )}

              <label className="mt-4 block text-sm text-slate-400">
                Status
                <select
                  className={`${adminInputClass} mt-1`}
                  value={selected.status}
                  onChange={(e) =>
                    void updateStatus(selected.id, e.target.value)
                  }
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {orderStatusLabel(s)}
                      {s === "whatsapp_order" ? " (needs confirm)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <ul className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm">
                {selected.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between text-slate-300"
                  >
                    <span>
                      {item.product_name_snapshot} ×{item.quantity}
                    </span>
                    <span>{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-right text-lg font-bold text-[#2dd4bf]">
                {formatPrice(selected.total)}
              </p>
            </>
          ) : (
            <p className="text-slate-500">Select an order to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    whatsapp_order: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
    confirmed: "bg-blue-500/20 text-blue-400",
    processing: "bg-purple-500/20 text-purple-400",
    shipped: "bg-cyan-500/20 text-cyan-400",
    delivered: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status] || "bg-slate-500/20 text-slate-400"
      }`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
