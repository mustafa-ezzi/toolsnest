import { useEffect, type RefObject } from "react";
import { animate, onScroll } from "animejs";
import { stagger } from "animejs/utils";
import { useReducedMotion } from "./useReducedMotion";

type ScrollRevealOptions = {
  /** Extra CSS selectors inside the root to stagger after the root reveals */
  childSelector?: string;
  y?: number;
  duration?: number;
  childStagger?: number;
};

/**
 * Reveal an element when it enters the viewport (Anime.js onScroll).
 * Plays once; respects prefers-reduced-motion.
 */
export function useScrollReveal(
  ref: RefObject<HTMLElement | null>,
  options: ScrollRevealOptions = {},
) {
  const reduceMotion = useReducedMotion();
  const {
    childSelector,
    y = 36,
    duration = 550,
    childStagger = 55,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion) {
      el.style.opacity = "1";
      el.style.transform = "";
      return;
    }

    el.style.opacity = "0";
    el.style.transform = `translateY(${y}px)`;

    const children = childSelector
      ? Array.from(el.querySelectorAll<HTMLElement>(childSelector))
      : [];
    for (const child of children) {
      child.style.opacity = "0";
      child.style.transform = `translateY(${Math.round(y * 0.55)}px)`;
    }

    const rootAnim = animate(el, {
      opacity: [0, 1],
      translateY: [y, 0],
      duration,
      ease: "out(3)",
      autoplay: false,
    });

    const childAnim =
      children.length > 0
        ? animate(children, {
            opacity: [0, 1],
            translateY: [Math.round(y * 0.55), 0],
            duration: duration - 80,
            ease: "out(3)",
            delay: stagger(childStagger, { start: 120 }),
            autoplay: false,
          })
        : null;

    const observer = onScroll({
      target: el,
      enter: "bottom-=80",
      leave: "top",
      repeat: false,
      onEnter: () => {
        rootAnim.play();
        childAnim?.play();
      },
    });

    return () => {
      observer.revert();
      rootAnim.pause();
      childAnim?.pause();
    };
  }, [ref, reduceMotion, childSelector, y, duration, childStagger]);
}
