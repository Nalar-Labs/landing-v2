import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_CARD_COUNT,
  HEADING_SWAP_PROGRESS,
  getCardIntensity,
  getServicesHeadingLabel,
} from "./service-scroll-sequence.ts";

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

test("HEADING_SWAP_PROGRESS is the peak of the 3rd card (index 2)", () => {
  assert.equal(HEADING_SWAP_PROGRESS, 2.5 / 6);
});

test("getServicesHeadingLabel stays Consultation before the 3rd card peaks", () => {
  assert.equal(getServicesHeadingLabel(0), "Consultation");
  assert.equal(getServicesHeadingLabel(HEADING_SWAP_PROGRESS - 0.01), "Consultation");
});

test("getServicesHeadingLabel flips to Implementation at and after the 3rd card's peak", () => {
  assert.equal(getServicesHeadingLabel(HEADING_SWAP_PROGRESS), "Implementation");
  assert.equal(getServicesHeadingLabel(1), "Implementation");
});

test("getServicesHeadingLabel reverts to Consultation when progress drops back down (scroll-up)", () => {
  assert.equal(getServicesHeadingLabel(0.9), "Implementation");
  assert.equal(getServicesHeadingLabel(0.1), "Consultation");
});
