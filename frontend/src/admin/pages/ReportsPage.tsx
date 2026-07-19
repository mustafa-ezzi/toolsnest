import { useEffect, useState } from "react";
import { adminGet, type SalesReport } from "../api";
import { formatPrice } from "../../api/client";
import {
  AdminPageHeader,
  AdminTable,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";

export default function AdminReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    adminGet<SalesReport>(
      `/api/admin/reports/sales/?from=${from}&to=${to}`
    )
      .then(setReport)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        subtitle="Sales performance and top products."
      />

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#111827] p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5">
        <label className="w-full text-sm text-slate-400 sm:w-auto sm:min-w-[10rem]">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`${adminInputClass} mt-1`}
          />
        </label>
        <label className="w-full text-sm text-slate-400 sm:w-auto sm:min-w-[10rem]">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`${adminInputClass} mt-1`}
          />
        </label>
        <button type="button" onClick={load} className={`${adminBtnPrimary} w-full sm:w-auto`}>
          {loading ? "Loading…" : "Run Report"}
        </button>
      </div>

      {report && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Revenue</p>
              <p className="mt-2 text-3xl font-bold text-[#2dd4bf]">
                {formatPrice(report.revenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Orders</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {report.order_count}
              </p>
            </div>
          </div>

          <h2 className="mb-4 font-semibold text-white">Top Products</h2>
          <AdminTable>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-white/5 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Qty Sold</th>
                  <th className="px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.top_products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No sales in this period.
                    </td>
                  </tr>
                ) : (
                  report.top_products.map((p, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-3 text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-400">{p.sku}</td>
                      <td className="px-4 py-3">{p.quantity_sold}</td>
                      <td className="px-4 py-3 text-[#2dd4bf]">
                        {formatPrice(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminTable>
        </>
      )}
    </div>
  );
}
