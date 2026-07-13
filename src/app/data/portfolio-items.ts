// Vite-only loader: bundles every JSON file in src/content/portfolio at
// build time. Kept apart from portfolio.ts so the pure logic stays runnable
// under node --test (import.meta.glob does not exist outside Vite).
import { parsePortfolioItems, type PortfolioItem } from "./portfolio";

const modules = import.meta.glob("../../content/portfolio/*.json", {
  eager: true,
  import: "default",
});

export const PORTFOLIO_ITEMS: PortfolioItem[] = parsePortfolioItems(
  Object.values(modules),
);
