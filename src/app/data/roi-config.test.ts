// Structural guards for the ROI config. The numbers are free to change; the
// shapes and orderings the model depends on must hold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROI_CONFIG } from "./roi-config.ts";

test("tier bands are sorted ascending and start at 1", () => {
  const froms = ROI_CONFIG.tiers.map((tier) => tier.fromUsers);
  assert.equal(froms[0], 1, "first band must start at 1 user");
  assert.deepEqual(froms, [...froms].sort((a, b) => a - b));
});

test("every tier has a maintenance entry", () => {
  for (const tier of ROI_CONFIG.tiers) {
    assert.ok(
      ROI_CONFIG.maintenanceHours[tier.name] !== undefined,
      `missing maintenance hours for ${tier.name}`,
    );
  }
});

test("catalog ids are unique", () => {
  const ids = ROI_CONFIG.catalog.map((app) => app.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("catalog contains both internal and external apps", () => {
  const kinds = new Set(ROI_CONFIG.catalog.map((app) => app.kind));
  assert.ok(kinds.has("internal"));
  assert.ok(kinds.has("external"));
});

test("monthly tier rate equals hourly rate times monthly hours", () => {
  for (const tier of ROI_CONFIG.tiers) {
    assert.equal(tier.monthlyRate, tier.hourlyRate * ROI_CONFIG.monthlyHours);
  }
});
