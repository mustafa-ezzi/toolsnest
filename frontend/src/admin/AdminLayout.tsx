import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "./AuthContext";

const nav = [
  { to: "/admin", label: "Dashboard", icon: "▦", end: true },
  { to: "/admin/products", label: "Products", icon: "▣" },
  { to: "/admin/orders", label: "Orders", icon: "🛒" },
  { to: "/admin/brands", label: "Brands", icon: "◆" },
  { to: "/admin/categories", label: "Categories", icon: "☰" },
  { to: "/admin/banners", label: "Banners", icon: "🖼" },
  { to: "/admin/coupons", label: "Coupons", icon: "%" },
  { to: "/admin/reports", label: "Reports", icon: "📊" },
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = (user?.username || "AD").slice(0, 2).toUpperCase();

  // Close drawer on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when drawer open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="admin-shell flex min-h-screen bg-[#0f1419] text-slate-200">
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-white/5 bg-[#111827] transition-transform duration-300 ease-out lg:w-56 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2dd4bf]/20 text-[#2dd4bf]">
              🔧
            </span>
            <span className="brand-font text-lg font-bold text-white">
              Tools<span className="text-[#2dd4bf]">Nest</span>
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#2dd4bf] text-[#0f1419]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="text-base opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4 lg:hidden">
          <p className="truncate text-xs text-slate-500">Signed in as</p>
          <p className="truncate text-sm font-medium text-white">
            {user?.username || "Admin"}
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-56">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/5 bg-[#0f1419]/95 px-4 py-3 backdrop-blur sm:px-6 lg:justify-end lg:px-8 lg:py-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 lg:hidden"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>

          <div className="brand-font text-base font-bold text-white lg:hidden">
            Tools<span className="text-[#2dd4bf]">Nest</span>
            <span className="ml-1.5 text-xs font-medium text-slate-500">Admin</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user?.username}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2dd4bf] text-sm font-bold text-[#0f1419]"
              title={`Logout (${user?.username || "Admin"})`}
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
