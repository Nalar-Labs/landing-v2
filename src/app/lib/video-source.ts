// Portfolio videos are always externally hosted (see
// docs/PRDs/2026-08-09_portfolio-video_PENDING.md §1) — the CMS stores a URL,
// never a file. This module is the single place that understands those URLs.
// Pure and dependency-free so it runs under `node --test`.

export type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string };

/** YouTube ids are exactly 11 URL-safe base64 characters. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parses a pasted video URL. Returns null — never throws — for anything
 * unrecognised, so callers can decide whether that is a build error (content
 * validation) or simply "render nothing" (components).
 */
export function parseVideoSource(raw: string): VideoSource | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  // Guards against javascript:, data:, file: and friends.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = segments[0] ?? "";
    return YOUTUBE_ID.test(id) ? { kind: "youtube", id } : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (segments[0] === "watch") {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID.test(id) ? { kind: "youtube", id } : null;
    }
    // /embed/<id>, /shorts/<id>, /live/<id>
    if (segments[0] === "embed" || segments[0] === "shorts" || segments[0] === "live") {
      const id = segments[1] ?? "";
      return YOUTUBE_ID.test(id) ? { kind: "youtube", id } : null;
    }
    return null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // vimeo.com/<id> and player.vimeo.com/video/<id>; ignore /channels/... etc.
    //
    // We can't just take the first numeric path segment: showcase/album URLs
    // (vimeo.com/showcase/<showcaseId>/video/<videoId>) have TWO numeric
    // segments, and the first one is the showcase, not the video. Taking it
    // would silently embed the wrong content instead of failing. Instead,
    // a "video" segment is the unambiguous anchor — the id right after it is
    // always the actual video id. Without that anchor, the path must be
    // exactly one numeric segment or we refuse to guess.
    const videoIndex = segments.indexOf("video");
    const id =
      videoIndex !== -1
        ? segments[videoIndex + 1]
        : segments.length === 1
          ? segments[0]
          : undefined;
    return id && /^\d+$/.test(id) ? { kind: "vimeo", id } : null;
  }

  return null;
}

/** Builds the iframe src. Autoplay is opt-in: only after a real user click. */
export function embedUrl(
  source: VideoSource,
  { autoplay = false }: { autoplay?: boolean } = {},
): string {
  if (source.kind === "youtube") {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    if (autoplay) params.set("autoplay", "1");
    // nocookie host: no third-party cookies until the visitor presses play.
    return `https://www.youtube-nocookie.com/embed/${source.id}?${params.toString()}`;
  }

  const params = new URLSearchParams({ dnt: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `https://player.vimeo.com/video/${source.id}?${params.toString()}`;
}
