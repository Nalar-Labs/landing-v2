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
