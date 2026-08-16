import { Suspense, lazy, useRef, useState } from "react";
import { motion, useTransform } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import type { PortfolioItem } from "../data/portfolio";
import { PortfolioCarousel } from "../components/PortfolioCarousel";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";
import { PIN_PANEL, PIN_TRACK, usePinDecision, usePinnedTrack } from "../lib/use-pinned-section";

// The modal pulls in react-markdown's whole unified/micromark stack; lazy
// loading keeps it out of the main chunk until a card is first opened.
const PortfolioModal = lazy(() =>
  import("../components/PortfolioModal").then((module) => ({
    default: module.PortfolioModal,
  })),
);

export function Portfolio() {
  // 760px: heading plus one row of cards. Shorter than the calculator's panel
  // because there is no two-column form to fit.
  const pin = usePinDecision(760);
  // Remount on the decision so useScroll re-registers with the right offsets —
  // motion does not retarget an existing scroll tracker.
  return <PortfolioInner key={pin ? "pinned" : "flowing"} pin={pin} />;
}

function PortfolioInner({ pin }: { pin: boolean }) {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  // Latches true on first open so the modal stays mounted afterwards —
  // unmounting on close would cut off the dialog's exit animation.
  const [hasOpened, setHasOpened] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const { trackRef, scrollYProgress } = usePinnedTrack(pin);
  // Fully faded in by 45% of the track, so the row is readable for most of
  // the pin rather than arriving right as the page releases.
  const fadeIn = useTransform(scrollYProgress, [0, 0.45], [0, 1]);
  const openerRef = useRef<HTMLElement | null>(null);

  if (PORTFOLIO_ITEMS.length === 0) return null;

  const openItem = (item: PortfolioItem) => {
    // Captured here because a controlled dialog has no Radix trigger to
    // restore focus to on close.
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setHasOpened(true);
    setSelected(item);
  };

  return (
    <section
      id="portfolio"
      ref={trackRef}
      className={cn(CONTAINER, pin ? PIN_TRACK : SECTION.wrap)}
    >
      <div className={pin ? PIN_PANEL : undefined}>
        <h2 className={cn(TYPE.h3, pin ? "mb-8" : SECTION.titleGap)}>Portfolio</h2>
        {/* One fade for the whole carousel, not a per-card sequence: the cards
            are a single row of peers, so revealing them together reads as the
            row arriving rather than as a queue. */}
        <motion.div style={pin ? { opacity: fadeIn } : undefined}>
          <PortfolioCarousel
            items={PORTFOLIO_ITEMS}
            onOpen={openItem}
            reducedMotion={reducedMotion}
          />
        </motion.div>
      </div>
      {hasOpened && (
        <Suspense fallback={null}>
          <PortfolioModal
            item={selected}
            onClose={() => setSelected(null)}
            returnFocusTo={openerRef}
          />
        </Suspense>
      )}
    </section>
  );
}
