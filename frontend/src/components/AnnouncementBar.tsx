import { Link } from "react-router-dom";

export default function AnnouncementBar() {
  return (
    <div
      className="relative z-[60] text-center text-[13px] font-medium tracking-wide text-white"
      style={{
        background:
          "linear-gradient(90deg, #0f4c5c 0%, #1a7a88 35%, #2a8fbf 65%, #0f4c5c 100%)",
        backgroundSize: "200% 100%",
      }}
    >
      <div className="px-3 py-2.5 sm:px-4 sm:py-2">
        <span className="mr-2 inline-block rounded-full bg-[var(--neo-amber)] px-2 py-0.5 text-[10px] font-bold text-[#1a2332] sm:text-[11px]">
          NEW
        </span>
        <span className="inline max-sm:text-[12px]">
          Free shipping on orders over Rs 15,000
        </span>
      </div>
    </div>
  );
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`brand-font text-[1.4rem] font-bold tracking-tight drop-shadow-sm ${className}`}
    >
      <span className="text-[var(--neo-accent)]">Tools</span>
      <span className="text-[var(--neo-accent-2)]">Nest</span>
    </Link>
  );
}
