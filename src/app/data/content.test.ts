// src/app/data/content.test.ts
// Structural guards only — marketing copy is free to change without
// breaking tests, but the shapes the components rely on must hold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { HERO, SERVICES, APPROACH_STEPS, FAQ_ITEMS, NAV_LINKS } from "./content.ts";
import { SERVICE_CARD_COUNT } from "../lib/service-scroll-sequence.ts";

test("hero prefix and suffix are non-empty", () => {
  assert.ok(HERO.prefix.trim().length > 0);
  assert.ok(HERO.suffix.trim().length > 0);
});

test("hero has at least two cycling words (a 1-word loop would look broken)", () => {
  assert.ok(HERO.cycling.length >= 2);
});

test("SERVICE_CARD_COUNT matches the actual number of services in content", () => {
  assert.equal(SERVICES.length, SERVICE_CARD_COUNT);
});

test("every service has a title and a description", () => {
  for (const service of SERVICES) {
    assert.ok(service.title.trim().length > 0);
    assert.ok(service.description.trim().length > 0);
  }
});

test("approach steps exist and each has a body (steps list or paragraph)", () => {
  assert.ok(APPROACH_STEPS.length >= 2);
  for (const step of APPROACH_STEPS) {
    assert.ok(step.title.trim().length > 0);
    assert.ok((step.steps?.length ?? 0) > 0 || (step.paragraph?.length ?? 0) > 0);
  }
});

test("there are six FAQ items, each with a question and an answer", () => {
  assert.equal(FAQ_ITEMS.length, 6);
  for (const item of FAQ_ITEMS) {
    assert.ok(item.question.trim().length > 0);
    assert.ok(item.answer.trim().length > 0);
  }
});

test("no FAQ answer quotes an hourly rate", () => {
  // Public-site decision: pricing describes the process, never a number.
  for (const item of FAQ_ITEMS) {
    assert.doesNotMatch(item.answer, /\$\s?\d/);
    assert.doesNotMatch(item.answer, /per hour|\/hour|hourly rate/i);
  }
});

test("every in-page nav link points at a section that actually exists", () => {
  const sectionsDir = fileURLToPath(new URL("../sections/", import.meta.url));
  const sourceText = readdirSync(sectionsDir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => readFileSync(join(sectionsDir, file), "utf8"))
    .join("\n");

  const inPageLinks = NAV_LINKS.filter((link) => link.href.startsWith("#"));
  for (const link of inPageLinks) {
    const id = link.href.slice(1);
    assert.ok(
      sourceText.includes(`id="${id}"`),
      `NAV_LINKS has "${link.href}" but no section declares id="${id}"`,
    );
  }
});
