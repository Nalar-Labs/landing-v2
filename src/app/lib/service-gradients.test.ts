// src/app/lib/service-gradients.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SERVICE_CARD_GRADIENTS } from "./service-gradients.ts";
import { SERVICE_CARD_COUNT } from "./service-scroll-sequence.ts";

test("there is exactly one gradient per card", () => {
  assert.equal(SERVICE_CARD_GRADIENTS.length, SERVICE_CARD_COUNT);
});

test("every gradient only references brand CSS variables, never a raw hex", () => {
  const hexPattern = /#[0-9a-fA-F]{3,8}/;
  for (const gradient of SERVICE_CARD_GRADIENTS) {
    assert.equal(
      hexPattern.test(gradient),
      false,
      `gradient "${gradient}" contains a hard-coded hex value`,
    );
    assert.match(gradient, /^linear-gradient\(/);
  }
});

test("adjacent cards never use the exact same gradient", () => {
  for (let i = 1; i < SERVICE_CARD_GRADIENTS.length; i++) {
    assert.notEqual(SERVICE_CARD_GRADIENTS[i], SERVICE_CARD_GRADIENTS[i - 1]);
  }
});
