import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate } from "animejs";
import { createTimeline } from "animejs/timeline";

export function StockBadge({ qty }: { qty: number }) {
  let cls = "bg-emerald-500/20 text-emerald-400";
  if (qty <= 15) cls = "bg-amber-500/20 text-amber-400";
  if (qty <= 5) cls = "bg-red-500/20 text-red-400";

  return (
    <span
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold ${cls}`}
    >
      {qty}
    </span>
  );
}

export function BrandBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="brand-font text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400 sm:text-base">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {action}
        </div>
      )}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-4">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
        🔍
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-[#2dd4bf]/50"
      />
    </div>
  );
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-hidden border-y border-white/5 bg-[#111827] sm:mx-0 sm:rounded-2xl sm:border">
      <div className="overflow-x-auto overscroll-x-contain">{children}</div>
    </div>
  );
}

const sizeClass = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClass;
}) {
  const [mounted, setMounted] = useState(open);
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (open) {
      closingRef.current = false;
      setMounted(true);
      return;
    }

    if (!mounted || closingRef.current) return;
    closingRef.current = true;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (reduceMotion || !backdrop || !panel) {
      setMounted(false);
      closingRef.current = false;
      return;
    }

    const tl = createTimeline({
      defaults: { duration: 220, ease: "in(2)" },
      onComplete: () => {
        setMounted(false);
        closingRef.current = false;
      },
    });
    tl.add(panel, { opacity: [1, 0], translateY: [0, 18], scale: [1, 0.97] }).add(
      backdrop,
      { opacity: [1, 0] },
      0,
    );

    return () => {
      tl.pause();
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted || !open) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (reduceMotion || !backdrop || !panel) return;

    const tl = createTimeline({ defaults: { duration: 320, ease: "out(3)" } });
    tl.add(backdrop, { opacity: [0, 1] }).add(
      panel,
      { opacity: [0, 1], translateY: [28, 0], scale: [0.96, 1] },
      "-=220",
    );

    return () => {
      tl.pause();
    };
  }, [mounted, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <button
        ref={backdropRef}
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0a0e14]/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative flex max-h-[92vh] w-full ${sizeClass[size]} flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#111827] shadow-[0_25px_80px_rgba(0,0,0,0.55)] sm:rounded-3xl`}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-white/5 px-5 pb-4 pt-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2dd4bf]/15 via-transparent to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">
                ToolsNest Admin
              </p>
              <h2
                id="admin-modal-title"
                className="brand-font text-xl font-bold text-white sm:text-2xl"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-white/5 bg-[#0f1419]/80 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Flash a table row after create/update (Anime.js). */
export function useRowFlash(flashId: number | null) {
  useEffect(() => {
    if (flashId == null) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const row = document.querySelector<HTMLElement>(
      `[data-row-id="${flashId}"]`,
    );
    if (!row || reduceMotion) return;

    const anim = animate(row, {
      backgroundColor: [
        "rgba(45, 212, 191, 0.28)",
        "rgba(45, 212, 191, 0.08)",
        "rgba(0, 0, 0, 0)",
      ],
      duration: 1200,
      ease: "out(2)",
    });
    return () => {
      anim.pause();
    };
  }, [flashId]);
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0f1419]/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0f1419]/80 px-3.5 py-3 text-left transition hover:border-white/10"
    >
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-slate-500">
            {description}
          </span>
        )}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#2dd4bf]" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function ImageUploadBox({
  label,
  previewUrl,
  onFile,
  aspect = "square",
}: {
  label: string;
  previewUrl?: string;
  onFile: (file: File) => void;
  aspect?: "square" | "wide";
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <label
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-[#0f1419]/80 transition hover:border-[#2dd4bf]/50 hover:bg-[#0f1419] ${
          aspect === "wide" ? "min-h-[140px]" : "min-h-[120px]"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className={`w-full object-cover ${
              aspect === "wide" ? "h-36" : "h-28 max-w-[10rem] object-contain p-3"
            }`}
          />
        ) : (
          <div className="px-4 py-6 text-center">
            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2dd4bf]/15 text-[#2dd4bf]">
              ↑
            </span>
            <p className="text-sm font-medium text-slate-300">
              Click to upload image
            </p>
            <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP · max 5MB</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        {previewUrl && (
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Change
          </span>
        )}
      </label>
    </div>
  );
}

export const adminInputClass =
  "w-full rounded-xl border border-white/10 bg-[#0f1419] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#2dd4bf]/60 focus:ring-2 focus:ring-[#2dd4bf]/15";

export const adminBtnPrimary =
  "inline-flex flex-1 items-center justify-center rounded-xl bg-[#2dd4bf] px-5 py-2.5 text-sm font-semibold text-[#0f1419] transition hover:brightness-110 disabled:opacity-60 sm:flex-none";

export const adminBtnGhost =
  "inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 sm:flex-none";
