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
};

export function ServiceCard({
  title,
  description,
  gradient = false,
  index,
  cardCount,
  scrollYProgress,
  reducedMotion,
}: ServiceCardProps) {
  const intensity = useTransform(scrollYProgress, (progress) =>
    getCardIntensity(progress, index, cardCount),
  );
  const scale = useTransform(intensity, [0, 1], [1, 1.06]);
  const gradientOpacity = useTransform(intensity, [0, 1], [0, 0.92]);

  return (
    <motion.div
      style={reducedMotion ? undefined : { scale }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-card p-8 md:p-[30px]",
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
      <h4 className={cn(TYPE.cardTitle, "relative z-10 mb-8")}>{title}</h4>
      <p className={cn(TYPE.body, "relative z-10 text-muted-ink")}>{description}</p>
    </motion.div>
  );
}
