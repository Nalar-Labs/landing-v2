import { motion, useTransform, type MotionValue } from "motion/react";
import { cn, TYPE } from "../lib/layout";
import type { Service } from "../data/content";
import { getCardIntensity } from "../lib/service-scroll-sequence";
import { SERVICE_CARD_GRADIENTS } from "../lib/service-gradients";

type ServiceCardProps = Service & {
  /** This card's position among all 6 Services cards (0-5), reading order. */
  index: number;
  cardCount: number;
  /** Shared 0-1 progress for the whole Services section, from Services.tsx. */
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
  /** Tighter layout while the section is pinned on desktop. */
  compact?: boolean;
};

export function ServiceCard({
  title,
  description,
  gradient = false,
  index,
  cardCount,
  scrollYProgress,
  reducedMotion,
  compact = false,
}: ServiceCardProps) {
  const intensity = useTransform(scrollYProgress, (progress) =>
    getCardIntensity(progress, index, cardCount),
  );
  const scale = useTransform(intensity, [0, 1], [1, 1.12]);
  const gradientOpacity = useTransform(intensity, [0, 1], [0, 0.92]);
  // Lift the expanding card above its neighbors so the larger scale never
  // renders underneath an adjacent card.
  const zIndex = useTransform(intensity, (value) => (value > 0.05 ? 10 : 0));

  return (
    <motion.div
      style={reducedMotion ? undefined : { scale, zIndex }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-card",
        compact ? "min-h-[190px] p-6" : "min-h-[300px] p-8 md:p-[30px]",
        gradient
          ? "bg-surface bg-gradient-to-r from-[#3c3c3c33] to-[#ffffff33]"
          : "bg-surface",
      )}
    >
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: gradientOpacity, backgroundImage: SERVICE_CARD_GRADIENTS[index] }}
          className="pointer-events-none absolute inset-0 rounded-card"
        />
      )}
      <h4 className={cn(TYPE.cardTitle, "relative z-10 mb-8", compact && "mb-4 text-[24px]")}>
        {title}
      </h4>
      <p className={cn(TYPE.body, "relative z-10 text-muted-ink", compact && "text-[18px]")}>
        {description}
      </p>
    </motion.div>
  );
}
