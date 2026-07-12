/**
 * Pure math for the Services section's scroll-driven card sequence.
 * No DOM, no React — safe to unit test directly with `node --test`.
 */

/** 3 Consultation cards + 3 End-to-End Implementation cards. */
export const SERVICE_CARD_COUNT = 6;

/**
 * Progress (0-1) at which the 3rd card (index 2, "Vibe-to-Production")
 * reaches full intensity — the moment all 3 Consultation cards have been
 * sequentially highlighted. Reused as the heading-swap threshold.
 */
export const HEADING_SWAP_PROGRESS = 2.5 / SERVICE_CARD_COUNT;

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
 * The Services group heading swaps from "Consultation" to "Implementation"
 * once the 3rd card has fully highlighted, and reverts if the user scrolls
 * back above that point.
 */
export function getServicesHeadingLabel(
  progress: number,
): "Consultation" | "Implementation" {
  return progress >= HEADING_SWAP_PROGRESS ? "Implementation" : "Consultation";
}
