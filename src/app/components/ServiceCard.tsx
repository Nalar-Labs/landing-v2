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
  /**
   * Whether this card should track scroll progress at all. False on mobile
   * (and anywhere the section isn't pinned) so the card just renders fully
   * expanded and static instead of collapsing/expanding as the page scrolls.
   */
  scrollDriven?: boolean;
};

/**
 * Collapsed, a card is just its title bar. As its slice of scroll progress
 * arrives it grows from the MIDDLE (the card is center-anchored inside a
 * fixed-height cell, so the top edge rises and the bottom edge drops evenly
 * and nothing else on the page reflows), the grey wash fades in, and the
 * description appears — then it stays expanded for the rest of the scroll.
 *
 * This scroll-linked expand/collapse only happens while `scrollDriven` is
 * true (the pinned desktop layout). Everywhere else — mobile, and reduced
 * motion — the card just renders fully expanded and static.
 */
const CARD_HEIGHTS = {
  compact: { collapsed: 128, expanded: 200 },
  regular: { collapsed: 128, expanded: 290 },
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
  scrollDriven = true,
}: ServiceCardProps) {
  const { collapsed, expanded } = CARD_HEIGHTS[compact ? "compact" : "regular"];
  const staticLayout = reducedMotion || !scrollDriven;

  const expansion = useTransform(scrollYProgress, (progress) =>
    getCardExpansion(progress, index, cardCount),
  );
  const height = useTransform(expansion, [0, 1], [collapsed, expanded]);
  const washOpacity = useTransform(expansion, [0, 1], [0, 0.92]);
  // Description only fades in once the card has room for it.
  const descriptionOpacity = useTransform(expansion, [0.6, 1], [0, 1]);

  return (
    <div style={staticLayout ? undefined : { height: expanded }} className="flex items-top">
      <motion.div
        style={staticLayout ? undefined : { height }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative flex w-full flex-col overflow-hidden rounded-card",
          staticLayout ? "gap-4" : "justify-between h-full",
          compact ? "p-6" : "p-8 md:p-[30px]",
          gradient
            ? "bg-surface bg-gradient-to-r from-[#3c3c3c33] to-[#ffffff33]"
            : "bg-surface",
        )}
      >
        {!staticLayout && (
          <motion.div
            aria-hidden="true"
            style={{ opacity: washOpacity, backgroundImage: SERVICE_CARD_GRADIENTS[index] }}
            className="pointer-events-none absolute inset-0 rounded-card"
          />
        )}
        <h4
          className={cn(
            "font-display font-medium leading-tight tracking-[-0.96px]",
            "text-[32px] md:text-[40px] relative z-10",
            !staticLayout && "mb-3",
            compact && "text-[24px] md:text-[28px]",
          )}
        >
          {title}
        </h4>
        <motion.p
          style={staticLayout ? undefined : { opacity: descriptionOpacity }}
          className={cn(
            "font-display font-light tracking-[-0.72px]",
            "text-[20px] md:text-[28px] leading-tight relative z-10 text-ink-soft",
            compact && "text-[16px] md:text-[18px] leading-snug",
          )}
        >
          {description}
        </motion.p>
      </motion.div>
    </div>
  );
}