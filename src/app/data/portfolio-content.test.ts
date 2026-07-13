// Guards the real content files: everything in src/content/portfolio must
// satisfy the parser the site boots with, because parse errors there crash
// the build. Reads the dir via node:fs since import.meta.glob is Vite-only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePortfolioItems } from "./portfolio.ts";

const contentDir = fileURLToPath(
  new URL("../../content/portfolio/", import.meta.url),
);

function loadAll(): unknown[] {
  return readdirSync(contentDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(contentDir, name), "utf8")));
}

test("there is at least one portfolio content file", () => {
  assert.ok(loadAll().length >= 1);
});

test("every content file parses cleanly", () => {
  assert.doesNotThrow(() => parsePortfolioItems(loadAll()));
});

test("published items have unique titles (used as React keys)", () => {
  const titles = parsePortfolioItems(loadAll()).map((item) => item.title);
  assert.equal(new Set(titles).size, titles.length);
});

test("published items have unique orders (stable carousel/dot order)", () => {
  const orders = parsePortfolioItems(loadAll()).map((item) => item.order);
  assert.equal(new Set(orders).size, orders.length);
});
