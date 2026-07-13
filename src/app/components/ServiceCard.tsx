import { motion, useTransform, type MotionValue } from "motion/react";
import { cn, TYPE } from "../lib/layout";
import type { Service } from "../data/content";
import { getCardExpansion } from "../lib/service-scroll-sequence";
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

/**
 * Collapsed, a card is just its title bar. As its slice of scroll progress
 * arrives it grows UPWARD (the card is bottom-anchored inside a fixed-height
 * cell, so the top edge rises and nothing else on the page reflows), the
 * grey wash fades in, and the description appears — then it stays expanded
 * for the rest of the scroll.
 */
const CARD_HEIGHTS = {
  compact: { collapsed: 112, expanded: 210 },
  regular: { collapsed: 128, expanded: 300 },
} as const;

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
  const { collapsed, expanded } = CARD_HEIGHTS[compact ? "compact" : "regular"];

  const expansion = useTransform(scrollYProgress, (progress) =>
    getCardExpansion(progress, index, cardCount),
  );
  const height = useTransform(expansion, [0, 1], [collapsed, expanded]);
  const washOpacity = useTransform(expansion, [0, 1], [0, 0.92]);
  // Description only fades in once the card has room for it.
  const descriptionOpacity = useTransform(expansion, [0.6, 1], [0, 1]);

  return (
    <div style={{ height: expanded }} className="flex items-end">
      <motion.div
        style={reducedMotion ? undefined : { height }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative flex w-full flex-col justify-between overflow-hidden rounded-card",
          reducedMotion && "h-full",
          compact ? "p-6" : "p-8 md:p-[30px]",
          gradient
            ? "bg-surface bg-gradient-to-r from-[#3c3c3c33] to-[#ffffff33]"
            : "bg-surface",
        )}
      >
        {!reducedMotion && (
          <motion.div
            aria-hidden="true"
            style={{ opacity: washOpacity, backgroundImage: SERVICE_CARD_GRADIENTS[index] }}
            className="pointer-events-none absolute inset-0 rounded-card"
          />
        )}
        <h4
          className={cn(
            TYPE.cardTitle,
            "relative z-10",
            compact && "text-[20px] md:text-[20px]",
          )}
        >
          {title}
        </h4>
        <motion.p
          style={reducedMotion ? undefined : { opacity: descriptionOpacity }}
          className={cn(
            TYPE.body,
            "relative z-10 text-ink-soft",
            compact && "text-[16px] md:text-[16px] leading-snug",
          )}
        >
          {description}
        </motion.p>
      </motion.div>
    </div>
  );
}
