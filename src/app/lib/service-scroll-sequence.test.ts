import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_CARD_COUNT,
  getCardIntensity,
  getCardExpansion,
} from "./service-scroll-sequence.ts";

test("SERVICE_CARD_COUNT is 3 (one trio of service cards)", () => {
  assert.equal(SERVICE_CARD_COUNT, 3);
});

test("getCardIntensity is 0 at the very start of a card's band", () => {
  assert.equal(getCardIntensity(0, 0), 0);
});

test("getCardIntensity peaks at 1 in the middle of a card's band", () => {
  // card 0's band is [0, 1/6], peak at 1/12 (explicit count: SERVICE_CARD_COUNT is 3 now)
  assert.equal(getCardIntensity(1 / 12, 0, 6), 1);
  // card 2's band is [2/6, 3/6], peak at 2.5/6
  assert.equal(getCardIntensity(2.5 / 6, 2, 6), 1);
});

test("getCardIntensity is 0 outside a card's band", () => {
  assert.equal(getCardIntensity(0.9, 0), 0);
  assert.equal(getCardIntensity(0, 5), 0);
});

test("getCardIntensity ramps linearly between band start and peak", () => {
  // card 0 band [0, 1/6], peak 1/12 -> halfway to peak should be ~0.5
  // (explicit count: SERVICE_CARD_COUNT is 3 now)
  const halfway = getCardIntensity(1 / 24, 0, 6);
  assert.ok(Math.abs(halfway - 0.5) < 1e-9, `expected ~0.5, got ${halfway}`);
});

test("getCardIntensity works for an arbitrary count (Approach steps reuse it)", () => {
  // 3 steps: step 1's band is [1/3, 2/3], peak at 0.5
  assert.equal(getCardIntensity(0.5, 1, 3), 1);
  assert.equal(getCardIntensity(0.32, 1, 3), 0);
  assert.equal(getCardIntensity(0.99, 2, 3) > 0, true);
});

test("getCardExpansion is 0 before a card's window starts", () => {
  // card 1's window is [0.3, 0.6]
  assert.equal(getCardExpansion(0.29, 1), 0);
});

test("getCardExpansion ramps linearly across a card's window", () => {
  // card 0's window is [0, 0.3]; halfway through is 0.5
  assert.equal(getCardExpansion(0.15, 0), 0.5);
});

test("getCardExpansion holds at 1 after its window (cards stay expanded)", () => {
  assert.equal(getCardExpansion(0.95, 0), 1);
  assert.equal(getCardExpansion(1, 2), 1);
});

test("every card is fully expanded by the end of the scroll", () => {
  for (let i = 0; i < SERVICE_CARD_COUNT; i += 1) {
    assert.equal(getCardExpansion(1, i), 1);
  }
});

