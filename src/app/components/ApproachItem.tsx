import { motion, useTransform, type MotionValue } from "motion/react";
import { cn, TYPE } from "../lib/layout";
import type { ApproachStep } from "../data/content";
import { getCardIntensity, getCardExpansion } from "../lib/service-scroll-sequence";

type ApproachItemProps = ApproachStep & {
  /** This step's position on the timeline (0-based, reading order). */
  index: number;
  stepCount: number;
  /** Shared 0-1 progress for the whole Approach section. */
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
  /** Tighter layout while the section is pinned on desktop. */
  compact?: boolean;
};

/**
 * One node on the Approach timeline. As the reader scrolls, each step's text
 * comes to full strength in turn and STAYS readable (ramp-and-hold), while
 * the dot spotlight travels: the current step's dot is large and dark, then
 * hands off to the next.
 *
 * Dot geometry: the rail is `border-l-2` on the list, so its center is
 * 1px inside the list edge — 33px (pl-8) / 65px (desktop non-compact,
 * pl-16) left of this item's content box. Each dot is centered on that
 * line.
 */
export function ApproachItem({
  title,
  subtitle,
  steps,
  paragraph,
  index,
  stepCount,
  scrollYProgress,
  reducedMotion,
  compact = false,
}: ApproachItemProps) {
  const intensity = useTransform(scrollYProgress, (progress) =>
    getCardIntensity(progress, index, stepCount),
  );
  const expansion = useTransform(scrollYProgress, (progress) =>
    getCardExpansion(progress, index, stepCount),
  );
  const dotScale = useTransform(intensity, [0, 1], [1, 1.6]);
  const dotFocus = useTransform(intensity, [0, 1], [0, 1]);
  const contentOpacity = useTransform(expansion, [0, 1], [0.3, 1]);

  return (
    <li className="relative">
      {/* Timeline node — centered on the parent rail */}
      <motion.span
        aria-hidden
        style={reducedMotion ? undefined : { scale: dotScale }}
        className={cn(
          "absolute top-2 rounded-full bg-line",
          "size-[12px] -left-[39px]", // center at -33px (rail center)
          !compact && "md:size-[15px] md:-left-[72.5px]", // center at -65px (rail center, desktop rail inset)
        )}
      >
        {!reducedMotion && (
          <motion.span
            style={{ opacity: dotFocus }}
            className="absolute inset-0 rounded-full bg-ink"
          />
        )}
      </motion.span>
      <motion.div
        style={reducedMotion ? undefined : { opacity: contentOpacity }}
        className="max-w-[800px]"
      >
        <h3 className={compact ? COMPACT_TITLE : TYPE.stepTitle}>{title}</h3>
        {subtitle && (
          <h4 className={cn(compact ? COMPACT_TITLE : TYPE.stepTitle, "mt-1")}>{subtitle}</h4>
        )}

        {steps && (
          <ol
            className={cn(
              compact ? COMPACT_BODY : TYPE.bodyRelaxed,
              "list-decimal pl-6",
              compact ? "mt-3 space-y-1" : "mt-6 space-y-2",
            )}
          >
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {paragraph && (
          <p
            className={cn(
              compact ? COMPACT_BODY : TYPE.bodyRelaxed,
              compact ? "mt-3" : "mt-6",
              "text-black/80",
            )}
          >
            {paragraph}
          </p>
        )}
      </motion.div>
    </li>
  );
}

/** Pinned-mode type: smaller so all three steps fit one viewport. */
const COMPACT_TITLE =
  "font-display font-medium text-[24px] leading-tight tracking-[-0.72px]";
const COMPACT_BODY = "font-display font-light text-[17px] leading-normal";
