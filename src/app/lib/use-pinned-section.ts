import { useRef, type RefObject } from "react";
import { useScroll, type MotionValue } from "motion/react";
import { useMediaQuery } from "./use-media-query";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * A pinned section is a tall track that scrolls beneath a sticky,
 * viewport-height panel: page scroll drives `scrollYProgress` from 0 to 1
 * while the panel stays put, then the page releases and moves on.
 *
 * Pinning is refused in three cases, each of which would otherwise break
 * something:
 *
 * - **Narrow viewports.** The panel is a horizontal layout; below 768px it
 *   has nowhere to put the content.
 * - **Short viewports.** The panel is a fixed `h-screen` box, so anything
 *   taller than the viewport is simply clipped off the bottom with no
 *   scrollbar to reach it. Each caller declares the height it needs.
 * - **Reduced motion.** The whole point of the pin is the scroll-driven
 *   reveal; without it the pin is just a long empty scroll.
 *
 * When pinning is refused the section renders in normal flow, which cannot
 * clip at any size.
 */
export function usePinDecision(minHeightPx: number): boolean {
  const isWideEnough = useMediaQuery("(min-width: 768px)");
  const isTallEnough = useMediaQuery(`(min-height: ${minHeightPx}px)`);
  const reducedMotion = usePrefersReducedMotion();
  return isWideEnough && isTallEnough && !reducedMotion;
}

/**
 * The scroll tracker for a pinned section.
 *
 * **The caller must remount this on every change of `pin`** — give the
 * component holding it a `key` derived from the decision, the way the
 * sections here do. `useScroll` binds its `offset` when the tracker is
 * created and motion does not retarget an existing one, so flipping `pin`
 * without a remount leaves the tracker measuring against the old offsets
 * and the reveal never completes.
 */
export function usePinnedTrack(pin: boolean): {
  trackRef: RefObject<HTMLElement | null>;
  scrollYProgress: MotionValue<number>;
} {
  const trackRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    // Pinned, progress spans the track's own travel past the sticky panel.
    // Unpinned, it spans the section entering and leaving the viewport.
    offset: pin ? ["start start", "end end"] : ["start end", "end start"],
  });

  return { trackRef, scrollYProgress };
}

/**
 * Track height while pinned. 260vh matches the Services section: the reveal
 * finishes early and the rest is dwell time, so the panel is held open for
 * most of the scroll rather than flicking past.
 */
export const PIN_TRACK = "h-[260vh]";

/** The sticky panel. `pt-32` clears the 112px fixed navbar. */
export const PIN_PANEL = "sticky top-0 flex h-screen flex-col justify-center pt-32";
