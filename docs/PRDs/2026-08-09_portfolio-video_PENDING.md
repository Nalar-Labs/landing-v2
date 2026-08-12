# Plan — Video support in the Portfolio section

Status: **PENDING** — decisions in §1 settled, ready to build. Last updated 2026-08-09.

Goal: portfolio items can lead with video instead of a static cover image.
1. Cards in the carousel can play their video inline, on click.
2. Opening an item shows the video at the top of the modal.
3. Video + any extra images form one swipeable gallery with Instagram-style dots.

---

## 1. Decisions

**Hosting: everything external.** Videos live on YouTube / Vimeo (or any embed
host); the CMS stores a **URL**, never a file. Nothing video-related is committed
to the repo.

This matters because Sveltia is git-based — `media_folder` commits uploads
straight into `Nalar-Labs/landing-v2`. That is fine for 200 KB webp covers and
badly wrong for video: GitHub hard-rejects files over 100 MB, and git history
keeps every version forever, so re-uploading a 40 MB file five times leaves
200 MB in the repo permanently. Going external avoids all of it and gets
adaptive bitrate for free.

**Playback: click to play, no muted autoplay.** No hover previews, no autoplay
loops. This removes a large amount of the original complexity — the intent-delay
timer, the single-player registry, `prefers-reduced-motion` autoplay suppression,
Save-Data checks, and lazy `src` assignment all disappear.

**Modal layout: one carousel, video first.** Video is slide 1, images are slides
2..n, dots span all of them — an Instagram multi-media post.

### The consequence that needs a design answer

Everything external + click-to-play collides with the card's existing behaviour:
**the whole card is already a `<button>` that opens the modal.** If clicking also
plays video, one click has two meanings.

Proposed resolution: a **play button on the thumbnail** plays inline; clicking
anywhere else on the card opens the modal. That requires restructuring the card —
a `<button>` inside a `<button>` is invalid HTML and the inner click gets
swallowed. See §3.

---

## 2. Data model

`src/app/data/portfolio.ts` — additive and backwards compatible. The existing
`ai-document-pipeline.json` (no video) must keep working untouched.

```ts
export type PortfolioItem = {
  // ...existing fields unchanged
  coverImage?: string;  // still the card image AND the video facade poster
  video?: string;       // NEW: external video URL (YouTube/Vimeo)
  gallery?: string[];   // NEW: extra images, shown after the video in the modal
};
```

Validation in `parsePortfolioItems` (which throws by design):

- `video` must parse to a **recognised external host**. A bare local path like
  `/images/foo.mp4` is a mistake under this decision — throw and say so, rather
  than silently rendering a broken embed.
- `gallery` must be an array of non-empty strings (mirror the `tags` validation).
- `video` set without `coverImage` is allowed but poor: the facade then has no
  poster. Fall back to the first `gallery` image, then the gradient placeholder.

New pure helper `src/app/lib/video-source.ts`:

```ts
type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string };

export function parseVideoSource(url: string): VideoSource | null;
export function embedUrl(source: VideoSource): string;
```

Must handle the URL shapes people actually paste: `youtube.com/watch?v=`,
`youtu.be/`, `/embed/`, `/shorts/`, and `vimeo.com/<id>`. Returns `null` for
anything unrecognised so validation can throw a clear message. Fully unit-testable.

---

## 3. The card

**Restructure required.** Today `PortfolioCard` is a single `<button>` wrapping
everything. A nested play `<button>` is invalid HTML. Change to the standard
"stretched link" pattern:

- Outer element becomes a `<div class="relative">` — not interactive itself.
- The title carries the real `<button>` that opens the modal, with an
  `::after` overlay (`absolute inset-0`) making the whole card clickable.
- The **play button sits above that overlay** (`relative z-10`), so it wins its
  own clicks while the rest of the card still opens the modal.

This keeps exactly one accessible name per action and stays keyboard-navigable:
tab reaches "Open <title>" and "Play <title>" as two distinct controls.

Behaviour:

| State | Renders |
|---|---|
| No `video` | `coverImage`, or today's gradient placeholder. Unchanged. |
| `video`, not yet played | `coverImage` + centred play button — a **facade** |
| Play clicked | facade swapped for the host `<iframe>` with `autoplay=1`, playing inline in the card |
| Modal opened | inline iframe unmounted, so audio stops |

**The facade is the important part.** A YouTube iframe pulls roughly 1 MB of JS
and sets third-party cookies. Six of them on the landing page would be a serious
regression. Rendering a poster + play button and only mounting the iframe on
click means visitors who never press play pay nothing. Use
`youtube-nocookie.com` and Vimeo's DNT parameter.

`aspect-[16/10]` is locked on facade and iframe alike so nothing shifts on swap.

---

## 4. Modal — media gallery with dots

New `src/app/components/MediaGallery.tsx`, replacing the modal's current cover
image block. Slides = `[video (if any), ...gallery]`. With neither, keep today's
`coverImage`/gradient exactly as-is.

**Mechanism: CSS scroll-snap**, not a carousel library —
`overflow-x-auto snap-x snap-mandatory` with one `snap-center` child per slide
and an IntersectionObserver driving the active dot. Rationale: zero new
dependencies, native momentum swipe on mobile, keyboard- and screen-reader-
friendly by default. The repo already carries two carousel libraries
(`@glidejs/glide` in use, `embla-carousel-react` unused); a third mechanism is
cheaper than generalising `useGlide` — written for the section carousel — or
switching on a second library for one modal.

The video slide uses the same facade component as the card.

**Two traps:**

- **Lenis owns wheel events site-wide.** The modal already needs
  `data-lenis-prevent` to scroll vertically; a horizontal scroll-snap container
  nested inside it must be checked for trackpad horizontal scroll and will
  likely need its own. Verify this first — it can invalidate the approach.
- **Radix keeps the dialog mounted ~200 ms after close** (the existing
  `lastItemRef` comment documents this). Relying on unmount to stop audio leaves
  sound playing. Unmount the iframe explicitly in an effect keyed on `item`.

**Extract `Dots.tsx`** from the dot markup already in `PortfolioCarousel.tsx` and
use it in both places so the two stay visually identical.

Captions are the host's job under this decision — no `<track>` work needed.

---

## 5. CMS + docs

`public/admin/config.yml`, portfolio collection:

```yaml
- { name: video, label: Video URL, widget: string, required: false,
    pattern: ['(youtube\.com|youtu\.be|vimeo\.com)', 'Must be a YouTube or Vimeo link'],
    hint: "Paste a YouTube or Vimeo link. Upload the video there first — do not upload video files here." }
- { name: gallery, label: Extra images, widget: list, required: false,
    field: { name: image, widget: image } }
```

The `pattern` catches a bad paste in the CMS, where the editor can fix it —
rather than at build time, where it breaks the site.

`coverImage`'s hint gains: it is now also the video's poster frame.

`docs/cms.md` — short "Adding video" section: upload to YouTube/Vimeo, paste the
link, always set a cover image, and never try to upload video files.

---

## 6. Work order

Each step ends green (`node --test --experimental-strip-types <file>` — the
repo's convention; there is no `npm test` script).

**Coverage limitation, stated plainly:** the repo's tests are pure-logic node
tests with no jsdom/RTL/vitest. Steps 1–2 are genuinely testable. Steps 3–5 —
click-to-play, swipe, unmount-on-close — have **no automated test path** and will
be verified manually in the browser. Adding a component test runner is a separate
decision, not smuggled into this feature.

0. **Spike the Lenis / horizontal-swipe interaction** (§4) before anything else.
   It is the one unknown that could change the approach.
1. **`video-source.ts` + test** — pure URL parsing, no UI.
2. **Data model + validation** — types, `parsePortfolioItems`, new cases in
   `portfolio.test.ts`: video present/absent, local path rejected, unrecognised
   host rejected, malformed `gallery`, and a regression that a video-less item is
   unchanged.
3. **`VideoFacade.tsx`** — poster + play button + iframe swap. Shared by card and
   gallery, so it is built once, first.
4. **`PortfolioCard`** — restructure to the stretched-link pattern, mount the
   facade. Verify: keyboard tab order, play vs open-modal clicks, no iframe in
   the network tab until play is pressed.
5. **`Dots.tsx`** extracted; `PortfolioCarousel` refactored onto it. No visual change.
6. **`MediaGallery.tsx`** + wire into `PortfolioModal`, with unmount-on-close.
7. **CMS config + `docs/cms.md` + a real example item** with video and gallery.
8. **Full pass:** desktop + 375 px, keyboard-only, no console errors,
   `npm run build` clean.

Steps 1, 2 and 5 are safe to land independently.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Iframe weight / third-party cookies on the landing page | facade pattern — iframe only mounts on click; `youtube-nocookie.com` |
| Two click targets on one card | stretched-link restructure (§3); verified by keyboard |
| Lenis vs horizontal swipe | spiked as step 0 |
| Audio continues after modal close | explicit unmount effect, not Radix unmount |
| Editor pastes a bad or local URL | CMS `pattern` catches it first; validation throws at build as backstop |
| Layout shift on facade → iframe swap | `aspect-[16/10]` locked on both |
| Cover image missing → posterless facade | fall back to first gallery image, then gradient |
