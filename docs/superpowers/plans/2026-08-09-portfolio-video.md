# Portfolio Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portfolio items can lead with an externally-hosted video — playable inline on the carousel card, and as the first slide of a swipeable media gallery in the detail modal.

**Architecture:** Video is never a file in this repo; the CMS stores a YouTube/Vimeo **URL**. A pure `video-source.ts` parses that URL; `parsePortfolioItems` rejects anything unrecognised at build time. A shared `VideoFacade` renders a poster + play button and only mounts the provider `<iframe>` on click, so visitors who never press play pay no iframe cost. The modal's media area becomes a CSS scroll-snap gallery (video first, then images) driven by the same `Dots` component the carousel uses.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind v4, Radix Dialog (via shadcn `ui/dialog`), Glide.js 3.7, `lucide-react`, Sveltia CMS. Tests are Node's built-in runner.

## Global Constraints

- **Test command is per-file**, there is no `npm test`: `node --test --experimental-strip-types <file>`.
- **No jsdom / RTL / vitest exists.** Only pure-logic modules are unit-testable. Tasks 3–9 are verified manually in the browser; do not claim automated coverage for them, and do not add a component test runner in this plan.
- **`src/app/data/**` must stay free of Vite APIs** so it runs under `node --test`. `import.meta.glob` belongs only in `*-items.ts`.
- **Relative imports crossing into `src/app/lib` from `src/app/data` must carry the `.ts` extension** (e.g. `../lib/video-source.ts`). Node's type-stripping ESM loader requires full specifiers; Vite resolves them fine. The existing tests already do this (`from "./portfolio.ts"`).
- **Design tokens only** — `bg-surface`, `text-muted-ink`, `border-line`, `rounded-card`, `bg-brand`, and the `TYPE` / `SECTION` / `CONTAINER` constants from `src/app/lib/layout.ts`. No raw hex, no ad-hoc pixel spacing. The one pre-existing exception already in the codebase is the gradient placeholder `from-[#3c3c3c33] to-[#ffffff33]`; reuse it verbatim rather than inventing a new one.
- **Backwards compatibility is mandatory.** `src/content/portfolio/ai-document-pipeline.json` has no `video` and no `gallery` and must render exactly as it does today.
- **Privacy:** YouTube embeds use `youtube-nocookie.com`; Vimeo embeds pass `dnt=1`.
- Repo root for all paths: `/Users/gardahadi/Workspace/Consulting/Nalar/nalar-v2`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/lib/video-source.ts` | **Create.** Pure URL → `VideoSource` parsing and embed-URL building. No React. |
| `src/app/lib/video-source.test.ts` | **Create.** Unit tests for the above. |
| `src/app/data/portfolio.ts` | **Modify.** Add `video` / `gallery` to the type + validation. |
| `src/app/data/portfolio.test.ts` | **Modify.** Cases for the new fields. |
| `src/app/lib/use-glide.ts` | **Modify.** Drop slide cloning so React handlers inside slides stay live. |
| `src/app/components/VideoFacade.tsx` | **Create.** Poster + play button; swaps to `<iframe>` when `isPlaying`. Shared by card and gallery. |
| `src/app/components/Dots.tsx` | **Create.** Extracted from `PortfolioCarousel`; used by carousel and gallery. |
| `src/app/components/PortfolioCard.tsx` | **Modify.** Restructure to stretched-link so a play button can coexist with "open modal". |
| `src/app/components/PortfolioCarousel.tsx` | **Modify.** Use `Dots`; own per-card playing state. |
| `src/app/components/MediaGallery.tsx` | **Create.** Scroll-snap gallery: video slide + image slides + dots. |
| `src/app/components/PortfolioModal.tsx` | **Modify.** Render `MediaGallery`; stop playback on close. |
| `public/admin/config.yml` | **Modify.** `video` + `gallery` fields. |
| `docs/cms.md` | **Modify.** "Adding video" section. |
| `src/content/portfolio/*.json` | **Modify/Create.** A real example with video + gallery. |

---

### Task 1: `video-source.ts` — pure URL parsing

**Files:**
- Create: `src/app/lib/video-source.ts`
- Test: `src/app/lib/video-source.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type VideoSource = { kind: "youtube"; id: string } | { kind: "vimeo"; id: string }`
  - `parseVideoSource(raw: string): VideoSource | null`
  - `embedUrl(source: VideoSource, options?: { autoplay?: boolean }): string`

- [ ] **Step 1: Write the failing test**

Create `src/app/lib/video-source.test.ts`:

```ts
// Pure URL parsing for portfolio video embeds. These are the shapes people
// actually paste from a browser address bar or a "Share" button.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVideoSource, embedUrl } from "./video-source.ts";

test("parses the YouTube URL shapes people paste", () => {
  const expected = { kind: "youtube", id: "dQw4w9WgXcQ" };
  assert.deepEqual(
    parseVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    expected,
  );
  assert.deepEqual(parseVideoSource("https://youtu.be/dQw4w9WgXcQ"), expected);
  assert.deepEqual(
    parseVideoSource("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    expected,
  );
  assert.deepEqual(
    parseVideoSource("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    expected,
  );
  // Extra query params (timestamps, playlists, tracking) must not break it.
  assert.deepEqual(
    parseVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"),
    expected,
  );
  // m. and nocookie hosts are still YouTube.
  assert.deepEqual(
    parseVideoSource("https://m.youtube.com/watch?v=dQw4w9WgXcQ"),
    expected,
  );
});

test("parses Vimeo URL shapes", () => {
  const expected = { kind: "vimeo", id: "123456789" };
  assert.deepEqual(parseVideoSource("https://vimeo.com/123456789"), expected);
  assert.deepEqual(
    parseVideoSource("https://player.vimeo.com/video/123456789"),
    expected,
  );
});

test("returns null for anything it does not recognise", () => {
  assert.equal(parseVideoSource(""), null);
  assert.equal(parseVideoSource("   "), null);
  assert.equal(parseVideoSource("not a url"), null);
  // A local file path — the mistake the CMS hint warns against.
  assert.equal(parseVideoSource("/images/portfolio/demo.mp4"), null);
  // Right host, no usable id.
  assert.equal(parseVideoSource("https://www.youtube.com/watch?v=short"), null);
  assert.equal(parseVideoSource("https://vimeo.com/channels/staffpicks"), null);
  // Unsupported host.
  assert.equal(parseVideoSource("https://example.com/video.mp4"), null);
  // Non-http schemes must not slip through.
  assert.equal(parseVideoSource("javascript:alert(1)"), null);
});

test("builds privacy-preserving embed URLs", () => {
  const yt = embedUrl({ kind: "youtube", id: "dQw4w9WgXcQ" });
  assert.ok(yt.startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?"));
  assert.ok(!yt.includes("autoplay=1"));

  const vimeo = embedUrl({ kind: "vimeo", id: "123456789" });
  assert.ok(vimeo.startsWith("https://player.vimeo.com/video/123456789?"));
  assert.ok(vimeo.includes("dnt=1"));
});

test("adds autoplay only when asked", () => {
  assert.ok(
    embedUrl({ kind: "youtube", id: "dQw4w9WgXcQ" }, { autoplay: true }).includes(
      "autoplay=1",
    ),
  );
  assert.ok(
    embedUrl({ kind: "vimeo", id: "123456789" }, { autoplay: true }).includes(
      "autoplay=1",
    ),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test --experimental-strip-types src/app/lib/video-source.test.ts
```

Expected: FAIL — `Cannot find module .../video-source.ts`.

- [ ] **Step 3: Write the implementation**

Create `src/app/lib/video-source.ts`:

```ts
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
    const id = segments.find((segment) => /^\d+$/.test(segment));
    return id ? { kind: "vimeo", id } : null;
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test --experimental-strip-types src/app/lib/video-source.test.ts
```

Expected: PASS — `# pass 5`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/video-source.ts src/app/lib/video-source.test.ts
git commit -m "feat(portfolio): add pure video URL parsing for YouTube/Vimeo"
```

---

### Task 2: Content model — `video` and `gallery`

**Files:**
- Modify: `src/app/data/portfolio.ts`
- Test: `src/app/data/portfolio.test.ts`

**Interfaces:**
- Consumes: `parseVideoSource` from Task 1.
- Produces: `PortfolioItem` gains `video?: string` and `gallery: string[]` (always an array, defaulted like `tags`).

- [ ] **Step 1: Write the failing tests**

Append to `src/app/data/portfolio.test.ts`:

```ts
test("accepts a recognised external video URL", () => {
  const [item] = parsePortfolioItems([
    { ...valid, video: "https://youtu.be/dQw4w9WgXcQ" },
  ]);
  assert.equal(item.video, "https://youtu.be/dQw4w9WgXcQ");
});

test("defaults video to undefined and gallery to an empty array", () => {
  const [item] = parsePortfolioItems([valid]);
  assert.equal(item.video, undefined);
  assert.deepEqual(item.gallery, []);
});

test("rejects a local file path in video (videos are externally hosted)", () => {
  assert.throws(
    () => parsePortfolioItems([{ ...valid, video: "/images/portfolio/demo.mp4" }]),
    /video/,
  );
});

test("rejects an unsupported video host", () => {
  assert.throws(
    () => parsePortfolioItems([{ ...valid, video: "https://example.com/v.mp4" }]),
    /video/,
  );
});

test("parses a gallery of image paths", () => {
  const [item] = parsePortfolioItems([
    { ...valid, gallery: ["/images/portfolio/a.webp", "/images/portfolio/b.webp"] },
  ]);
  assert.deepEqual(item.gallery, [
    "/images/portfolio/a.webp",
    "/images/portfolio/b.webp",
  ]);
});

test("throws on a malformed gallery", () => {
  assert.throws(
    () => parsePortfolioItems([{ ...valid, gallery: "not-an-array" }]),
    /gallery/,
  );
  assert.throws(() => parsePortfolioItems([{ ...valid, gallery: [1] }]), /gallery/);
  assert.throws(() => parsePortfolioItems([{ ...valid, gallery: [""] }]), /gallery/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test --experimental-strip-types src/app/data/portfolio.test.ts
```

Expected: FAIL — the new cases fail (`item.gallery` is `undefined`, and the invalid-video cases do not throw). The 9 pre-existing tests must still pass.

- [ ] **Step 3: Implement**

In `src/app/data/portfolio.ts`, add the import at the top (note the `.ts` extension — required by Node's loader, see Global Constraints):

```ts
import { parseVideoSource } from "../lib/video-source.ts";
```

Add `video` and `gallery` to the type:

```ts
  /** Path under public/, e.g. "/images/portfolio/logos/company.png". Displayed in top-left corner. */
  logo?: string;
  /** External video URL (YouTube/Vimeo). Never a local file — see docs/PRDs. */
  video?: string;
  /** Extra images shown after the video in the modal gallery. */
  gallery: string[];
  tags: string[];
```

Add these two helpers next to `tagsOf`:

```ts
function videoOf(record: Record<string, unknown>): string | undefined {
  const value = optionalString(record, "video");
  if (value === undefined) return undefined;
  if (parseVideoSource(value) === null) {
    throw new Error(
      `Portfolio item "${labelOf(record)}": "video" must be a YouTube or Vimeo URL ` +
        `(got "${value}"). Videos are hosted externally — upload to YouTube/Vimeo ` +
        `and paste the link.`,
    );
  }
  return value;
}

function galleryOf(record: Record<string, unknown>): string[] {
  const value = record.gallery;
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || entry.trim() === "")
  ) {
    throw new Error(
      `Portfolio item "${labelOf(record)}": "gallery" must be an array of non-empty image paths`,
    );
  }
  return value as string[];
}
```

And wire them into the object literal inside `parsePortfolioItems`:

```ts
      logo: optionalString(record, "logo"),
      video: videoOf(record),
      gallery: galleryOf(record),
      tags: tagsOf(record),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test --experimental-strip-types src/app/data/portfolio.test.ts
node --test --experimental-strip-types src/app/lib/video-source.test.ts
```

Expected: PASS, `# fail 0` for both. All 9 original portfolio tests still pass — that is the backwards-compatibility guarantee.

- [ ] **Step 5: Verify the real content file still builds**

```bash
npm run build
```

Expected: build succeeds. `ai-document-pipeline.json` has no `video`/`gallery` and must not error.

- [ ] **Step 6: Commit**

```bash
git add src/app/data/portfolio.ts src/app/data/portfolio.test.ts
git commit -m "feat(portfolio): validate optional video URL and image gallery"
```

---

### Task 3: Remove Glide slide cloning

**Files:**
- Modify: `src/app/lib/use-glide.ts`

**Why this is required, not optional.** `type: "carousel"` makes Glide duplicate slides with `cloneNode` to fake an infinite loop. Cloned nodes have no React fiber, so **no handler inside a clone ever fires** — and a clone is a frozen DOM snapshot, so it could never swap a poster for an iframe even if the click did register. Inline play on a card is unimplementable while clones exist. The current code already works around the damage (`aria-hidden` + `tabIndex = -1` on clone buttons), which is really a pre-existing bug: clicking a cloned card today does nothing.

`type: "slider"` removes clones entirely. Cost: no infinite wrap-around. `rewind` (default `true`) still lets the last dot return to the first slide. Keep `bound` at its default `false` so dot *n* always maps to slide *n* — with `bound: true` the trailing dots would clamp to the same slide and highlight the wrong dot.

**Interfaces:**
- Consumes: nothing new.
- Produces: `useGlide(slideCount, reducedMotion)` — unchanged signature, returns `{ rootRef, activeIndex, goTo }`.

- [ ] **Step 1: Change the Glide type**

In `src/app/lib/use-glide.ts`, replace `type: "carousel",` with:

```ts
      // "slider", not "carousel": carousel mode clones slides via cloneNode,
      // and clones carry no React fiber — every handler inside them is dead and
      // their DOM can never re-render. Cards contain interactive controls
      // (open modal, play video), so cloning is not survivable. Trade-off:
      // no infinite wrap-around; `rewind` still returns from last to first.
      type: "slider",
```

- [ ] **Step 2: Delete the clone workaround**

Remove this block entirely (it is dead code once there are no clones):

```ts
    // Glide's carousel mode clones slides for looping; the clones duplicate
    // the card buttons in the a11y tree but React handlers don't survive
    // cloneNode, so they'd be dead controls — hide them from AT and tab order.
    root.querySelectorAll(".glide__slide--clone").forEach((clone) => {
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("button, a").forEach((el) => {
        (el as HTMLElement).tabIndex = -1;
      });
    });
```

- [ ] **Step 3: Verify in the browser**

```bash
npm run dev
```

Open http://localhost:5173/#portfolio and confirm:
- No `.glide__slide--clone` elements: run `document.querySelectorAll('.glide__slide--clone').length` in the console → expect `0`.
- Dots still move the carousel, and the active dot matches the visible slide.
- Clicking any card opens the modal — including the last one, which is the pre-existing bug this fixes.

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/use-glide.ts
git commit -m "fix(portfolio): use Glide slider mode so slide controls stay interactive"
```

---

### Task 4: `VideoFacade` component

**Files:**
- Create: `src/app/components/VideoFacade.tsx`

**Interfaces:**
- Consumes: `parseVideoSource`, `embedUrl` (Task 1); `cn` from `../lib/layout`.
- Produces:
  ```ts
  type VideoFacadeProps = {
    video: string;
    poster?: string;
    title: string;
    isPlaying: boolean;
    onPlay: () => void;
    className?: string;
  };
  export function VideoFacade(props: VideoFacadeProps): JSX.Element | null;
  ```
  **Playback state is owned by the parent** (`isPlaying` + `onPlay`), so a parent can stop playback — the modal needs exactly that on close.

- [ ] **Step 1: Write the component**

Create `src/app/components/VideoFacade.tsx`:

```tsx
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run build
```

Expected: build succeeds. (The component is not mounted anywhere yet — this only proves it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/app/components/VideoFacade.tsx
git commit -m "feat(portfolio): add click-to-load video facade"
```

---

### Task 5: Card — stretched-link restructure + inline play

**Files:**
- Modify: `src/app/components/PortfolioCard.tsx`
- Modify: `src/app/components/PortfolioCarousel.tsx`

**The problem being solved.** `PortfolioCard` is currently one big `<button>`. A play `<button>` nested inside it is invalid HTML and its click is swallowed. The fix is the standard *stretched link*: the card root becomes a non-interactive `<div>`, the title carries the real button, and that button's `::after` pseudo-element covers the card. The play button then sits above the overlay in z-order and wins its own clicks.

**Interfaces:**
- Consumes: `VideoFacade` (Task 4).
- Produces: `PortfolioCard` props become
  ```ts
  { item: PortfolioItem; onOpen: () => void; isPlaying: boolean; onPlay: () => void }
  ```

- [ ] **Step 1: Rewrite the card**

Replace the whole body of `src/app/components/PortfolioCard.tsx`:

```tsx
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
    <div
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-card bg-surface text-left",
        "transition-transform duration-300 ease-out hover:-translate-y-1",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
      )}
    >
      {item.logo && (
        <div className="absolute top-4 left-4 z-30">
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
              "text-left after:absolute after:inset-0 after:z-10 after:content-['']",
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
```

Note: the focus ring moved from `focus-visible:outline` on the old root button to `focus-within:outline` on the div, so keyboard focus on the title button still rings the whole card.

- [ ] **Step 2: Give the carousel per-card playing state**

In `src/app/components/PortfolioCarousel.tsx`, add the import and state, and pass the new props. Change the imports at the top to include `useState`:

```tsx
import { useState } from "react";
```

Inside the component, above `return`:

```tsx
  // Index of the card whose video is playing, or null. Only one plays at a
  // time — starting another replaces it, which also unmounts the old iframe.
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
```

Then update the slide loop:

```tsx
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
```

- [ ] **Step 3: Verify in the browser**

```bash
npm run dev
```

With a video on an item (use the Task 9 example, or temporarily add
`"video": "https://youtu.be/dQw4w9WgXcQ"` to `ai-document-pipeline.json`):

- **No iframe before play.** DevTools → Network, filter `youtube` → nothing on load.
- Press play → the iframe mounts and plays inline in the card.
- Click the card's title or body → the modal opens **and the inline video stops**.
- **Keyboard:** Tab reaches two controls per card — "Play video: <title>" and the title button. `Enter` on each does the right thing.
- The whole card (outside the media area) still opens the modal.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/PortfolioCard.tsx src/app/components/PortfolioCarousel.tsx
git commit -m "feat(portfolio): play video inline on cards via stretched-link card"
```

---

### Task 6: Extract `Dots`

**Files:**
- Create: `src/app/components/Dots.tsx`
- Modify: `src/app/components/PortfolioCarousel.tsx`

**Interfaces:**
- Produces:
  ```ts
  type DotsProps = {
    count: number;
    activeIndex: number;
    onSelect: (index: number) => void;
    label: string;
    labelForIndex: (index: number) => string;
    className?: string;
  };
  export function Dots(props: DotsProps): JSX.Element | null;
  ```

- [ ] **Step 1: Create the component**

Create `src/app/components/Dots.tsx` — markup lifted verbatim from `PortfolioCarousel` so nothing changes visually:

```tsx
import { cn } from "../lib/layout";

type DotsProps = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Group label, e.g. "Portfolio slides". */
  label: string;
  /** Accessible name for dot n, e.g. (i) => `Show ${titles[i]}`. */
  labelForIndex: (index: number) => string;
  className?: string;
};

/** Instagram-style progress dots, shared by the carousel and the modal gallery. */
export function Dots({
  count,
  activeIndex,
  onSelect,
  label,
  labelForIndex,
  className,
}: DotsProps) {
  // A single dot communicates nothing.
  if (count < 2) return null;

  return (
    <div
      className={cn("flex justify-center gap-3", className)}
      role="group"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={labelForIndex(index)}
          aria-current={index === activeIndex}
          className="group flex h-6 w-6 items-center justify-center"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-6 bg-black"
                : "w-2 bg-black/20 group-hover:bg-black/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Use it in the carousel**

In `src/app/components/PortfolioCarousel.tsx`, add `import { Dots } from "./Dots";` and replace the entire dots `<div role="group">…</div>` block with:

```tsx
      <Dots
        className="mt-10"
        count={items.length}
        activeIndex={activeIndex}
        onSelect={goTo}
        label="Portfolio slides"
        labelForIndex={(index) => `Show ${items[index].title}`}
      />
```

- [ ] **Step 3: Verify no visual change**

```bash
npm run dev
```

Dots look and behave exactly as before. (With only one portfolio item they now correctly render nothing — `count < 2`.)

- [ ] **Step 4: Commit**

```bash
git add src/app/components/Dots.tsx src/app/components/PortfolioCarousel.tsx
git commit -m "refactor(portfolio): extract shared Dots component"
```

---

### Task 7: `MediaGallery`

**Files:**
- Create: `src/app/components/MediaGallery.tsx`

Scroll-snap rather than a carousel library: zero new dependencies, native momentum swipe on touch, and it is a real scroll container so keyboard and screen readers work without extra wiring.

**Interfaces:**
- Consumes: `VideoFacade` (Task 4), `Dots` (Task 6).
- Produces:
  ```ts
  type MediaGalleryProps = {
    video?: string;
    gallery: string[];
    poster?: string;
    title: string;
    isVideoPlaying: boolean;
    onPlayVideo: () => void;
    onStopVideo: () => void;
  };
  export function MediaGallery(props: MediaGalleryProps): JSX.Element | null;
  ```

- [ ] **Step 1: Write the component**

Create `src/app/components/MediaGallery.tsx`:

```tsx
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/MediaGallery.tsx
git commit -m "feat(portfolio): add scroll-snap media gallery with dots"
```

---

### Task 8: Wire the gallery into the modal

**Files:**
- Modify: `src/app/components/PortfolioModal.tsx`

**Interfaces:**
- Consumes: `MediaGallery` (Task 7). Props of `PortfolioModal` are unchanged.

- [ ] **Step 1: Replace the cover-image block**

In `src/app/components/PortfolioModal.tsx`:

Add to the imports:

```tsx
import { type RefObject, useEffect, useRef, useState } from "react";
import { MediaGallery } from "./MediaGallery";
```

Inside the component, after the `shown` line:

```tsx
  const [isVideoPlaying, setVideoPlaying] = useState(false);

  // Radix keeps the dialog mounted ~200ms after `open` flips false for its exit
  // animation, so unmounting will NOT stop the iframe in time — the audio would
  // keep playing. Reset explicitly whenever the open item changes or clears.
  useEffect(() => {
    setVideoPlaying(false);
  }, [item]);
```

Replace the existing `{shown.coverImage ? (<img …/>) : (<div … />)}` block with:

```tsx
            {shown.video || shown.gallery.length > 0 ? (
              <MediaGallery
                video={shown.video}
                gallery={shown.gallery}
                poster={shown.coverImage ?? shown.gallery[0]}
                title={shown.title}
                isVideoPlaying={isVideoPlaying}
                onPlayVideo={() => setVideoPlaying(true)}
                onStopVideo={() => setVideoPlaying(false)}
              />
            ) : shown.coverImage ? (
              <img
                src={shown.coverImage}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="aspect-[21/9] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
              />
            )}
```

- [ ] **Step 2: Verify in the browser**

```bash
npm run dev
```

On an item with `video` **and** at least two `gallery` images:

- The video is slide 1; press play and it plays in the modal.
- Swipe (or drag horizontally) → playback stops, images scroll with snap.
- Dots reflect the active slide; clicking a dot scrolls to it.
- **Trackpad horizontal scroll works** — this is the Lenis interaction; if it does not, confirm `data-lenis-prevent` is on the track element.
- **Close the modal while the video plays → audio stops immediately.** This is the Radix-delay trap; verify by ear.
- Re-open the item → it shows the poster again, not a still-playing iframe.
- Vertical scrolling of the modal body still works.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/PortfolioModal.tsx
git commit -m "feat(portfolio): show video + image gallery in the detail modal"
```

---

### Task 9: CMS fields, docs, and example content

**Files:**
- Modify: `public/admin/config.yml`
- Modify: `docs/cms.md`
- Modify: `src/content/portfolio/ai-document-pipeline.json`

- [ ] **Step 1: Add the CMS fields**

In `public/admin/config.yml`, after the `logo` field, insert:

```yaml
      - { name: video, label: Video URL, widget: string, required: false,
          pattern: ['(youtube\.com|youtu\.be|vimeo\.com)', 'Must be a YouTube or Vimeo link'],
          hint: "Upload the video to YouTube or Vimeo first, then paste the link here. Do not upload video files — this repo only stores images." }
      - { name: gallery, label: Extra images, widget: list, required: false,
          field: { name: image, label: Image, widget: image },
          hint: "Shown after the video in the popup, swipeable with dots." }
```

And update the `coverImage` hint so its double duty is obvious:

```yaml
      - { name: coverImage, label: Cover image, widget: image, required: false,
          hint: "Card image, and the poster frame shown before a video is played." }
```

- [ ] **Step 2: Document it for editors**

Append to `docs/cms.md`:

```markdown
## Adding video

Videos are **hosted externally** — they are never uploaded into this repo.
Git keeps every version of every file forever, and GitHub rejects files over
100 MB, so a video committed here would bloat the repo permanently.

1. Upload the video to YouTube or Vimeo.
2. Paste its link into **Video URL**.
3. Set a **Cover image** — it is the poster frame shown before playback, on
   both the card and the popup. Without it the video shows a grey placeholder.
4. Optionally add **Extra images**; they become swipeable slides after the
   video in the popup.

Anything other than a YouTube or Vimeo link is rejected — by the CMS as you
type, and by the build as a backstop. Nothing loads from the video host until
a visitor actually presses play.
```

- [ ] **Step 3: Add real content to exercise it**

Edit `src/content/portfolio/ai-document-pipeline.json` — add `video` and `gallery` (replace the URL with a real one; the placeholder below is a valid YouTube id shape and will parse):

```json
  "coverImage": "/images/portfolio/Online-Examentraining-2027.webp",
  "logo": "/images/portfolio/mytutor.png",
  "video": "https://youtu.be/dQw4w9WgXcQ",
  "gallery": [
    "/images/portfolio/Online-Examentraining-2027.webp"
  ],
```

- [ ] **Step 4: Verify the whole pipeline**

```bash
node --test --experimental-strip-types src/app/data/portfolio.test.ts
npm run build
```

Expected: tests pass, build succeeds. Then `npm run dev` and confirm the card shows a play button and the modal shows the gallery.

- [ ] **Step 5: Commit**

```bash
git add public/admin/config.yml docs/cms.md src/content/portfolio/ai-document-pipeline.json
git commit -m "feat(portfolio): add video and gallery CMS fields with editor docs"
```

---

### Task 10: Final verification pass

**Files:** none modified — this task is verification only. Fix anything it surfaces before finishing.

- [ ] **Step 1: Automated checks**

```bash
node --test --experimental-strip-types src/app/lib/video-source.test.ts
node --test --experimental-strip-types src/app/data/portfolio.test.ts
node --test --experimental-strip-types src/app/data/content.test.ts
node --test --experimental-strip-types src/app/data/portfolio-content.test.ts
npm run build
```

Expected: all `# fail 0`; build clean with no new warnings.

- [ ] **Step 2: Desktop browser pass**

`npm run dev`, at 1280px wide:
- No request to any video host until play is pressed (Network tab, filter `youtube`).
- Card: play works inline; clicking the title/body opens the modal and stops inline playback.
- Modal: video plays; swipe/dots work; closing stops audio immediately.
- Console has no errors or unhandled rejections.

- [ ] **Step 3: Mobile pass at 375px**

- The card is one per view; play button is comfortably tappable (≥44px — the 64px button passes).
- The gallery swipes with a finger and snaps cleanly.
- No horizontal overflow on the page itself.

- [ ] **Step 4: Keyboard-only pass**

- Tab order per card: play button, then title button. Both activate with Enter.
- The card shows a focus ring (`focus-within` on the card root).
- In the modal: dots are reachable and operable; Escape closes and stops audio.

- [ ] **Step 5: Backwards-compatibility check**

Temporarily remove `video` and `gallery` from the JSON and confirm the card and modal render exactly as they did before this work. Restore afterwards.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(portfolio): address verification pass findings"
```

---

## Notes carried from the PRD

- **Not covered by automated tests:** click-to-play, swipe, dots, pause-on-close, Lenis interaction. Verified manually in Tasks 5, 8, and 10.
- **Deliberately out of scope:** captions (the video host provides them), self-hosted video, and adding a component test runner.
- **Behaviour change to flag at review:** Task 3 removes the carousel's infinite wrap-around. This was not in the PRD; it is forced by the clone problem and also fixes a pre-existing bug where clicking the cloned card did nothing.
