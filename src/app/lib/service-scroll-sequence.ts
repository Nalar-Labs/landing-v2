/**
 * Pure math for the Services section's scroll-driven card sequence.
 * No DOM, no React — safe to unit test directly with `node --test`.
 */

/**
 * Each card owns an equal slice of the pinned scroll and opens across it.
 * The final 10% is deliberately left over so all three sit fully expanded
 * before the section releases.
 */
const CARD_WINDOWS = [
  [0, 0.3],
  [0.3, 0.6],
  [0.6, 0.9],
] as const;

/** Derived from CARD_WINDOWS so the two can never drift out of sync. */
export const SERVICE_CARD_COUNT = CARD_WINDOWS.length;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) return value >= end ? 1 : 0;
  return clamp01((value - start) / (end - start));
}

/**
 * Returns 0-1: how "inflated" the card at `index` should be at the given
 * overall scroll `progress`. Each card owns an equal band of the 0-1 range
 * and ramps linearly up to 1 at the band's midpoint, then back down to 0 —
 * so only the card whose band contains `progress` is ever significantly
 * inflated, matching a spotlight passing across the cards as you scroll.
 * `count` has no default for the same reason `getCardExpansion`'s doesn't —
 * see that function's comment.
 */
export function getCardIntensity(progress: number, index: number, count: number): number {
  const band = 1 / count;
  const start = index * band;
  const peak = start + band / 2;
  const end = start + band;

  if (progress <= start || progress >= end) return 0;

  // Handle floating-point precision near peak
  if (Math.abs(progress - peak) < 1e-14) return 1;

  if (progress <= peak) {
    return (progress - start) / (peak - start);
  }

  const result = (end - progress) / (end - peak);
  // Round to 1 if very close due to floating-point precision
  if (Math.abs(result - 1) < 1e-10) return 1;
  return result;
}

/**
 * Returns 0-1: how "expanded" a card should be at the given scroll
 * `progress`, using a generic per-count band ramp. `count` has no default —
 * every caller must be explicit, because a default tied to
 * SERVICE_CARD_COUNT previously collided silently with ApproachItem's
 * stepCount once both happened to equal 3. Reused by ApproachItem's
 * timeline; Services cards use getServiceCardExpansion instead, below.
 */
export function getCardExpansion(progress: number, index: number, count: number): number {
  const band = 1 / count;
  const start = index * band;
  const rampEnd = start + band * 0.6;

  if (progress <= start) return 0;
  if (progress >= rampEnd) return 1;
  return (progress - start) / (rampEnd - start);
}

/**
 * Returns 0-1: how "expanded" the Services card at `index` should be at the
 * given scroll `progress`. Always exactly SERVICE_CARD_COUNT (3) cards with
 * hand-tuned windows — there is no generic/count-based path here, so this
 * can never collide with another reuse of getCardExpansion's math.
 */
export function getServiceCardExpansion(progress: number, index: number): number {
  const [start, end] = CARD_WINDOWS[index];
  return inverseLerp(start, end, progress);
}
