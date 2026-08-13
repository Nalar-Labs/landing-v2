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
  // Showcase/album URLs have two numeric segments (showcase id, then video
  // id). The id AFTER "video" is the one that must win, not the first one.
  assert.deepEqual(
    parseVideoSource("https://vimeo.com/showcase/12345/video/67890"),
    { kind: "vimeo", id: "67890" },
  );
  // Video inside a channel: one numeric segment, no "video" anchor — still
  // unambiguous, so it must resolve rather than being rejected.
  assert.deepEqual(
    parseVideoSource("https://vimeo.com/channels/staffpicks/123456789"),
    expected,
  );
  // Video inside a group: the anchor segment is "videos" (plural), which the
  // exact "video" match deliberately misses — falls through to the single
  // numeric segment rule instead.
  assert.deepEqual(
    parseVideoSource("https://vimeo.com/groups/somegroup/videos/123456789"),
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
  // Two numeric segments with no "video" anchor — which one is the real id
  // is ambiguous, so this must fail loudly rather than guess the first.
  assert.equal(parseVideoSource("https://vimeo.com/12345/67890"), null);
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

test("adds the provider's mute flag only when asked", () => {
  // Autoplay is refused by browsers unless the embed is muted, so the hover
  // preview depends on these exact params being present.
  const yt = embedUrl({ kind: "youtube", id: "dQw4w9WgXcQ" }, { autoplay: true, muted: true });
  assert.ok(yt.includes("autoplay=1"));
  assert.ok(yt.includes("mute=1"));

  const vimeo = embedUrl({ kind: "vimeo", id: "123456789" }, { autoplay: true, muted: true });
  assert.ok(vimeo.includes("autoplay=1"));
  assert.ok(vimeo.includes("muted=1"));

  // Unmuted (click-to-play) must not carry a mute flag.
  assert.ok(!embedUrl({ kind: "youtube", id: "dQw4w9WgXcQ" }, { autoplay: true }).includes("mute"));
  assert.ok(!embedUrl({ kind: "vimeo", id: "123456789" }, { autoplay: true }).includes("muted"));
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
