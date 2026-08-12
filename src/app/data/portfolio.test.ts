// Structural guards for the portfolio content pipeline. Content copy is free
// to change; the shapes the carousel and modal rely on must hold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePortfolioItems } from "./portfolio.ts";

const valid = {
  title: "Project A",
  summary: "Did a thing.",
  tags: ["React"],
  order: 1,
  body: "## Heading\n\nBody copy.",
};

test("parses a valid item and applies defaults for optional fields", () => {
  const [item] = parsePortfolioItems([valid]);
  assert.equal(item.title, "Project A");
  assert.equal(item.client, undefined);
  assert.equal(item.coverImage, undefined);
  assert.deepEqual(item.tags, ["React"]);
});

test("sorts items by order ascending", () => {
  const items = parsePortfolioItems([
    { ...valid, title: "B", order: 2 },
    { ...valid, title: "A", order: 1 },
  ]);
  assert.deepEqual(
    items.map((item) => item.title),
    ["A", "B"],
  );
});

test("filters out draft items", () => {
  const items = parsePortfolioItems([
    valid,
    { ...valid, title: "Hidden", draft: true },
  ]);
  assert.deepEqual(
    items.map((item) => item.title),
    ["Project A"],
  );
});

test('treats empty-string optional fields as absent (CMS clears fields to "")', () => {
  const [item] = parsePortfolioItems([{ ...valid, coverImage: "", client: "" }]);
  assert.equal(item.coverImage, undefined);
  assert.equal(item.client, undefined);
});

test("defaults tags to an empty array and order to 0", () => {
  const [item] = parsePortfolioItems([
    { title: "T", summary: "S", body: "B" },
  ]);
  assert.deepEqual(item.tags, []);
  assert.equal(item.order, 0);
});

test("throws a descriptive error on missing required fields", () => {
  assert.throws(() => parsePortfolioItems([{ ...valid, title: "" }]), /title/);
  assert.throws(
    () => parsePortfolioItems([{ ...valid, summary: undefined }]),
    /summary/,
  );
  assert.throws(
    () => parsePortfolioItems([{ ...valid, body: undefined }]),
    /body/,
  );
});

test("throws on non-object entries (malformed content file)", () => {
  assert.throws(() => parsePortfolioItems(["nope"]), /object/i);
});

test("throws on non-string tag entries and non-array tags", () => {
  assert.throws(() => parsePortfolioItems([{ ...valid, tags: [1, 2] }]), /tags/);
  assert.throws(() => parsePortfolioItems([{ ...valid, tags: "React" }]), /tags/);
});

test("throws on non-number or NaN order when the field is present", () => {
  assert.throws(() => parsePortfolioItems([{ ...valid, order: "2" }]), /order/);
  assert.throws(() => parsePortfolioItems([{ ...valid, order: NaN }]), /order/);
});

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
