// src/app/data/content.test.ts
// Structural guards only — marketing copy is free to change without
// breaking tests, but the shapes the components rely on must hold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { HERO, SERVICE_GROUPS, APPROACH_STEPS } from "./content.ts";
import { SERVICE_CARD_COUNT } from "../lib/service-scroll-sequence.ts";

test("hero has at least one line and every line has non-empty static copy", () => {
  assert.ok(HERO.lines.length >= 1);
  for (const line of HERO.lines) {
    assert.ok(line.static.trim().length > 0);
  }
});

test("at least one hero line cycles (the animated headline needs a cycling slot)", () => {
  assert.ok(HERO.lines.some((line) => "cycling" in line && line.cycling));
});

test("every cycling list has at least two words (a 1-word loop would look broken)", () => {
  for (const line of HERO.lines) {
    if ("cycling" in line && line.cycling) assert.ok(line.cycling.length >= 2);
  }
});

test("SERVICE_CARD_COUNT matches the actual number of services in content", () => {
  const actual = SERVICE_GROUPS.reduce((n, g) => n + g.items.length, 0);
  assert.equal(actual, SERVICE_CARD_COUNT);
});

test("approach steps exist and each has a body (steps list or paragraph)", () => {
  assert.ok(APPROACH_STEPS.length >= 2);
  for (const step of APPROACH_STEPS) {
    assert.ok(step.title.trim().length > 0);
    assert.ok((step.steps?.length ?? 0) > 0 || (step.paragraph?.length ?? 0) > 0);
  }
});
