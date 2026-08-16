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

test("hostingMonthly is the base until per-user overtakes it, then tapers", () => {
  assert.equal(hostingMonthly(10), 25);
  assert.equal(hostingMonthly(40), 25);
  assert.equal(hostingMonthly(100), 30);
  assert.equal(hostingMonthly(500), 150);
  // Beyond the 500-user taper, extra users bill at the cheaper rate.
  assert.equal(hostingMonthly(5000), 195);
  assert.equal(hostingMonthly(10000), 245);
});

test("hostingMonthly never jumps at a band edge", () => {
  // The banded model this replaced tripled between 100 and 101 users.
  const at100 = hostingMonthly(100);
  const at101 = hostingMonthly(101);
  assert.ok(at101 - at100 < 1, `expected a smooth step, got ${at100} -> ${at101}`);
});

test("maintenanceMonthly scales with apps and audience", () => {
  // Per-app hours by tier, no users: near-pure-infra upkeep.
  assert.equal(maintenanceMonthly("Low", 1, 0), 0.5 * 35);
  assert.equal(maintenanceMonthly("Medium", 2, 0), 1.5 * 35);
  assert.equal(maintenanceMonthly("High", 1, 0), 2 * 35);
  // Audience adds 0.5h per 1,000 users: the 10k-user calibration point
  // commits 2 + 5 = 7 hours.
  assert.equal(maintenanceMonthly("High", 1, 10000), 7 * 35);
  assert.equal(Math.round(maintenanceMonthly("High", 7, 1000)), Math.round(14.5 * 35));
});

test("selectionWeight sums weights, filtered by kind", () => {
  const picked = ["workflow", "hris", "web"];
  assert.equal(selectionWeight(picked, "internal"), 2.5);
  assert.equal(selectionWeight(picked, "external"), 3.5);
  assert.equal(selectionWeight(picked, "all"), 6);
});

test("selectionWeight ignores unknown ids", () => {
  assert.equal(selectionWeight(["workflow", "not-a-real-app"], "all"), 1);
});

test("selectionWeight of an empty selection is zero", () => {
  assert.equal(selectionWeight([], "all"), 0);
});

test("buildMonths: raw months track weight at Low tier, base covers the first unit", () => {
  assert.equal(buildMonths(0, "Low"), 0);
  assert.equal(buildMonths(1, "Low"), 1);
  assert.equal(buildMonths(2, "Low"), 2);
  assert.equal(buildMonths(3, "Low"), 3);
  assert.equal(buildMonths(5, "Low"), 5);
});

test("buildMonths stretches with tier and always rounds up for display", () => {
  // 2.5 weight at Medium: 2.5 x 1.15 = 2.875 -> never promise the shorter
  // month, so 3.
  assert.equal(buildMonths(2.5, "Medium"), 3);
  // CALIBRATION PIN: one web app (3.5) at High = 3.5 x 1.5 = 5.25 -> 6
  // months — the real delivered project (10k users, six months).
  assert.equal(buildMonths(3.5, "High"), 6);
  // The multiplier may never make a bigger tier faster than a smaller one.
  assert.ok(buildMonths(4, "High") >= buildMonths(4, "Low"));
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
  // workflow (1.0) + hris (1.5) = 2.5 weight at Medium: raw 2.5 x 1.15 =
  // 2.875 months -> displays 3, but BILLS the raw fraction: ~$12,650.
  const result = calculateRoi(internalOnly);
  assert.ok(result);
  assert.equal(result.mode, "roi");
  assert.equal(result.tier, "Medium");
  assert.equal(result.buildMonths, 3);
  assert.equal(Math.round(result.buildCost), 12650);
  assert.equal(result.ourHourlyRate, 55);
  assert.equal(Math.round(result.agencyHourlyRate), 146);
  // Agency at the same raw scope, 2.5x slower: ceil(2.875 x 2.5) = 8.
  assert.equal(result.agencyBuildMonths, 8);
  assert.equal(result.hostingMonthly, 25);
  // (0.75h x 2 apps + 0.5h x 40/1000 users) x $35 ~= $53.
  assert.equal(Math.round(result.maintenanceMonthly), 53);
  assert.equal(Math.round(result.newMonthly), 78);
  if (result.mode !== "roi") return;
  assert.equal(Math.round(result.monthlySaving), 1722);
  assert.equal(result.payback.kind, "months");
  // ~1,722 x 36 - ~12,650
  assert.equal(Math.round(result.netBenefit ?? 0), 49335);
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
  // hosting 25 + (0.5h x 3 apps + 0.5h x 10/1000) x $35 ~= $53
  assert.equal(Math.round(result.newMonthly), 78);

  const withoutStaleEmployees = calculateRoi({ ...externalOnly, employees: 0 });
  assert.deepEqual(result, withoutStaleEmployees);
});

test("ticking an external app switches to the agency story", () => {
  // workflow (1.0) + hris (1.5) + web (3.5) = 6.0 weight at High (5,000
  // external users are TRUSTED here because web is ticked): 6 x 1.5 = 9 months.
  const result = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "hris", "web"],
  });
  assert.ok(result);
  assert.equal(result.mode, "agency");
  assert.equal(result.tier, "High");
  assert.equal(result.buildMonths, 9);
  // Tapered hosting: 150 + 0.01 x 4,500 = 195.
  assert.equal(result.hostingMonthly, 195);
  // (2h x 3 apps + 0.5h x 5) x $35 = 297.5 -> ~493 all-in.
  assert.equal(Math.round(result.newMonthly), 493);
  if (result.mode !== "agency") return;
  // Split-by-path: the 2 internal tools replace $1,800 SaaS against an
  // employees-sized run cost (~$78), so the saving survives the mixed pick.
  assert.equal(Math.round(result.internalMonthlySaving ?? 0), 1722);
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
  const result = calculateRoi({ ...internalOnly, currentMonthlySpend: 50 });
  assert.ok(result);
  assert.equal(result.mode, "roi");
  if (result.mode !== "roi") return;
  assert.ok(result.monthlySaving < 0);
  assert.equal(result.payback.kind, "no-payback");
  assert.equal(result.netBenefit, null);
  assert.equal(result.roiFraction, null);
});

test("ROI figures are null with no net saving, and populated when profitable", () => {
  const noSaving = calculateRoi({ ...internalOnly, currentMonthlySpend: 50 });
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
  assert.equal(Math.round(profitable.netBenefit ?? 0), 49335);
  assert.ok(profitable.roiFraction !== null && profitable.roiFraction > 0);
});

test("payback reports beyond-horizon rather than a silly number, and still hides ROI figures", () => {
  // Saving of ~$222/mo against a ~$12,650 build is ~57 months (> 36), so
  // netBenefit = ~222 * 36 - 12,650 ~= -4,665: negative despite monthlySaving > 0.
  const result = calculateRoi({ ...internalOnly, currentMonthlySpend: 300 });
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
  // ~49,335 net over a ~12,650 build. Grounded by the 2026-08-16 calibration
  // to delivered projects rather than the launch model's guesses.
  assert.equal(Math.round((result.roiFraction ?? 0) * 100), 390);
});

test("EXACT: internal + web-app selection at 5,000 external users pins percentOfAgency to 43%", () => {
  const result = calculateRoi({
    ...internalOnly,
    selectedAppIds: ["workflow", "hris", "web"],
    externalUsers: 5000,
  });
  assert.ok(result);
  assert.equal(result.mode, "agency");
  // High tier $5,000/mo against the $11,666.67 benchmark.
  assert.equal(Math.round((result.percentOfAgency ?? 0) * 100), 43);
});

test("CALIBRATION: the delivered web app — 10k users, 6 months, $5k/mo, ~$500/mo to run", () => {
  const result = calculateRoi({
    selectedAppIds: ["web"],
    employees: 0,
    paysForSoftware: false,
    currentMonthlySpend: 0,
    externalUsers: 10000,
  });
  assert.ok(result);
  assert.equal(result.mode, "agency");
  assert.equal(result.tier, "High");
  assert.equal(result.buildMonths, 6);
  assert.equal(result.ourHourlyRate, 62.5);
  // hosting 245 + upkeep (2h + 0.5h x 10) x $35 = 245 -> 490 ~= the real $500.
  assert.equal(Math.round(result.newMonthly), 490);
});

test("CALIBRATION: a single internal tool for 100 employees runs on ~$60/mo and pays back within a year", () => {
  const result = calculateRoi({
    selectedAppIds: ["workflow"],
    employees: 100,
    paysForSoftware: true,
    currentMonthlySpend: 600,
    externalUsers: 0,
  });
  assert.ok(result);
  assert.equal(result.mode, "roi");
  // hosting 30 + (0.75h + 0.5h x 0.1) x $35 = 28 -> $58/mo ~= one t3.large.
  assert.equal(Math.round(result.newMonthly), 58);
  if (result.mode !== "roi") return;
  assert.equal(result.payback.kind, "months");
  if (result.payback.kind !== "months") return;
  assert.ok(
    result.payback.months <= 12,
    `expected payback within a year, got ${result.payback.months}`,
  );
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
