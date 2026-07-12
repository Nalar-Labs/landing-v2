// Shared layout + typography constants so spacing and type stay consistent
// across sections instead of being re-typed ad-hoc. See guidelines/Guidelines.md.

export { cn } from "../components/ui/utils";

/** Section container: centered, max-width, responsive gutters (8pt system). */
export const CONTAINER = "mx-auto w-full max-w-[1600px] px-6 md:px-12";

/** Vertical rhythm for full sections. */
export const SECTION = {
  wrap: "py-24 md:py-32",
  titleGap: "mb-16 md:mb-24",
  blockGap: "mb-16 md:mb-24",
} as const;

/**
 * Typography roles — Public Sans display type with tight negative tracking.
 * Mirrors the scale in guidelines/Guidelines.md §3.
 */
export const TYPE = {
  hero:
    "font-display font-light text-[48px] md:text-[72px] lg:text-[96px] leading-[1.1] tracking-[-2.88px]",
  h2: "font-display font-light text-[56px] md:text-[96px] leading-[1.05] tracking-[-2.88px]",
  h3: "font-display font-light text-[40px] md:text-[64px] leading-[1.05] tracking-[-1.92px]",
  cardTitle:
    "font-display font-medium text-[24px] md:text-[32px] leading-tight tracking-[-0.96px]",
  stepTitle:
    "font-display font-medium text-[28px] md:text-[32px] leading-tight tracking-[-0.96px]",
  body: "font-display font-light text-[18px] md:text-[24px] leading-tight tracking-[-0.72px]",
  bodyRelaxed:
    "font-display font-light text-[20px] md:text-[24px] leading-relaxed tracking-[-0.72px]",
} as const;
