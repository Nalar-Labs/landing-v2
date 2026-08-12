import { useState } from "react";
import "@glidejs/glide/dist/css/glide.core.min.css";
import type { PortfolioItem } from "../data/portfolio";
import { useGlide } from "../lib/use-glide";
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
        count={items.length}
        activeIndex={activeIndex}
        onSelect={goTo}
        label="Portfolio slides"
        labelForIndex={(index) => `Show ${items[index].title}`}
      />
    </div>
  );
}
