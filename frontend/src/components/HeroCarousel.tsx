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
    <section className="relative px-4 pb-4 pt-2 sm:px-6">
      <div className="relative mx-auto h-[min(72vh,580px)] min-h-[400px] max-w-7xl overflow-hidden rounded-[2rem] neo-raised">
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f4c5c]/80 via-[#1a2332]/50 to-[#e8a317]/15" />
          </div>
        ))}

        {/* Spatial glass caption panel */}
        <div className="relative z-10 flex h-full max-w-xl flex-col justify-center p-6 sm:p-10 lg:p-14">
          <div
            key={slide.id}
            ref={captionRef}
            className="animate-fade-up rounded-3xl border border-white/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8"
            style={{
              background:
                "linear-gradient(145deg, rgba(26,122,136,0.35), rgba(255,255,255,0.18) 55%, rgba(232,163,23,0.2))",
            }}
          >
            <span className="mb-3 inline-flex rounded-full bg-[var(--neo-amber)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1a2332]">
              ToolsNest Store
            </span>
            <h1 className="hero-title brand-font text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="hero-subtitle mt-3 max-w-md text-sm text-white/85 sm:text-base">
                {slide.subtitle}
              </p>
            )}
            <div className="hero-cta mt-7 flex flex-wrap gap-3">
              {slide.cta_label && (
                <Link
                  to={slide.cta_url || "/products"}
                  className="neo-btn-fill rounded-2xl px-6 py-3 text-sm font-semibold"
                >
                  {slide.cta_label}
                </Link>
              )}
              <Link
                to="/products?featured=true"
                className="rounded-2xl border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
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
              className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-lg text-[var(--neo-ink)] neo-raised-sm neo-pressable sm:left-6"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-lg text-[var(--neo-ink)] neo-raised-sm neo-pressable sm:right-6"
            >
              ›
            </button>
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full px-3 py-2 neo-inset-sm">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === index
                      ? "w-7 bg-[var(--neo-amber)]"
                      : "w-2.5 bg-white/50 hover:bg-[var(--neo-accent-2)]"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
