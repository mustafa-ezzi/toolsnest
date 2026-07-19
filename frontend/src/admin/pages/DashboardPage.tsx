import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminGet, type DashboardData } from "../api";
import { formatPrice } from "../../api/client";

function KpiCard({
  title,
  value,
  sub,
  icon,
  iconBg,
}: {
  title: string;
  value: string;
  sub: ReactNode;
  icon: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <div className="mt-2 text-xs">{sub}</div>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${iconBg}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet<DashboardData>("/api/admin/dashboard/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-400">Loading dashboard…</p>;
  }

  if (!data) {
    return <p className="text-red-400">Could not load dashboard.</p>;
  }

  return (
    <div>
      <h1 className="brand-font text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400 sm:text-base">
        Overview of your store&apos;s performance.
      </p>

      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={formatPrice(data.total_revenue)}
          sub={
            <span className="text-emerald-400">
              +{data.revenue_change_pct}% from last month
            </span>
          }
          icon="Rs"
          iconBg="bg-[#2dd4bf]/20 text-[#2dd4bf]"
        />
        <KpiCard
          title="Orders"
          value={String(data.orders_count)}
          sub={
            <span className="text-emerald-400">
              +{data.orders_change_pct}% from last month
            </span>
          }
          icon="🛒"
          iconBg="bg-blue-500/20 text-blue-400"
        />
        <KpiCard
          title="Products"
          value={String(data.products_count)}
          sub={
            <span className="text-amber-400">
              {data.low_stock_count} low stock
            </span>
          }
          icon="📦"
          iconBg="bg-orange-500/20 text-orange-400"
        />
        <KpiCard
          title="Pending Orders"
          value={String(data.pending_orders)}
          sub={<span className="text-slate-500">Needs attention</span>}
          icon="⏳"
          iconBg="bg-yellow-500/20 text-yellow-400"
        />
      </div>

      {data.low_stock_count > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          ⚠ {data.low_stock_count} product(s) are at or below the low-stock
          threshold (15). Check inventory soon.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-4 sm:p-5">
          <h2 className="mb-4 font-semibold text-white">Daily Sales</h2>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="orders" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111827] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-white">Revenue Trends</h2>
            <a href="/admin/reports" className="shrink-0 text-sm text-[#2dd4bf] hover:underline">
              View All
            </a>
          </div>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weekly_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  dot={{ fill: "#2dd4bf" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
