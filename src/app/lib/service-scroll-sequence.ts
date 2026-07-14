/**
 * Pure math for the Services section's scroll-driven card sequence.
 * No DOM, no React — safe to unit test directly with `node --test`.
 */

/** 3 Consultation cards + 3 End-to-End Implementation cards. */
export const SERVICE_CARD_COUNT = 6;

const FIRST_GROUP_END = 0.36;
const FIRST_GROUP_FADE_END = 0.48;
const SECOND_SUBTITLE_FADE_START = 0.48;
const SECOND_SUBTITLE_FADE_END = 0.58;
const SECOND_GROUP_TEXT_FADE_END = 0.68;

const FIRST_GROUP_CARD_WINDOWS = [
  [0, 0.12],
  [0.12, 0.24],
  [0.24, FIRST_GROUP_END],
] as const;

const SECOND_GROUP_CARD_WINDOWS = [
  [SECOND_GROUP_TEXT_FADE_END, 0.78],
  [0.78, 0.89],
  [0.89, 1],
] as const;

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
 * overall scroll `progress`. The Services section advances one subtitle at a
 * time: group 1 cards open sequentially, all group 1 cards collapse/fade out,
 * the subtitle crossfades to group 2, group 2 text fades in collapsed, and then
 * group 2 cards open sequentially until the pinned section releases.
 */
export function getCardExpansion(
  progress: number,
  index: number,
  count: number = SERVICE_CARD_COUNT,
): number {
  if (count !== SERVICE_CARD_COUNT) {
    const band = 1 / count;
    const start = index * band;
    const rampEnd = start + band * 0.6;

    if (progress <= start) return 0;
    if (progress >= rampEnd) return 1;
    return (progress - start) / (rampEnd - start);
  }

  const isFirstGroup = index < 3;
  const localIndex = isFirstGroup ? index : index - 3;
  const [start, end] = (isFirstGroup ? FIRST_GROUP_CARD_WINDOWS : SECOND_GROUP_CARD_WINDOWS)[
    localIndex
  ];
  const expanded = inverseLerp(start, end, progress);

  if (isFirstGroup) {
    const collapse = 1 - inverseLerp(FIRST_GROUP_END, FIRST_GROUP_FADE_END, progress);
    return Math.min(expanded, collapse);
  }

  return expanded;
}

/**
 * Returns 0-1 opacity for each three-card Services group while pinned.
 */
export function getServiceHeadingOpacity(progress: number, groupIndex: number): number {
  if (groupIndex === 0) {
    return 1 - inverseLerp(FIRST_GROUP_END, FIRST_GROUP_FADE_END, progress);
  }

  return inverseLerp(SECOND_SUBTITLE_FADE_START, SECOND_SUBTITLE_FADE_END, progress);
}

/**
 * Returns 0-1 opacity for each Services group card row while pinned.
 */
export function getServiceCardsOpacity(progress: number, groupIndex: number): number {
  if (groupIndex === 0) {
    return 1 - inverseLerp(FIRST_GROUP_END, FIRST_GROUP_FADE_END, progress);
  }

  return inverseLerp(SECOND_SUBTITLE_FADE_END, SECOND_GROUP_TEXT_FADE_END, progress);
}
