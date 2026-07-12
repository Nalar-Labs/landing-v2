import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Site-wide momentum scrolling (sui.io-style). Lenis moves the real
 * document scroll position each frame, so Framer Motion's `useScroll`
 * (which listens to native `scroll` events) picks up the eased values
 * automatically — no extra bridging needed.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
