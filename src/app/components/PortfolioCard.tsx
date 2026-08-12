import { cn, TYPE } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";
import { VideoFacade } from "./VideoFacade";

type PortfolioCardProps = {
  item: PortfolioItem;
  /** Opens the detail modal for this item. */
  onOpen: () => void;
  /** Whether this card's inline video is playing. Owned by the carousel. */
  isPlaying: boolean;
  onPlay: () => void;
};

export function PortfolioCard({
  item,
  onOpen,
  isPlaying,
  onPlay,
}: PortfolioCardProps) {
  // Poster precedence: explicit cover, else the first gallery image, else the
  // gradient placeholder rendered by VideoFacade.
  const poster = item.coverImage ?? item.gallery[0];

  return (
    // Not interactive itself — the title button below stretches over it. This
    // is what lets a play button coexist with "click anywhere to open".
    // This root creating its own stacking context (e.g. via hover:-translate-y-1
    // below) is fine — a stacking context on the parent doesn't reorder its
    // own children. The real constraint is on any INTERMEDIATE wrapper added
    // between this root and the logo/video/title elements: it must not gain
    // opacity/transform/filter/z-index of its own, or the logo (z-30) >
    // video (z-20) > title overlay (z-10) layering stops resolving — those
    // three need to stay in one shared stacking context.
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-card bg-surface text-left",
        "transition-transform duration-300 ease-out hover:-translate-y-1",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
      )}
    >
      {item.logo && (
        <div className="pointer-events-none absolute top-4 left-4 z-30">
          <img
            src={item.logo}
            alt={item.client || item.title}
            className="h-8 w-auto object-contain"
          />
        </div>
      )}

      {item.video ? (
        // z-20 lifts the media above the title's ::after overlay so the play
        // button and the iframe receive their own clicks.
        <VideoFacade
          video={item.video}
          poster={poster}
          title={item.title}
          isPlaying={isPlaying}
          onPlay={onPlay}
          className="relative z-20 aspect-[16/10] w-full"
        />
      ) : poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[16/10] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
        />
      )}

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <span className={cn(TYPE.cardTitle, "mb-2 block")}>
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "cursor-pointer text-left after:absolute after:inset-0 after:z-10 after:content-['']",
              "focus-visible:outline-none",
            )}
          >
            {item.title}
          </button>
        </span>
        {item.client && (
          <p className="mb-4 text-sm text-muted-ink">{item.client}</p>
        )}
        <p className={cn(TYPE.body, "text-muted-ink")}>{item.summary}</p>
      </div>
    </div>
  );
}
