import "@glidejs/glide/dist/css/glide.core.min.css";
import { cn } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";
import { useGlide } from "../lib/use-glide";
import { PortfolioCard } from "./PortfolioCard";

type PortfolioCarouselProps = {
  items: PortfolioItem[];
  onOpen: (item: PortfolioItem) => void;
  reducedMotion: boolean;
};

export function PortfolioCarousel({
  items,
  onOpen,
  reducedMotion,
}: PortfolioCarouselProps) {
  const { rootRef, activeIndex, goTo } = useGlide(items.length, reducedMotion);

  return (
    <div ref={rootRef} className="glide">
      <div className="glide__track" data-glide-el="track">
        {/* glide.core.css makes glide__slides a flex row, so slides stretch
            to equal height; the card fills it via h-full. */}
        <ul className="glide__slides">
          {items.map((item) => (
            <li key={item.title} className="glide__slide">
              <PortfolioCard item={item} onOpen={() => onOpen(item)} />
            </li>
          ))}
        </ul>
      </div>

      {/* Instagram-style dots: plain buttons driven by useGlide state. */}
      <div
        className="mt-10 flex justify-center gap-3"
        role="group"
        aria-label="Portfolio slides"
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show ${item.title}`}
            aria-current={index === activeIndex}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-6 bg-black"
                : "w-2 bg-black/20 hover:bg-black/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
