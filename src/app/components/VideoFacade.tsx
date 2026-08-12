import { Play } from "lucide-react";
import { cn } from "../lib/layout";
import { embedUrl, parseVideoSource } from "../lib/video-source";

type VideoFacadeProps = {
  /** External video URL; already validated by parsePortfolioItems. */
  video: string;
  /** Poster frame shown before playback. */
  poster?: string;
  /** Item title — used for the accessible names. */
  title: string;
  /** Playback state is owned by the parent so it can stop playback. */
  isPlaying: boolean;
  onPlay: () => void;
  className?: string;
};

/**
 * Facade pattern: renders a poster + play button and only mounts the provider
 * iframe once the visitor actually presses play. A YouTube iframe costs ~1 MB
 * of JS and third-party cookies; several of them on the landing page would be
 * a serious regression, so nobody pays that until they ask for it.
 *
 * The caller sizes this via className (both branches fill it), which keeps the
 * poster and the iframe the same size — no layout shift on swap.
 */
export function VideoFacade({
  video,
  poster,
  title,
  isPlaying,
  onPlay,
  className,
}: VideoFacadeProps) {
  const source = parseVideoSource(video);
  // Content validation already rejects bad URLs at build time; this is a
  // belt-and-braces guard so a bad value can never render a broken embed.
  if (!source) return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isPlaying ? (
        <iframe
          src={embedUrl(source, { autoplay: true })}
          title={`Video: ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          {poster ? (
            <img
              src={poster}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
            />
          )}
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play video: ${title}`}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white",
                "transition-transform duration-300 ease-out hover:scale-110",
              )}
            >
              {/* translate-x nudges the optical centre of the triangle */}
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
