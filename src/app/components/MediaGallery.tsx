import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/layout";
import { Dots } from "./Dots";
import { VideoFacade } from "./VideoFacade";

type MediaGalleryProps = {
  video?: string;
  gallery: string[];
  /** Poster for the video slide. */
  poster?: string;
  title: string;
  isVideoPlaying: boolean;
  onPlayVideo: () => void;
  /** Called when the user swipes away from the video slide. */
  onStopVideo: () => void;
};

/**
 * Video (if any) followed by images, as one horizontally swipeable strip with
 * Instagram-style dots — the media area at the top of the portfolio modal.
 *
 * Built on CSS scroll-snap instead of a carousel library: native momentum
 * scrolling on touch, no new dependency, and it stays a real scroll container
 * so keyboard and AT work by default.
 */
export function MediaGallery({
  video,
  gallery,
  poster,
  title,
  isVideoPlaying,
  onPlayVideo,
  onStopVideo,
}: MediaGalleryProps) {
  const slides = [
    ...(video ? [{ kind: "video" as const, src: video }] : []),
    ...gallery.map((src) => ({ kind: "image" as const, src })),
  ];

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // PortfolioModal is a single instance that never unmounts — opening a
  // different item just changes `video`/`gallery` props on this same
  // component. Key effects off a signature of slide identity (kind+src),
  // not `slides.length`: two different items can easily have the same
  // slide count, in which case a length-only dependency would not re-run
  // and would leave the observer watching stale, detached elements from
  // the previous item — dots and swipe-stops-video would silently break.
  // Do not "simplify" this back to `slides.length`.
  const slideSignature = slides.map((slide) => `${slide.kind}:${slide.src}`).join("|");

  // A new item should always open on its first slide, scrolled fully to
  // the start — otherwise leftover scroll position/activeIndex from the
  // previous item leaks in. `scrollTo` without smooth behaviour avoids a
  // visible scroll-back animation when the item changes.
  useEffect(() => {
    setActiveIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [slideSignature]);

  // Drive the dots from actual scroll position, so swipe and dot clicks stay
  // in sync without either owning the other.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || slides.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActiveIndex(index);
        }
      },
      // Only the slide occupying most of the viewport counts as active.
      { root: track, threshold: 0.6 },
    );

    for (const child of Array.from(track.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [slideSignature]);

  // Swiping away from the video slide stops playback — otherwise audio keeps
  // running under an image the user is looking at.
  useEffect(() => {
    if (video && isVideoPlaying && activeIndex !== 0) onStopVideo();
  }, [activeIndex, video, isVideoPlaying, onStopVideo]);

  if (slides.length === 0) return null;

  const goTo = (index: number) => {
    const track = trackRef.current;
    const target = track?.children[index] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div>
      {/* data-lenis-prevent: Lenis owns wheel events site-wide and would
          otherwise swallow trackpad horizontal scrolling here. */}
      <div
        ref={trackRef}
        data-lenis-prevent
        tabIndex={0}
        role="region"
        aria-label={`${title} media gallery`}
        className={cn(
          "flex w-full snap-x snap-mandatory overflow-x-auto",
          // Hide the scrollbar; the dots are the affordance.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {slides.map((slide, index) => {
          // Images are contiguous after the optional video slide, so their
          // 1-based position among gallery images alone is the slide index
          // (offset by the video slide when present).
          const imageIndex = video ? index : index + 1;
          return (
            <div
              key={`${slide.kind}-${index}`}
              data-index={index}
              className="w-full shrink-0 snap-start"
            >
              {slide.kind === "video" ? (
                <VideoFacade
                  video={slide.src}
                  poster={poster}
                  title={title}
                  isPlaying={isVideoPlaying}
                  onPlay={onPlayVideo}
                  className="aspect-[16/9] w-full"
                />
              ) : (
                <img
                  src={slide.src}
                  alt={`${title} — image ${imageIndex} of ${gallery.length}`}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      <Dots
        className="py-4"
        count={slides.length}
        activeIndex={activeIndex}
        onSelect={goTo}
        label={`${title} media`}
        labelForIndex={(index) =>
          slides[index].kind === "video" ? "Show video" : `Show image ${index + 1}`
        }
      />
    </div>
  );
}
