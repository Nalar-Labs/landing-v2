// src/app/data/content.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { HERO, SERVICE_GROUPS } from "./content.ts";
import { SERVICE_CARD_COUNT } from "../lib/service-scroll-sequence.ts";

test("hero has exactly three lines", () => {
  assert.equal(HERO.lines.length, 3);
});

test("line 1 copy and cycling words match the spec", () => {
  assert.equal(HERO.lines[0].static, "You don't need expensive");
  assert.deepEqual(HERO.lines[0].cycling, ["tools", "SaaS", "paid software"]);
});

test("line 2 copy and cycling words match the spec", () => {
  assert.equal(HERO.lines[1].static, "You don't need to hire");
  assert.deepEqual(HERO.lines[1].cycling, [
    "consultants",
    "developers",
    "designers",
    "marketers",
  ]);
});

test("line 3 is fully static (no cycling list)", () => {
  assert.equal(
    HERO.lines[2].static,
    "You just need the right partners for your business.",
  );
  assert.equal(HERO.lines[2].cycling, undefined);
});

test("every cycling list has at least two words (a 1-word loop would look broken)", () => {
  for (const line of HERO.lines) {
    if (line.cycling) assert.ok(line.cycling.length >= 2);
  }
});

test("SERVICE_CARD_COUNT matches the actual number of services in content", () => {
  const actual = SERVICE_GROUPS.reduce((n, g) => n + g.items.length, 0);
  assert.equal(actual, SERVICE_CARD_COUNT);
});
