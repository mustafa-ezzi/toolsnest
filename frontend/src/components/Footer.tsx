import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative mt-4 overflow-hidden bg-[var(--neo-bg)]">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-4">
        <div className="neo-raised grid gap-10 rounded-[2rem] px-6 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
          <div className="animate-fade-up">
            <div className="brand-font mb-3 text-xl font-bold text-[var(--neo-ink)]">
              Tools<span className="text-[var(--neo-accent-2)]">Nest</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--neo-muted)]">
              The premier destination for professional-grade power tools, hand
              tools, and equipment. Built for the trade.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--neo-ink)]">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-[var(--neo-muted)]">
              <li>
                <Link className="hover:text-[var(--neo-accent)]" to="/products">
                  All Products
                </Link>
              </li>
              <li>
                <Link className="hover:text-[var(--neo-accent)]" to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="hover:text-[var(--neo-accent)]" to="/track-order">
                  Track Order
                </Link>
              </li>
              <li>
                <Link className="hover:text-[var(--neo-accent)]" to="/support">
                  Support & FAQ
                </Link>
              </li>
              <li>
                <Link className="hover:text-[var(--neo-accent)]" to="/admin/login">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--neo-ink)]">
              Categories
            </h3>
            <ul className="space-y-2 text-sm text-[var(--neo-muted)]">
              <li>
                <Link
                  className="hover:text-[var(--neo-accent)]"
                  to="/products?category=power-tools"
                >
                  Power Tools
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-[var(--neo-accent)]"
                  to="/products?category=hand-tools"
                >
                  Hand Tools
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-[var(--neo-accent)]"
                  to="/products?category=safety"
                >
                  Safety Equipment
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-[var(--neo-accent)]"
                  to="/products?category=measuring"
                >
                  Measuring & Layout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--neo-ink)]">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-[var(--neo-muted)]">
              <li className="flex gap-2">
                <span className="mt-0.5 text-[var(--neo-accent-2)]">⌂</span>
                <span>
                  123 Industrial Parkway, Suite 100
                  <br />
                  Building City, BC 90210
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--neo-accent-2)]">☎</span>
                <a className="hover:text-[var(--neo-accent)]" href="tel:18008665776">
                  1-800-TOOL-PRO
                </a>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--neo-accent-2)]">✉</span>
                <a
                  className="hover:text-[var(--neo-accent)]"
                  href="mailto:support@toolsnest.tools"
                >
                  support@toolsnest.tools
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="py-5 text-center text-xs text-[var(--neo-muted)]">
          © {new Date().getFullYear()} ToolsNest. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
