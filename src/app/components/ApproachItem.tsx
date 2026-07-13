import { motion, useTransform, type MotionValue } from "motion/react";
import { cn, TYPE } from "../lib/layout";
import type { ApproachStep } from "../data/content";
import { getCardIntensity } from "../lib/service-scroll-sequence";

type ApproachItemProps = ApproachStep & {
  /** This step's position on the timeline (0-based, reading order). */
  index: number;
  stepCount: number;
  /** Shared 0-1 progress for the whole Approach section. */
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
};

/**
 * One node on the Approach timeline. The dot sits on the shared rail drawn
 * by the parent section; as the reader scrolls, each step takes focus in
 * turn — its dot grows and darkens while the step's text comes to full
 * strength and the others sit dimmed.
 *
 * Dot geometry: the rail is `border-l-2` on the list, so its center is
 * 1px inside the list edge — 33px (mobile, pl-8) / 65px (desktop, pl-16)
 * left of this item's content box. Each dot is centered on that line.
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
}: ApproachItemProps) {
  const intensity = useTransform(scrollYProgress, (progress) =>
    getCardIntensity(progress, index, stepCount),
  );
  const dotScale = useTransform(intensity, [0, 1], [1, 1.6]);
  const focusOpacity = useTransform(intensity, [0, 1], [0, 1]);
  const contentOpacity = useTransform(intensity, [0, 1], [0.35, 1]);

  return (
    <li className="relative">
      {/* Timeline node — centered on the parent rail */}
      <motion.span
        aria-hidden
        style={reducedMotion ? undefined : { scale: dotScale }}
        className={cn(
          "absolute top-2 rounded-full bg-line",
          "size-[12px] -left-[39px]", // center at -33px (rail center, mobile)
          "md:size-[15px] md:-left-[72.5px]", // center at -65px (rail center, desktop)
        )}
      >
        {!reducedMotion && (
          <motion.span
            style={{ opacity: focusOpacity }}
            className="absolute inset-0 rounded-full bg-ink"
          />
        )}
      </motion.span>
      <motion.div
        style={reducedMotion ? undefined : { opacity: contentOpacity }}
        className="max-w-[800px]"
      >
        <h3 className={TYPE.stepTitle}>{title}</h3>
        {subtitle && <h4 className={cn(TYPE.stepTitle, "mt-2")}>{subtitle}</h4>}

        {steps && (
          <ol className={cn(TYPE.bodyRelaxed, "mt-6 list-decimal space-y-2 pl-6")}>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {paragraph && (
          <p className={cn(TYPE.bodyRelaxed, "mt-6 text-black/80")}>{paragraph}</p>
        )}
      </motion.div>
    </li>
  );
}
