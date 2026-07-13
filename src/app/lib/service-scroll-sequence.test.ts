import { test } from "node:test";
import assert from "node:assert/strict";
import { SERVICE_CARD_COUNT, getCardIntensity } from "./service-scroll-sequence.ts";

test("SERVICE_CARD_COUNT is 6 (3 Consultation + 3 End-to-End Implementation cards)", () => {
  assert.equal(SERVICE_CARD_COUNT, 6);
});

test("getCardIntensity is 0 at the very start of a card's band", () => {
  assert.equal(getCardIntensity(0, 0), 0);
});

test("getCardIntensity peaks at 1 in the middle of a card's band", () => {
  // card 0's band is [0, 1/6], peak at 1/12
  assert.equal(getCardIntensity(1 / 12, 0), 1);
  // card 2's band is [2/6, 3/6], peak at 2.5/6
  assert.equal(getCardIntensity(2.5 / 6, 2), 1);
});

test("getCardIntensity is 0 outside a card's band", () => {
  assert.equal(getCardIntensity(0.9, 0), 0);
  assert.equal(getCardIntensity(0, 5), 0);
});

test("getCardIntensity ramps linearly between band start and peak", () => {
  // card 0 band [0, 1/6], peak 1/12 -> halfway to peak should be ~0.5
  const halfway = getCardIntensity(1 / 24, 0);
  assert.ok(Math.abs(halfway - 0.5) < 1e-9, `expected ~0.5, got ${halfway}`);
});

test("getCardIntensity works for an arbitrary count (Approach steps reuse it)", () => {
  // 3 steps: step 1's band is [1/3, 2/3], peak at 0.5
  assert.equal(getCardIntensity(0.5, 1, 3), 1);
  assert.equal(getCardIntensity(0.32, 1, 3), 0);
  assert.equal(getCardIntensity(0.99, 2, 3) > 0, true);
});
