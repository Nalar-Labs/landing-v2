import { useState } from "react";
import "@glidejs/glide/dist/css/glide.core.min.css";
import type { PortfolioItem } from "../data/portfolio";
import { useGlide } from "../lib/use-glide";
import { useMediaQuery } from "../lib/use-media-query";
import { PortfolioCard } from "./PortfolioCard";
import { Dots } from "./Dots";

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

  // Mirrors the `perView` responsive breakpoints in use-glide.ts (3 by
  // default, 2 below 1280px, 1 below 768px) so the dots — which are driven
  // by page count, not item count — match what Glide is actually showing.
  const isNarrow = useMediaQuery("(max-width: 768px)");
  const isMedium = useMediaQuery("(max-width: 1280px)");
  const perView = isNarrow ? 1 : isMedium ? 2 : 3;

  // Glide's `bound: true` clamps the track to full pages, so the number of
  // reachable positions is the number of pages, not the number of items —
  // e.g. 4 items at perView 3 has 2 pages: [0,1,2] and [1,2,3].
  const pageCount = Math.max(1, items.length - perView + 1);

  // Index of the card whose video is playing, or null. Only one plays at a
  // time — starting another replaces it, which also unmounts the old iframe.
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  return (
    <div ref={rootRef} className="glide">
      <div className="glide__track" data-glide-el="track">
        {/* glide.core.css makes glide__slides a flex row, so slides stretch
            to equal height; the card fills it via h-full. */}
        <ul className="glide__slides">
          {items.map((item, index) => (
            <li key={item.title} className="glide__slide">
              <PortfolioCard
                item={item}
                onOpen={() => {
                  // Stop inline playback before the modal takes over, so audio
                  // never continues behind the dialog.
                  setPlayingIndex(null);
                  onOpen(item);
                }}
                isPlaying={playingIndex === index}
                onPlay={() => setPlayingIndex(index)}
              />
            </li>
          ))}
        </ul>
      </div>

      <Dots
        className="mt-10"
        count={pageCount}
        activeIndex={activeIndex}
        onSelect={goTo}
        label="Portfolio slides"
        labelForIndex={(index) => {
          // Each dot now represents a page of `perView` cards starting at
          // `index`, not a single item — name it accordingly.
          const start = index + 1;
          const end = Math.min(index + perView, items.length);
          return start === end
            ? `Go to slide ${start}`
            : `Show slides ${start}–${end}`;
        }}
      />
    </div>
  );
}
