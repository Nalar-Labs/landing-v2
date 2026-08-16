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

test("every tier has per-app maintenance hours; audience load is non-negative", () => {
  for (const tier of ROI_CONFIG.tiers) {
    assert.ok(
      ROI_CONFIG.maintenanceHoursPerApp[tier.name] > 0,
      `missing per-app maintenance hours for ${tier.name}`,
    );
  }
  assert.ok(ROI_CONFIG.maintenanceHoursPerThousandUsers >= 0);
});

test("hosting taper never charges beyond-users more than within-taper users", () => {
  assert.ok(ROI_CONFIG.hostingTaperAfterUsers > 0);
  assert.ok(ROI_CONFIG.hostingPerUserBeyondMonthly <= ROI_CONFIG.hostingPerUserMonthly);
});

test("agency months multiplier is at least 1 — never claim agencies are faster", () => {
  assert.ok(ROI_CONFIG.agencyMonthsMultiplier >= 1);
});

test("every tier has a timeline multiplier of at least 1", () => {
  for (const tier of ROI_CONFIG.tiers) {
    const multiplier = ROI_CONFIG.timeline.tierMonthsMultiplier[tier.name];
    assert.ok(multiplier >= 1, `multiplier under 1 would promise faster at scale (${tier.name})`);
  }
});

test("catalog weights are positive and the workflow baseline stays 1.00", () => {
  for (const app of ROI_CONFIG.catalog) {
    assert.ok(app.weight > 0, `non-positive weight for ${app.id}`);
  }
  assert.equal(ROI_CONFIG.catalog.find((app) => app.id === "workflow")?.weight, 1);
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
