import { useState } from "react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import type { PortfolioItem } from "../data/portfolio";
import { PortfolioCarousel } from "../components/PortfolioCarousel";
import { PortfolioModal } from "../components/PortfolioModal";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

export function Portfolio() {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  if (PORTFOLIO_ITEMS.length === 0) return null;

  return (
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      <PortfolioCarousel
        items={PORTFOLIO_ITEMS}
        onOpen={setSelected}
        reducedMotion={reducedMotion}
      />
      <PortfolioModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
