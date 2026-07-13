import { Suspense, lazy, useRef, useState } from "react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import type { PortfolioItem } from "../data/portfolio";
import { PortfolioCarousel } from "../components/PortfolioCarousel";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

// The modal pulls in react-markdown's whole unified/micromark stack; lazy
// loading keeps it out of the main chunk until a card is first opened.
const PortfolioModal = lazy(() =>
  import("../components/PortfolioModal").then((module) => ({
    default: module.PortfolioModal,
  })),
);

export function Portfolio() {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  // Latches true on first open so the modal stays mounted afterwards —
  // unmounting on close would cut off the dialog's exit animation.
  const [hasOpened, setHasOpened] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
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
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      <PortfolioCarousel
        items={PORTFOLIO_ITEMS}
        onOpen={openItem}
        reducedMotion={reducedMotion}
      />
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
