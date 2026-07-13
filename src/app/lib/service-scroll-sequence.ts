/**
 * Pure math for the Services section's scroll-driven card sequence.
 * No DOM, no React — safe to unit test directly with `node --test`.
 */

/** 3 Consultation cards + 3 End-to-End Implementation cards. */
export const SERVICE_CARD_COUNT = 6;

/**
 * Returns 0-1: how "inflated" the card at `index` should be at the given
 * overall scroll `progress`. Each card owns an equal band of the 0-1 range
 * and ramps linearly up to 1 at the band's midpoint, then back down to 0 —
 * so only the card whose band contains `progress` is ever significantly
 * inflated, matching a spotlight passing across the cards as you scroll.
 */
export function getCardIntensity(
  progress: number,
  index: number,
  count: number = SERVICE_CARD_COUNT,
): number {
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
 * Returns 0-1: how "expanded" the card at `index` should be at the given
 * overall scroll `progress`. Unlike getCardIntensity's travelling spotlight,
 * expansion is ramp-and-hold: a card grows over the first 60% of its band
 * and then STAYS expanded for the rest of the scroll — earlier cards remain
 * open while later ones join in. Scrolling back up reverses it naturally.
 */
export function getCardExpansion(
  progress: number,
  index: number,
  count: number = SERVICE_CARD_COUNT,
): number {
  const band = 1 / count;
  const start = index * band;
  const rampEnd = start + band * 0.6;

  if (progress <= start) return 0;
  if (progress >= rampEnd) return 1;
  return (progress - start) / (rampEnd - start);
}
