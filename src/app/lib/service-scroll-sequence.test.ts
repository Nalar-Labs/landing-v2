import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_CARD_COUNT,
  getCardIntensity,
  getCardExpansion,
  getServiceCardExpansion,
} from "./service-scroll-sequence.ts";

test("SERVICE_CARD_COUNT is 3 (one trio of service cards)", () => {
  assert.equal(SERVICE_CARD_COUNT, 3);
});

test("getCardIntensity is 0 at the very start of a card's band", () => {
  assert.equal(getCardIntensity(0, 0, 3), 0);
});

test("getCardIntensity peaks at 1 in the middle of a card's band", () => {
  // card 0's band is [0, 1/6], peak at 1/12 (explicit count: SERVICE_CARD_COUNT is 3 now)
  assert.equal(getCardIntensity(1 / 12, 0, 6), 1);
  // card 2's band is [2/6, 3/6], peak at 2.5/6
  assert.equal(getCardIntensity(2.5 / 6, 2, 6), 1);
});

test("getCardIntensity is 0 outside a card's band", () => {
  assert.equal(getCardIntensity(0.9, 0, 6), 0);
  assert.equal(getCardIntensity(0, 5, 6), 0);
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

test("getCardExpansion is a generic per-count band ramp, independent of SERVICE_CARD_COUNT", () => {
  // 3 steps (same count as SERVICE_CARD_COUNT, by coincidence -- this is the
  // exact collision that used to make Approach silently inherit Services'
  // hand-tuned CARD_WINDOWS). band = 1/3, step 0's ramp is [0, 0.2].
  assert.equal(getCardExpansion(0, 0, 3), 0);
  // 0.1 / (1/3 * 0.6) isn't exactly 0.5 in floating point (same class of
  // imprecision as the getCardIntensity ramp test above), so use a tolerance.
  assert.ok(Math.abs(getCardExpansion(0.1, 0, 3) - 0.5) < 1e-9);
  assert.equal(getCardExpansion(0.25, 0, 3), 1);
});

test("getCardExpansion works for a count that differs from SERVICE_CARD_COUNT too", () => {
  // 5 steps: band = 0.2, step 1's ramp is [0.2, 0.32]
  assert.equal(getCardExpansion(0.2, 1, 5), 0);
  assert.equal(getCardExpansion(0.32, 1, 5), 1);
});

test("getServiceCardExpansion is 0 before a card's window starts", () => {
  // card 1's window is [0.3, 0.6]
  assert.equal(getServiceCardExpansion(0.29, 1), 0);
});

test("getServiceCardExpansion ramps linearly across a card's window", () => {
  // card 0's window is [0, 0.3]; halfway through is 0.5
  assert.equal(getServiceCardExpansion(0.15, 0), 0.5);
});

test("getServiceCardExpansion holds at 1 after its window (cards stay expanded)", () => {
  assert.equal(getServiceCardExpansion(0.95, 0), 1);
  assert.equal(getServiceCardExpansion(1, 2), 1);
});

test("every service card is fully expanded by the end of the scroll", () => {
  for (let i = 0; i < SERVICE_CARD_COUNT; i += 1) {
    assert.equal(getServiceCardExpansion(1, i), 1);
  }
});

