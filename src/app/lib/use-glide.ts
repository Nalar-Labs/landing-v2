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

  useEffect(() => {
    const root = rootRef.current;
    if (!root || slideCount === 0) return;

    const glide = new Glide(root, {
      type: "carousel",
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

    glide.on("run", () => setActiveIndex(glide.index));
    glide.mount();
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
