/**
 * Pure math for the ROI calculator's pinned wipe. No DOM, no React — safe to
 * unit test directly with `node --test`, like service-scroll-sequence.ts.
 */

/**
 * Fraction of the pinned track the wipe takes. The rest is dwell time with
 * the calculator fully open and usable, mirroring how the Services cards
 * finish expanding well before that section releases.
 */
export const REVEAL_END = 0.3;

/**
 * Bottom inset percentage for the reveal's clip-path at a given scroll
 * `progress`: 100 is fully closed, 0 fully open. Clamped at both ends, so
 * once the wipe finishes it stays open for the rest of the scroll and can
 * never retract as the visitor keeps scrolling down.
 */
export function revealInsetPercent(progress: number): number {
  const opened = Math.min(1, Math.max(0, progress / REVEAL_END));
  return (1 - opened) * 100;
}

/** The clip-path the panel renders at a given scroll `progress`. */
export function revealClipPath(progress: number): string {
  return `inset(0% 0% ${revealInsetPercent(progress)}% 0%)`;
}
