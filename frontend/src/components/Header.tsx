import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { animate } from "animejs";
import { BrandLogo } from "./AnnouncementBar";
import { useCart } from "../context/CartContext";
import { useReducedMotion } from "../hooks/useReducedMotion";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `liquid-nav-link ${isActive ? "is-active" : ""}`;

export default function Header() {
  const { count } = useCart();
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reduceMotion || count < 1 || !badgeRef.current) return;
    const anim = animate(badgeRef.current, {
      scale: [1, 1.22, 1],
      duration: 380,
      ease: "out(3)",
    });
    return () => {
      anim.pause();
    };
  }, [count, reduceMotion]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    setMenuOpen(false);
  }

  return (
    <div className="liquid-glass-shell">
      <header className="liquid-glass">
        <div className="liquid-glass__inner mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-5 lg:gap-6">
          <BrandLogo />

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/support" className={navLinkClass}>
              Support
            </NavLink>
          </nav>

          <form
            onSubmit={onSearch}
            className="relative mx-auto hidden min-w-0 flex-1 max-w-xl sm:block"
          >
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands..."
              className="liquid-search w-full py-2.5 pl-10 pr-4 text-sm"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="liquid-icon-btn h-11 w-11 md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <Link
              to="/cart"
              className="liquid-icon-btn relative h-11 w-11"
              aria-label="Cart"
            >
              <CartIcon />
              {count > 0 && (
                <span
                  ref={badgeRef}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--neo-accent)] px-1 text-[11px] font-semibold text-white shadow-md"
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <div className="liquid-glass__inner border-t border-white/30 px-3 py-3 md:hidden animate-fade-in sm:px-4">
            <form onSubmit={onSearch} className="mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands..."
                className="liquid-search w-full px-4 py-3 text-sm"
              />
            </form>
            <div className="flex flex-col gap-1.5 text-sm font-medium text-[var(--neo-ink)]">
              <Link
                to="/products"
                className="liquid-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/about"
                className="liquid-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/support"
                className="liquid-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                Support
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6l-1-3H2" />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
