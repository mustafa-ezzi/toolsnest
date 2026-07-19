import { Link } from "react-router-dom";

const HIGHLIGHTS = [
  { label: "Free shipping Rs 15,000+", color: "#1a7a88", icon: "🚚" },
  { label: "Genuine brands", color: "#e8a317", icon: "✓" },
  { label: "Expert support", color: "#2a8fbf", icon: "💬" },
  { label: "Secure checkout", color: "#3d9b6e", icon: "🔒" },
];

export default function AboutSupportBand() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto mb-8 grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.label}
            className="neo-raised flex items-center gap-3 rounded-2xl px-4 py-4"
            style={{
              background: `linear-gradient(135deg, ${h.color}22, var(--neo-surface) 70%)`,
              boxShadow: `
                6px 6px 14px rgba(163,177,198,0.45),
                -6px -6px 14px rgba(255,255,255,0.9),
                inset 0 0 0 1.5px ${h.color}44
              `,
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: `${h.color}28`, color: h.color }}
            >
              {h.icon}
            </span>
            <span className="text-sm font-semibold" style={{ color: h.color }}>
              {h.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div
          className="flex flex-col justify-center overflow-hidden rounded-[2rem] px-8 py-14 text-white sm:px-12"
          style={{
            background:
              "linear-gradient(135deg, #0f4c5c 0%, #1a7a88 48%, #2a8fbf 100%)",
            boxShadow:
              "14px 14px 28px rgba(163,177,198,0.5), -10px -10px 22px rgba(255,255,255,0.85)",
          }}
        >
          <h2 className="brand-font text-3xl font-bold sm:text-4xl">
            Built for the Trade.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/85">
            ToolsNest was founded by tradespeople who know that the right tool
            isn&apos;t just about getting the job done—it&apos;s about doing it
            right, safely, and efficiently.
          </p>
          <Link
            to="/about"
            className="mt-8 inline-flex w-fit rounded-2xl border border-white/50 bg-white/15 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
          >
            Our Story
          </Link>
        </div>

        <div
          className="relative flex flex-col justify-center overflow-hidden rounded-[2rem] px-8 py-14 sm:px-12"
          style={{
            background:
              "linear-gradient(160deg, rgba(232,163,23,0.18) 0%, var(--neo-surface) 55%)",
            boxShadow:
              "14px 14px 28px rgba(163,177,198,0.5), -10px -10px 22px rgba(255,255,255,0.85)",
          }}
        >
          <div className="pointer-events-none absolute -right-6 bottom-0 text-[160px] leading-none opacity-20">
            🔧
          </div>
          <h2 className="brand-font relative text-3xl font-bold text-[var(--neo-ink)] sm:text-4xl">
            Need{" "}
            <span className="text-[var(--neo-amber)]">Expert</span> Advice?
          </h2>
          <p className="relative mt-4 max-w-md leading-relaxed text-[var(--neo-muted)]">
            Our team of tool specialists is ready to help you find exactly what
            you need for your next big project.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <a
              href="tel:18008665776"
              className="neo-btn-fill rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Call 1-800-TOOL-PRO
            </a>
            <a
              href="https://wa.me/18008665776"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              style={{
                background: "linear-gradient(145deg, #25D366, #128C7E)",
                boxShadow: "6px 6px 14px rgba(18,140,126,0.35)",
              }}
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
