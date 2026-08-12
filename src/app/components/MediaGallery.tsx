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
  }, [slides.length]);

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
        className={cn(
          "flex w-full snap-x snap-mandatory overflow-x-auto",
          // Hide the scrollbar; the dots are the affordance.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {slides.map((slide, index) => (
          <div
            key={`${slide.kind}-${slide.src}`}
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
                alt=""
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
              />
            )}
          </div>
        ))}
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
