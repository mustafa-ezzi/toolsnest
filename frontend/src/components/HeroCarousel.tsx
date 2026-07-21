import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createTimeline } from "animejs/timeline";
import type { Banner } from "../types";
import { useReducedMotion } from "../hooks/useReducedMotion";

type Props = { banners: Banner[] };

export default function HeroCarousel({ banners }: Props) {
  const slides =
    banners.length > 0
      ? banners
      : [
          {
            id: 0,
            title: "Built Tough. Built to Last.",
            subtitle: "Discover our exclusive range of heavy-duty hand tools.",
            image_url:
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
            cta_label: "Shop Hand Tools",
            cta_url: "/products?category=hand-tools",
            sort_order: 0,
            is_active: true,
          },
        ];

  const [index, setIndex] = useState(0);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const slide = slides[index];

  useEffect(() => {
    const panel = captionRef.current;
    if (!panel || reduceMotion) return;
    const timeline = createTimeline({
      defaults: { duration: 500, ease: "out(3)" },
    });
    timeline
      .add(panel, { opacity: [0, 1], translateY: [22, 0] })
      .add(".hero-title", { opacity: [0, 1], translateY: [14, 0] }, "-=260")
      .add(".hero-subtitle", { opacity: [0, 1], translateY: [10, 0] }, "-=280")
      .add(".hero-cta", { opacity: [0, 1], scale: [0.96, 1] }, "-=280");
    return () => {
      timeline.pause();
    };
  }, [index, reduceMotion]);

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }
  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  return (
    <section className="relative px-3 pb-3 pt-1 sm:px-6 sm:pb-4 sm:pt-2">
      <div className="relative mx-auto h-[min(68vh,520px)] min-h-[320px] max-w-7xl overflow-hidden rounded-[1.5rem] neo-raised sm:min-h-[400px] sm:rounded-[2rem] sm:h-[min(72vh,580px)]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={s.image_url}
              alt={s.title}
              className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${
                i === index ? "scale-105" : "scale-100"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f4c5c]/90 via-[#1a2332]/45 to-[#e8a317]/10 sm:bg-gradient-to-r sm:from-[#0f4c5c]/80 sm:via-[#1a2332]/50 sm:to-[#e8a317]/15" />
          </div>
        ))}

        {/* Spatial glass caption panel */}
        <div className="relative z-10 flex h-full max-w-xl flex-col justify-end p-4 pb-14 sm:justify-center sm:p-10 sm:pb-10 lg:p-14">
          <div
            key={slide.id}
            ref={captionRef}
            className="animate-fade-up rounded-2xl border border-white/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:rounded-3xl sm:p-8"
            style={{
              background:
                "linear-gradient(145deg, rgba(26,122,136,0.35), rgba(255,255,255,0.18) 55%, rgba(232,163,23,0.2))",
            }}
          >
            <span className="mb-2 inline-flex rounded-full bg-[var(--neo-amber)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a2332] sm:mb-3 sm:px-3 sm:py-1 sm:text-[11px]">
              ToolsNest Store
            </span>
            <h1 className="hero-title brand-font text-[1.65rem] font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="hero-subtitle mt-2 line-clamp-2 max-w-md text-sm text-white/85 sm:mt-3 sm:line-clamp-none sm:text-base">
                {slide.subtitle}
              </p>
            )}
            <div className="hero-cta mt-4 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
              {slide.cta_label && (
                <Link
                  to={slide.cta_url || "/products"}
                  className="neo-btn-fill w-full rounded-2xl px-5 py-3 text-center text-sm font-semibold sm:w-auto sm:px-6"
                >
                  {slide.cta_label}
                </Link>
              )}
              <Link
                to="/products?featured=true"
                className="w-full rounded-2xl border border-white/50 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto sm:px-6"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-lg text-[var(--neo-ink)] neo-raised-sm neo-pressable sm:left-6 sm:flex sm:h-12 sm:w-12"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-lg text-[var(--neo-ink)] neo-raised-sm neo-pressable sm:right-6 sm:flex sm:h-12 sm:w-12"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 neo-inset-sm sm:bottom-6 sm:gap-2 sm:px-3 sm:py-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="flex h-11 w-11 items-center justify-center sm:h-10 sm:w-10"
                >
                  <span
                    className={`block rounded-full transition-all ${
                      i === index
                        ? "h-2.5 w-7 bg-[var(--neo-amber)]"
                        : "h-2.5 w-2.5 bg-white/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
