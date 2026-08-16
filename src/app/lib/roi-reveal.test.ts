import { test } from "node:test";
import assert from "node:assert/strict";
import { REVEAL_END, revealInsetPercent, revealClipPath } from "./roi-reveal.ts";

test("starts fully closed", () => {
  assert.equal(revealInsetPercent(0), 100);
});

test("is fully open by the end of the wipe and STAYS open", () => {
  assert.equal(revealInsetPercent(REVEAL_END), 0);
  for (const p of [0.31, 0.5, 0.9, 1]) {
    assert.equal(revealInsetPercent(p), 0, `retracted at progress ${p}`);
  }
});

test("never retracts while scrolling down", () => {
  let previous = Infinity;
  for (let p = 0; p <= 1.0001; p += 0.01) {
    const inset = revealInsetPercent(p);
    assert.ok(inset <= previous, `inset grew back at progress ${p}`);
    previous = inset;
  }
});

test("clamps out-of-range progress rather than overshooting", () => {
  assert.equal(revealInsetPercent(-0.5), 100);
  assert.equal(revealInsetPercent(5), 0);
});

test("emits a valid clip-path string", () => {
  assert.equal(revealClipPath(0), "inset(0% 0% 100% 0%)");
  assert.equal(revealClipPath(1), "inset(0% 0% 0% 0%)");
});
