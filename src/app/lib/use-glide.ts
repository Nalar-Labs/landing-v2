import { useEffect, useRef, useState } from "react";
import Glide from "@glidejs/glide";

/**
 * Owns a Glide.js instance mounted on `rootRef` and mirrors the active slide
 * index into React state, so dot controls can be plain Tailwind-styled
 * buttons instead of Glide's CSS-class-driven bullets.
 */
export function useGlide(slideCount: number, reducedMotion: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glideRef = useRef<Glide | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Mirrors activeIndex for the effect below without listing it as a dep
  // (a dep would tear down and rebuild Glide on every slide change).
  const activeIndexRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || slideCount === 0) return;

    const glide = new Glide(root, {
      type: "carousel",
      // Re-created when reducedMotion changes; resume at the slide the user
      // was on, clamped in case the slide count shrank.
      startAt: Math.min(activeIndexRef.current, slideCount - 1),
      perView: 3,
      gap: 24,
      // Glide's keyboard module listens document-wide and would hijack
      // arrow keys for the whole page; the dot buttons are the keyboard path.
      keyboard: false,
      animationDuration: reducedMotion ? 0 : 400,
      breakpoints: {
        1280: { perView: 2 },
        768: { perView: 1 },
      },
    });

    glide.on("run", () => {
      activeIndexRef.current = glide.index;
      setActiveIndex(glide.index);
    });
    glide.mount();
    // Glide's carousel mode clones slides for looping; the clones duplicate
    // the card buttons in the a11y tree but React handlers don't survive
    // cloneNode, so they'd be dead controls — hide them from AT and tab order.
    root.querySelectorAll(".glide__slide--clone").forEach((clone) => {
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("button, a").forEach((el) => {
        (el as HTMLElement).tabIndex = -1;
      });
    });
    // Sync React state with where the new instance actually started.
    activeIndexRef.current = glide.index;
    setActiveIndex(glide.index);
    glideRef.current = glide;

    return () => {
      glide.destroy();
      glideRef.current = null;
    };
  }, [slideCount, reducedMotion]);

  const goTo = (index: number) => {
    glideRef.current?.go(`=${index}`);
  };

  return { rootRef, activeIndex, goTo };
}
