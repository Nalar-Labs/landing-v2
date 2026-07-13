import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import { PortfolioCard } from "../components/PortfolioCard";

export function Portfolio() {
  if (PORTFOLIO_ITEMS.length === 0) return null;

  return (
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      {/* Temporary grid — replaced by PortfolioCarousel in the next task. */}
      <div className="grid gap-6 md:grid-cols-3">
        {PORTFOLIO_ITEMS.map((item) => (
          <PortfolioCard key={item.title} item={item} onOpen={() => {}} />
        ))}
      </div>
    </section>
  );
}
