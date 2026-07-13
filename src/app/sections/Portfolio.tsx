import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import { PortfolioCarousel } from "../components/PortfolioCarousel";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

export function Portfolio() {
  const reducedMotion = usePrefersReducedMotion();

  if (PORTFOLIO_ITEMS.length === 0) return null;

  return (
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      <PortfolioCarousel
        items={PORTFOLIO_ITEMS}
        onOpen={() => {}}
        reducedMotion={reducedMotion}
      />
    </section>
  );
}
