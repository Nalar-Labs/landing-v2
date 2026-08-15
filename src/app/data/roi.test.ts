// The ROI model is pure logic, so unlike most of this repo it is genuinely
// testable. Guard the band edges and every branch that can reach a visitor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveTier, hostingMonthly, maintenanceMonthly } from "./roi.ts";
import { selectionWeight, buildMonths } from "./roi.ts";
import { ROI_CONFIG, type RoiConfig } from "./roi-config.ts";

test("resolveTier picks the band the user count falls in", () => {
  assert.equal(resolveTier(1), "Low");
  assert.equal(resolveTier(25), "Low");
  assert.equal(resolveTier(26), "Medium");
  assert.equal(resolveTier(100), "Medium");
  assert.equal(resolveTier(101), "High");
  assert.equal(resolveTier(5000), "High");
});

test("resolveTier clamps below the first band instead of returning undefined", () => {
  assert.equal(resolveTier(0), "Low");
  assert.equal(resolveTier(-5), "Low");
});

test("hostingMonthly is the base until per-user overtakes it", () => {
  assert.equal(hostingMonthly(10), 25);
  assert.equal(hostingMonthly(40), 25);
  assert.equal(hostingMonthly(100), 30);
  assert.equal(hostingMonthly(500), 150);
  assert.equal(hostingMonthly(5000), 1500);
});

test("hostingMonthly never jumps at a band edge", () => {
  // The banded model this replaced tripled between 100 and 101 users.
  const at100 = hostingMonthly(100);
  const at101 = hostingMonthly(101);
  assert.ok(at101 - at100 < 1, `expected a smooth step, got ${at100} -> ${at101}`);
});

test("maintenanceMonthly prices committed hours at the consulting rate", () => {
  assert.equal(maintenanceMonthly("Low"), 8 * 35);
  assert.equal(maintenanceMonthly("Medium"), 16 * 35);
  assert.equal(maintenanceMonthly("High"), 24 * 35);
});

test("selectionWeight sums weights, filtered by kind", () => {
  const picked = ["workflow", "hris", "web"];
  assert.equal(selectionWeight(picked, "internal"), 2);
  assert.equal(selectionWeight(picked, "external"), 1);
  assert.equal(selectionWeight(picked, "all"), 3);
});

test("selectionWeight ignores unknown ids", () => {
  assert.equal(selectionWeight(["workflow", "not-a-real-app"], "all"), 1);
});

test("selectionWeight of an empty selection is zero", () => {
  assert.equal(selectionWeight([], "all"), 0);
});

test("buildMonths follows base-plus-one-per-extra-app", () => {
  assert.equal(buildMonths(0), 0);
  assert.equal(buildMonths(1), 2);
  assert.equal(buildMonths(2), 2);
  assert.equal(buildMonths(3), 3);
  assert.equal(buildMonths(5), 5);
});

import { calculateRoi, agencyShareRange, type RoiInputs } from "./roi.ts";

const internalOnly: RoiInputs = {
  selectedAppIds: ["workflow", "hris"],
  employees: 40,
  paysForSoftware: true,
  currentMonthlySpend: 1800,
  externalUsers: 5000, // deliberately stale: no external app is ticked
};

test("returns null when nothing is selected, so the panel can rest", () => {
  assert.equal(calculateRoi({ ...internalOnly, selectedAppIds: [] }), null);
});

test("internal-only replacing SaaS produces the ROI story", () => {
  const result = calculateRoi(internalOnly);
  assert.ok(result);
  assert.equal(result.mode, "roi");
  assert.equal(result.tier, "Medium");
  assert.equal(result.buildMonths, 2);
  assert.equal(result.buildCost, 8800);
  assert.equal(result.hostingMonthly, 25);
  assert.equal(result.maintenanceMonthly, 560);
  assert.equal(result.newMonthly, 585);
  if (result.mode !== "roi") return;
  assert.equal(result.monthlySaving, 1215);
  assert.equal(result.payback.kind, "months");
  assert.equal(result.netBenefit, 34940);
});

test("a stale external user count cannot inflate the tier", () => {
  // externalUsers is 5000, but no external app is ticked, so scale is 40.
  const result = calculateRoi(internalOnly);
  assert.ok(result);
  assert.equal(result.tier, "Medium");
});

test("a stale hidden employees value cannot inflate an external-only headline", () => {
  // employees only renders in the form when an internal app is ticked, but
  // the model must not trust it once the selection is external-only.
  const externalOnly: RoiInputs = {
    selectedAppIds: ["web", "mobile", "desktop"],
    employees: 40, // stale, hidden — must be ignored
    paysForSoftware: false,
    currentMonthlySpend: 0,
    externalUsers: 10,
  };
  const result = calculateRoi(externalOnly);
  assert.ok(result);
  assert.equal(result.tier, "Low");
  assert.equal(Math.round((result.percentOfAgency ?? 0) * 100), 21);
  assert.equal(result.newMonthly, 305);

  const withoutStaleEmployees = calculateRoi({ ...externalOnly, employees: 0 });
  assert.deepEqual(result, withoutStaleEmployees);
});

test("ticking an external app switches to the agency story", () => {
  const result = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "hris", "web"],
  });
  assert.ok(result);
  assert.equal(result.mode, "agency");
  assert.equal(result.tier, "High");
  assert.equal(result.buildMonths, 3);
  assert.equal(result.hostingMonthly, 1500);
  assert.equal(result.newMonthly, 2340);
});

test("not paying for software switches to the agency story", () => {
  const result = calculateRoi({ ...internalOnly, paysForSoftware: false });
  assert.ok(result);
  assert.equal(result.mode, "agency");
});

test("agency reason is 'external' with an external app ticked, 'not-paying' otherwise", () => {
  const external = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "hris", "web"],
  });
  assert.ok(external);
  assert.equal(external.mode, "agency");
  if (external.mode !== "agency") return;
  assert.equal(external.reason, "external");

  const notPaying = calculateRoi({ ...internalOnly, paysForSoftware: false });
  assert.ok(notPaying);
  assert.equal(notPaying.mode, "agency");
  if (notPaying.mode !== "agency") return;
  assert.equal(notPaying.reason, "not-paying");
});

test("a zero or missing spend switches to the agency story", () => {
  const result = calculateRoi({ ...internalOnly, currentMonthlySpend: 0 });
  assert.ok(result);
  assert.equal(result.mode, "agency");
});

test("payback reports no-payback when the build costs more to run", () => {
  const result = calculateRoi({ ...internalOnly, currentMonthlySpend: 500 });
  assert.ok(result);
  assert.equal(result.mode, "roi");
  if (result.mode !== "roi") return;
  assert.ok(result.monthlySaving < 0);
  assert.equal(result.payback.kind, "no-payback");
  assert.equal(result.netBenefit, null);
  assert.equal(result.roiFraction, null);
});

test("ROI figures are null with no net saving, and populated when profitable", () => {
  const noSaving = calculateRoi({ ...internalOnly, currentMonthlySpend: 500 });
  assert.ok(noSaving);
  assert.equal(noSaving.mode, "roi");
  if (noSaving.mode !== "roi") return;
  assert.equal(noSaving.payback.kind, "no-payback");
  assert.equal(noSaving.netBenefit, null);
  assert.equal(noSaving.roiFraction, null);
  // The saving itself is still reported — it is the reason there is no return.
  assert.ok(noSaving.monthlySaving < 0);

  const profitable = calculateRoi(internalOnly);
  assert.ok(profitable);
  assert.equal(profitable.mode, "roi");
  if (profitable.mode !== "roi") return;
  assert.equal(profitable.netBenefit, 34940);
  assert.ok(profitable.roiFraction !== null && profitable.roiFraction > 0);
});

test("payback reports beyond-horizon rather than a silly number, and still hides ROI figures", () => {
  // Saving of $15/mo against an $8,800 build is ~587 months, so
  // netBenefit = 15 * 36 - 8800 = -8260: negative despite monthlySaving > 0.
  const result = calculateRoi({ ...internalOnly, currentMonthlySpend: 600 });
  assert.ok(result);
  assert.equal(result.mode, "roi");
  if (result.mode !== "roi") return;
  assert.equal(result.payback.kind, "beyond-horizon");
  assert.ok(result.monthlySaving > 0);
  assert.equal(result.netBenefit, null);
  assert.equal(result.roiFraction, null);
});

test("percentOfAgency is the public headline and is under 1 in every tier", () => {
  for (const employees of [10, 40, 500]) {
    const result = calculateRoi({ ...internalOnly, employees });
    assert.ok(result);
    assert.ok(
      result.percentOfAgency > 0 && result.percentOfAgency < 1,
      `expected a fraction under 1, got ${result.percentOfAgency}`,
    );
  }
});

test("EXACT: internal-only fixture pins roiFraction and percentOfAgency to the spec's figures", () => {
  // Math.round(x * 100) rather than a float comparison so a typo in a
  // config constant fails this test instead of shipping a wrong headline.
  const result = calculateRoi(internalOnly);
  assert.ok(result);
  assert.equal(result.mode, "roi");
  assert.equal(Math.round((result.percentOfAgency ?? 0) * 100), 38);
  if (result.mode !== "roi") return;
  assert.equal(Math.round((result.roiFraction ?? 0) * 100), 397);
});

test("EXACT: internal + web-app selection at 5,000 external users pins percentOfAgency to 55%", () => {
  const result = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "hris", "web"],
    externalUsers: 5000,
  });
  assert.ok(result);
  assert.equal(result.mode, "agency");
  assert.equal(Math.round((result.percentOfAgency ?? 0) * 100), 55);
});

test("percentOfAgency is null once the tier rate reaches the agency benchmark", () => {
  // A benchmark this low puts every tier's rate at or above it.
  const crampedConfig: RoiConfig = { ...ROI_CONFIG, agencyMonthly: 1 };
  const result = calculateRoi(internalOnly, crampedConfig);
  assert.ok(result);
  assert.equal(result.percentOfAgency, null);
});

test("agencyShareRange returns both band endpoints as fractions between 0 and 1", () => {
  const range = agencyShareRange();
  assert.ok(range);
  assert.ok(range.min > 0 && range.min < 1, `expected min in (0,1), got ${range.min}`);
  assert.ok(range.max > 0 && range.max < 1, `expected max in (0,1), got ${range.max}`);
  assert.ok(range.min <= range.max);
});

test("agencyShareRange returns null when the agency benchmark is zero, rather than Infinity", () => {
  const zeroBenchmark: RoiConfig = { ...ROI_CONFIG, agencyMonthly: 0 };
  assert.equal(agencyShareRange(zeroBenchmark), null);
});

test("REGRESSION: a mixed pick never reports negative ROI to a visitor", () => {
  // Combining the paths produced -201% ROI: the external product's scale
  // inflated running cost, which was then charged against internal savings.
  // The gate must keep that number away from the panel entirely.
  const result = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "hris", "web"],
  });
  assert.ok(result);
  assert.equal(result.mode, "agency");
  assert.ok(!("roiFraction" in result));
});

test("a non-finite employee count can never produce NaN output", () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    const result = calculateRoi({ ...internalOnly, employees: bad });
    assert.ok(result);
    assert.ok(Number.isFinite(result.newMonthly), `newMonthly not finite for ${bad}`);
    assert.ok(Number.isFinite(result.percentOfAgency), `percentOfAgency not finite for ${bad}`);
    if (result.mode !== "roi") continue;
    assert.ok(Number.isFinite(result.monthlySaving), `monthlySaving not finite for ${bad}`);
    assert.ok(Number.isFinite(result.netBenefit), `netBenefit not finite for ${bad}`);
    assert.ok(Number.isFinite(result.roiFraction), `roiFraction not finite for ${bad}`);
    if (result.payback.kind === "months") {
      assert.ok(Number.isFinite(result.payback.months), `payback not finite for ${bad}`);
    }
  }
});

test("a non-finite spend or external user count cannot produce NaN output", () => {
  const spend = calculateRoi({ ...internalOnly, currentMonthlySpend: Number.NaN });
  assert.ok(spend);
  assert.equal(spend.mode, "agency"); // NaN spend coerces to 0, so no spend to replace
  assert.ok(Number.isFinite(spend.newMonthly));

  const users = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "web"],
    externalUsers: Number.NaN,
  });
  assert.ok(users);
  assert.ok(Number.isFinite(users.newMonthly));
  assert.ok(Number.isFinite(users.percentOfAgency));
});

import { formatUsd, formatPercent, formatPayback } from "./roi.ts";

test("formatUsd renders whole dollars with separators", () => {
  assert.equal(formatUsd(585), "$585");
  assert.equal(formatUsd(1215), "$1,215");
  assert.equal(formatUsd(34940), "$34,940");
});

test("formatUsd rounds rather than showing cents", () => {
  assert.equal(formatUsd(1214.6), "$1,215");
});

test("formatPercent renders a fraction as a whole percentage", () => {
  assert.equal(formatPercent(0.5486), "55%");
  assert.equal(formatPercent(0.3771), "38%");
});

test("formatPayback turns each guard into a sentence", () => {
  assert.equal(formatPayback({ kind: "months", months: 7.24 }), "7 months");
  assert.equal(formatPayback({ kind: "months", months: 1.2 }), "1 month");
  assert.equal(formatPayback({ kind: "no-payback" }), "No payback at this spend");
  assert.equal(formatPayback({ kind: "beyond-horizon" }), "Beyond 3 years");
});
