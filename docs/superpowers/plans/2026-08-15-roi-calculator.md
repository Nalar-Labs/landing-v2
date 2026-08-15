# ROI Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ROI Calculator section between Hero and Services, turning "what should we build for you?" into a credible savings figure and a booked call.

**Architecture:** A pure, fully-tested calculation model in `src/app/data/` (no React, no Vite APIs, runs under `node --test`), consumed by three presentational components. All numbers are ported from `docs/roi-calculator-config.xlsx` into a single config module, so tuning is a constant change, never a logic change. The result panel resolves into one of two modes — an ROI story or an agency-comparison story — decided entirely by the model, not the view.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v4, shadcn/ui primitives (`select`, `checkbox`, `label`, `input`, `button` — all already present in `src/app/components/ui/`).

**Spec:** [`docs/PRDs/2026-08-15_roi-calculator_PENDING.md`](../../PRDs/2026-08-15_roi-calculator_PENDING.md)

## Global Constraints

- **Never hard-code hex values, font names, or ad-hoc pixel spacing.** Use semantic utilities (`bg-brand`, `bg-surface`, `text-muted-ink`, `border-line`, `rounded-card`, `font-display`) and the `TYPE` / `SECTION` / `CONTAINER` constants from `src/app/lib/layout.ts`.
- **`src/app/data/` must contain no Vite APIs** (no `import.meta.glob`, no asset imports). It has to run under `node --test`.
- **There is no `npm test` script, and no jsdom/RTL/vitest.** Pure-logic tests run per file: `node --test --experimental-strip-types <file>`. Component behaviour is verified manually in the browser. Never claim component test coverage.
- **The Calculate button is black (`bg-ink`), not orange.** One primary orange action per view, and the Hero's `Book a call` already owns it in this viewport.
- **Never render `buildCost` or `agencyEquivalent`.** They are internal-only figures (spec §6). Only `percentOfAgency` may be shown.
- **Whenever the ROI percentage is rendered, the horizon is rendered beside it.**
- **Every input needs a real `<label>`.** Placeholder-as-label is forbidden.
- **Currency is USD only.** `USD` renders as a static prefix, never a selector.
- **Lenis owns wheel events site-wide.** Nothing in this feature is independently scrollable, so no `data-lenis-prevent` is needed — but do not add a scroll container.

## Concurrency warning — another agent is implementing PRD 1

PRD 1 (visual refresh) is being implemented in parallel. It owns these files; **do not edit them except where this plan explicitly says so, in Tasks 7 and 8:**

| File | Owned by | This plan |
|---|---|---|
| `src/styles/theme.css` | PRD 1 | Never touch |
| `src/app/data/content.ts` | PRD 1 | Never touch — calculator copy lives in its own module |
| `src/app/sections/Hero.tsx`, `Services.tsx`, `Footer.tsx` | PRD 1 | Only Task 8, one line |
| `src/app/App.tsx` | PRD 1 (section order) | Only Task 7, one import + one element |

**Tasks 1–6 touch only new files** and can land at any time, in any order relative to PRD 1.

**PRD 1 dependency.** This section is a white card on a `#f2f2f2` page. If PRD 1's surface inversion has not landed, the card will look wrong (white on white) — that is expected and not a bug in this work. Tasks 1–6 are unaffected; verify appearance only after PRD 1 lands.

**Staging discipline.** Another agent is committing in this repo. **Never run `git add -A` or `git add .`** — every commit step below names its exact files.

---

### Task 1: Config module ported from the workbook

Every number the calculator uses, in one file, with provenance comments. No logic.

**Files:**
- Create: `src/app/data/roi-config.ts`
- Test: `src/app/data/roi-config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: types `Tier`, `AppKind`, `CatalogApp`, `TierRate`, `RoiConfig`; the constant `ROI_CONFIG: RoiConfig`.

- [ ] **Step 1: Write the failing test**

The invariant that matters: tier bands are looked up by "largest `fromUsers` not exceeding the user count", which is only correct if they are sorted ascending and start at 1. A mis-ordered edit to this file would silently mis-price every project.

Create `src/app/data/roi-config.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/data/roi-config.test.ts`
Expected: FAIL — `Cannot find module './roi-config.ts'`

- [ ] **Step 3: Write the config module**

Create `src/app/data/roi-config.ts`:

```typescript
// Ported verbatim from docs/roi-calculator-config.xlsx. That workbook is the
// source of truth: change a number there first, then mirror it here.
//
// Provenance (workbook README tab):
//   Tier rates, consulting rate, agency benchmark -> Financial Plan 2026.
//   Maintenance hours -> a commitment we set, priced at the consulting rate.
//   Hosting base + per-user -> a deliberately simple estimate, not an AWS quote.
//   Complexity weights -> all 1.00, i.e. neutral, until someone tunes them.

export type Tier = "Low" | "Medium" | "High";

export type AppKind = "internal" | "external";

export type CatalogApp = {
  id: string;
  label: string;
  kind: AppKind;
  /** 1.00 is neutral. Higher makes this app take proportionally longer. */
  weight: number;
};

export type TierRate = {
  name: Tier;
  hourlyRate: number;
  monthlyRate: number;
  /** Lower bound of the band, inclusive. Bands MUST stay sorted ascending. */
  fromUsers: number;
};

export type RoiConfig = {
  horizonMonths: number;
  agencyMonthly: number;
  consultingHourlyRate: number;
  monthlyHours: number;
  tiers: TierRate[];
  hostingBaseMonthly: number;
  hostingPerUserMonthly: number;
  maintenanceHours: Record<Tier, number>;
  catalog: CatalogApp[];
  timeline: {
    baseMonths: number;
    appsIncludedInBase: number;
    monthsPerAdditionalApp: number;
  };
};

/** 4 billable hours/day x 20 days. */
const MONTHLY_HOURS = 80;

export const ROI_CONFIG: RoiConfig = {
  /** 3-year TCO, the usual software standard. */
  horizonMonths: 36,
  /** $35,000 per 3 months, from the Benchmark row. */
  agencyMonthly: 11666.67,
  /** Discovery / training / maintenance. Average of the $20-50 range. */
  consultingHourlyRate: 35,
  monthlyHours: MONTHLY_HOURS,

  tiers: [
    { name: "Low", hourlyRate: 30, monthlyRate: 30 * MONTHLY_HOURS, fromUsers: 1 },
    { name: "Medium", hourlyRate: 55, monthlyRate: 55 * MONTHLY_HOURS, fromUsers: 26 },
    { name: "High", hourlyRate: 80, monthlyRate: 80 * MONTHLY_HOURS, fromUsers: 101 },
  ],

  // hosting = MAX(base, users x perUser). Deliberately continuous: the banded
  // table this replaced jumped $150 -> $400 between 100 and 101 users.
  hostingBaseMonthly: 25,
  hostingPerUserMonthly: 0.3,

  maintenanceHours: { Low: 8, Medium: 16, High: 24 },

  catalog: [
    { id: "workflow", label: "Workflow Management Tool", kind: "internal", weight: 1 },
    { id: "chat", label: "Internal Chat", kind: "internal", weight: 1 },
    { id: "hris", label: "HRIS", kind: "internal", weight: 1 },
    { id: "payroll", label: "Payroll Management", kind: "internal", weight: 1 },
    { id: "web", label: "Web Application", kind: "external", weight: 1 },
    { id: "mobile", label: "Mobile Application", kind: "external", weight: 1 },
    { id: "desktop", label: "Desktop Application", kind: "external", weight: 1 },
  ],

  // With every weight at 1.00 this is: 2 months for 1-2 apps, +1 month each after.
  timeline: {
    baseMonths: 2,
    appsIncludedInBase: 2,
    monthsPerAdditionalApp: 1,
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/roi-config.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/app/data/roi-config.ts src/app/data/roi-config.test.ts
git commit -m "feat(roi): add calculator config ported from the workbook"
```

---

### Task 2: Tier resolution, hosting, and maintenance

Three small pure lookups. Each is a place a wrong answer silently mis-prices everything downstream, so each gets its own test.

**Files:**
- Create: `src/app/data/roi.ts`
- Test: `src/app/data/roi.test.ts`

**Interfaces:**
- Consumes: `ROI_CONFIG`, `RoiConfig`, `Tier` from Task 1.
- Produces: `resolveTier(users: number, config?: RoiConfig): Tier`, `hostingMonthly(users: number, config?: RoiConfig): number`, `maintenanceMonthly(tier: Tier, config?: RoiConfig): number`.

- [ ] **Step 1: Write the failing test**

Create `src/app/data/roi.test.ts`:

```typescript
// The ROI model is pure logic, so unlike most of this repo it is genuinely
// testable. Guard the band edges and every branch that can reach a visitor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveTier, hostingMonthly, maintenanceMonthly } from "./roi.ts";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: FAIL — `Cannot find module './roi.ts'`

- [ ] **Step 3: Write the lookups**

Create `src/app/data/roi.ts`:

```typescript
import { ROI_CONFIG, type RoiConfig, type Tier } from "./roi-config.ts";

/**
 * The tier band whose `fromUsers` is the largest value not exceeding `users`.
 * Relies on `config.tiers` being sorted ascending — guarded in roi-config.test.ts.
 * Counts below the first band clamp to the first tier rather than returning
 * undefined, so a zero or negative input can never crash the panel.
 */
export function resolveTier(users: number, config: RoiConfig = ROI_CONFIG): Tier {
  let resolved = config.tiers[0];
  for (const tier of config.tiers) {
    if (users >= tier.fromUsers) resolved = tier;
  }
  return resolved.name;
}

/** A small fixed base for the server, plus a per-user amount. Continuous. */
export function hostingMonthly(users: number, config: RoiConfig = ROI_CONFIG): number {
  const scaled = Math.max(0, users) * config.hostingPerUserMonthly;
  return Math.max(config.hostingBaseMonthly, scaled);
}

/** Hours we commit to this tier each month, at our own consulting rate. */
export function maintenanceMonthly(tier: Tier, config: RoiConfig = ROI_CONFIG): number {
  return config.maintenanceHours[tier] * config.consultingHourlyRate;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/app/data/roi.ts src/app/data/roi.test.ts
git commit -m "feat(roi): add tier, hosting, and maintenance lookups"
```

---

### Task 3: Selection weighting and build timeline

Turns a set of ticked app ids into a weighted count and a duration.

**Files:**
- Modify: `src/app/data/roi.ts`
- Test: `src/app/data/roi.test.ts`

**Interfaces:**
- Consumes: `ROI_CONFIG`, `CatalogApp`, `AppKind` from Task 1.
- Produces: `selectionWeight(selectedIds: string[], kind: AppKind | "all", config?: RoiConfig): number`, `buildMonths(totalWeight: number, config?: RoiConfig): number`.

- [ ] **Step 1: Write the failing test**

Append to `src/app/data/roi.test.ts`:

```typescript
import { selectionWeight, buildMonths } from "./roi.ts";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: FAIL — `selectionWeight is not a function` (or an import error)

- [ ] **Step 3: Add the functions**

Append to `src/app/data/roi.ts`:

```typescript
import type { AppKind } from "./roi-config.ts";

/**
 * Sum of complexity weights for the ticked apps, optionally filtered to one
 * kind. Unknown ids are ignored so stale state can never inflate an estimate.
 */
export function selectionWeight(
  selectedIds: string[],
  kind: AppKind | "all",
  config: RoiConfig = ROI_CONFIG,
): number {
  const picked = new Set(selectedIds);
  return config.catalog
    .filter((app) => picked.has(app.id) && (kind === "all" || app.kind === kind))
    .reduce((total, app) => total + app.weight, 0);
}

/**
 * Base duration covers the first `appsIncludedInBase` weighted apps; each
 * weighted app beyond that adds `monthsPerAdditionalApp`. With every weight at
 * 1.00 this is exactly: 2 months for 1-2 apps, +1 month each after.
 */
export function buildMonths(totalWeight: number, config: RoiConfig = ROI_CONFIG): number {
  if (totalWeight <= 0) return 0;
  const { baseMonths, appsIncludedInBase, monthsPerAdditionalApp } = config.timeline;
  const extra = Math.max(0, totalWeight - appsIncludedInBase);
  return baseMonths + extra * monthsPerAdditionalApp;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/app/data/roi.ts src/app/data/roi.test.ts
git commit -m "feat(roi): add selection weighting and build timeline"
```

---

### Task 4: The model — mode gating and every guard

The heart of the feature. Decides which of the two result modes applies, and guarantees no absurd number can reach a visitor.

**Files:**
- Modify: `src/app/data/roi.ts`
- Test: `src/app/data/roi.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: types `Payback`, `RoiInputs`, `RoiOutcome`; function `calculateRoi(inputs: RoiInputs, config?: RoiConfig): RoiOutcome | null`.

- [ ] **Step 1: Write the failing test**

Append to `src/app/data/roi.test.ts`:

```typescript
import { calculateRoi, type RoiInputs } from "./roi.ts";

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
});

test("payback reports beyond-horizon rather than a silly number", () => {
  // Saving of $15/mo against an $8,800 build is ~587 months.
  const result = calculateRoi({ ...internalOnly, currentMonthlySpend: 600 });
  assert.ok(result);
  assert.equal(result.mode, "roi");
  if (result.mode !== "roi") return;
  assert.equal(result.payback.kind, "beyond-horizon");
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: FAIL — `calculateRoi is not a function`

- [ ] **Step 3: Write the model**

Append to `src/app/data/roi.ts`:

```typescript
/** Payback is a sentence as often as it is a number. */
export type Payback =
  | { kind: "months"; months: number }
  | { kind: "no-payback" }
  | { kind: "beyond-horizon" };

export type RoiInputs = {
  selectedAppIds: string[];
  employees: number;
  paysForSoftware: boolean;
  currentMonthlySpend: number;
  externalUsers: number;
};

type RoiCommon = {
  tier: Tier;
  buildMonths: number;
  /** INTERNAL ONLY — never render. */
  buildCost: number;
  /** INTERNAL ONLY — never render. */
  agencyEquivalent: number;
  percentOfAgency: number;
  hostingMonthly: number;
  maintenanceMonthly: number;
  newMonthly: number;
  horizonMonths: number;
};

/**
 * Discriminated so the ROI figures are unreachable in agency mode — the view
 * cannot render a savings number the model did not sanction.
 */
export type RoiOutcome =
  | ({ mode: "agency" } & RoiCommon)
  | ({ mode: "roi" } & RoiCommon & {
      monthlySaving: number;
      payback: Payback;
      netBenefit: number;
      roiFraction: number;
    });

/**
 * Returns null when nothing is selected so the panel shows its resting state.
 *
 * The ROI story is gated to internal-only projects that replace real spend.
 * Combining internal and external lets the external product's user count
 * inflate hosting and maintenance, which then get charged against the internal
 * SaaS savings — turning a bigger, better project into a negative ROI.
 */
export function calculateRoi(
  inputs: RoiInputs,
  config: RoiConfig = ROI_CONFIG,
): RoiOutcome | null {
  const internalWeight = selectionWeight(inputs.selectedAppIds, "internal", config);
  const externalWeight = selectionWeight(inputs.selectedAppIds, "external", config);
  const totalWeight = internalWeight + externalWeight;
  if (totalWeight <= 0) return null;

  // A stale user count in a hidden field must not inflate the tier.
  const scaleUsers = Math.max(
    Math.max(0, inputs.employees),
    externalWeight > 0 ? Math.max(0, inputs.externalUsers) : 0,
  );

  const tier = resolveTier(scaleUsers, config);
  const tierRate = config.tiers.find((entry) => entry.name === tier)!;
  const months = buildMonths(totalWeight, config);

  const hosting = hostingMonthly(scaleUsers, config);
  const maintenance = maintenanceMonthly(tier, config);
  const agencyEquivalent = config.agencyMonthly * months;
  const buildCost = tierRate.monthlyRate * months;

  const common: RoiCommon = {
    tier,
    buildMonths: months,
    buildCost,
    agencyEquivalent,
    percentOfAgency: agencyEquivalent > 0 ? buildCost / agencyEquivalent : 0,
    hostingMonthly: hosting,
    maintenanceMonthly: maintenance,
    newMonthly: hosting + maintenance,
    horizonMonths: config.horizonMonths,
  };

  const spend = Number.isFinite(inputs.currentMonthlySpend)
    ? inputs.currentMonthlySpend
    : 0;
  const qualifiesForRoi =
    internalWeight > 0 && externalWeight === 0 && inputs.paysForSoftware && spend > 0;

  if (!qualifiesForRoi) return { mode: "agency", ...common };

  const monthlySaving = spend - common.newMonthly;
  const netBenefit = monthlySaving * config.horizonMonths - buildCost;

  let payback: Payback;
  if (monthlySaving <= 0) {
    payback = { kind: "no-payback" };
  } else if (buildCost / monthlySaving > config.horizonMonths) {
    payback = { kind: "beyond-horizon" };
  } else {
    payback = { kind: "months", months: buildCost / monthlySaving };
  }

  return {
    mode: "roi",
    ...common,
    monthlySaving,
    payback,
    netBenefit,
    roiFraction: buildCost > 0 ? netBenefit / buildCost : 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: PASS — 19 tests

- [ ] **Step 5: Commit**

```bash
git add src/app/data/roi.ts src/app/data/roi.test.ts
git commit -m "feat(roi): add the model with mode gating and output guards"
```

---

### Task 5: Formatters and calculator copy

Display formatting is pure, so it gets tests too. Copy lives here rather than in `content.ts`, which PRD 1 owns.

**Files:**
- Create: `src/app/data/roi-copy.ts`
- Modify: `src/app/data/roi.ts`
- Test: `src/app/data/roi.test.ts`

**Interfaces:**
- Consumes: `Payback` from Task 4.
- Produces: `formatUsd(value: number): string`, `formatPercent(fraction: number): string`, `formatPayback(payback: Payback): string`; constant `ROI_COPY`.

- [ ] **Step 1: Write the failing test**

Append to `src/app/data/roi.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: FAIL — `formatUsd is not a function`

- [ ] **Step 3: Add formatters and copy**

Append to `src/app/data/roi.ts`:

```typescript
const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Whole dollars. Cents are noise at these magnitudes. */
export function formatUsd(value: number): string {
  return USD.format(Math.round(value));
}

/** A fraction (0.5486) as a whole percentage ("55%"). */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** Never returns a raw number for the guard cases. */
export function formatPayback(payback: Payback): string {
  if (payback.kind === "no-payback") return "No payback at this spend";
  if (payback.kind === "beyond-horizon") return "Beyond 3 years";
  const months = Math.max(1, Math.round(payback.months));
  return `${months} ${months === 1 ? "month" : "months"}`;
}
```

Create `src/app/data/roi-copy.ts`:

```typescript
// Calculator copy. Kept out of content.ts so this feature owns its own strings.
export const ROI_COPY = {
  eyebrow: "ROI Calculator",
  heading: "What would it cost to build your own?",
  buildLabel: "What should we build for you?",
  employeesLabel: "How many employees?",
  paysLabel: "Are you already paying for software?",
  spendLabel: "Your current monthly cost",
  usersLabel: "Expected users",
  calculate: "Calculate",
  recalculate: "Recalculate",
  restingHeadline: "See what you would pay",
  restingBody:
    "Pick what you would like us to build and we will estimate it against typical agency rates.",
  agencyReason: {
    external: "Customer-facing products have no existing software spend to replace.",
    notPaying: "You are not replacing existing software, so there is nothing to save against.",
  },
  ctaLabel: "Book a call",
  disclaimer: "An estimate, not a quote. We confirm the real numbers on the call.",
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/roi.test.ts`
Expected: PASS — 23 tests

- [ ] **Step 5: Commit**

```bash
git add src/app/data/roi.ts src/app/data/roi-copy.ts src/app/data/roi.test.ts
git commit -m "feat(roi): add display formatters and calculator copy"
```

---

### Task 6: Result panel and form components

Presentational only. **No automated coverage exists for these** — verification is manual, in the browser.

**Files:**
- Create: `src/app/components/RoiResult.tsx`
- Create: `src/app/components/RoiForm.tsx`

**Interfaces:**
- Consumes: `RoiOutcome`, formatters from Tasks 4–5; `ROI_COPY` from Task 5; `ROI_CONFIG` from Task 1; `cn`, `TYPE` from `src/app/lib/layout.ts`.
- Produces: `RoiResult({ outcome }: { outcome: RoiOutcome | null })`, `RoiForm({ value, onChange, onCalculate }: RoiFormProps)` and the exported type `RoiFormProps`.

- [ ] **Step 1: Write the result panel**

Create `src/app/components/RoiResult.tsx`:

```tsx
import { cn, TYPE } from "../lib/layout";
import { ROI_COPY } from "../data/roi-copy";
import { formatPayback, formatPercent, formatUsd, type RoiOutcome } from "../data/roi";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-body text-sm text-muted-ink">{label}</dt>
      <dd className="font-display text-2xl tracking-[-0.72px] tabular-nums">{value}</dd>
    </div>
  );
}

export function RoiResult({ outcome }: { outcome: RoiOutcome | null }) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[320px] flex-col justify-center rounded-card bg-surface p-8 md:p-10"
    >
      {outcome === null ? (
        <div className="text-center">
          <p className={cn(TYPE.cardTitle, "mb-3")}>{ROI_COPY.restingHeadline}</p>
          <p className="font-body text-muted-ink">{ROI_COPY.restingBody}</p>
        </div>
      ) : outcome.mode === "roi" ? (
        <>
          <p className="mb-2 font-body text-sm text-muted-ink">Pays for itself in</p>
          <p className="mb-8 font-display text-[56px] leading-none tracking-[-2px] tabular-nums md:text-[72px]">
            {formatPayback(outcome.payback)}
          </p>
          <dl className="grid grid-cols-2 gap-6">
            <Stat label="New monthly cost" value={formatUsd(outcome.newMonthly)} />
            <Stat label="You save" value={`${formatUsd(outcome.monthlySaving)}/mo`} />
            <Stat
              label={`Net over ${outcome.horizonMonths / 12} years`}
              value={formatUsd(outcome.netBenefit)}
            />
            <Stat
              label={`ROI over ${outcome.horizonMonths / 12} years`}
              value={formatPercent(outcome.roiFraction)}
            />
          </dl>
        </>
      ) : (
        <>
          <p className="mb-2 font-body text-sm text-muted-ink">You would pay</p>
          <p className="mb-8 font-display text-[56px] leading-none tracking-[-2px] tabular-nums md:text-[72px]">
            {formatPercent(outcome.percentOfAgency)}
          </p>
          <p className="mb-8 font-body text-muted-ink">of typical agency rates</p>
          <dl className="grid grid-cols-2 gap-6">
            <Stat label="Build time" value={`${outcome.buildMonths} months`} />
            <Stat label="New monthly cost" value={formatUsd(outcome.newMonthly)} />
          </dl>
        </>
      )}

      {/* The conversion point. Orange belongs here rather than on Calculate:
          within this section, booking is the primary action and Calculate is
          the step that leads to it. */}
      {outcome !== null && (
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-brand px-6 py-3 font-body text-white transition-colors hover:bg-brand-hover"
        >
          {ROI_COPY.ctaLabel}
        </a>
      )}

      <p className="mt-8 font-body text-xs text-muted-ink">{ROI_COPY.disclaimer}</p>
    </div>
  );
}
```

`CALENDLY_URL` is imported from `content.ts` — **read-only, no edit to that file**, so it does not conflict with PRD 1. Add it to the imports at the top:

```tsx
import { CALENDLY_URL } from "../data/content";
```

- [ ] **Step 2: Write the form**

Create `src/app/components/RoiForm.tsx`:

```tsx
import { cn } from "../lib/layout";
import { ROI_CONFIG } from "../data/roi-config";
import { ROI_COPY } from "../data/roi-copy";
import type { RoiInputs } from "../data/roi";

export type RoiFormProps = {
  value: RoiInputs;
  onChange: (next: RoiInputs) => void;
  onCalculate: () => void;
};

const FIELD =
  "w-full rounded-xl border border-line bg-white px-4 py-3 font-body outline-none transition-colors focus:border-black";

export function RoiForm({ value, onChange, onCalculate }: RoiFormProps) {
  const set = <K extends keyof RoiInputs>(key: K, next: RoiInputs[K]) =>
    onChange({ ...value, [key]: next });

  const toggleApp = (id: string) =>
    set(
      "selectedAppIds",
      value.selectedAppIds.includes(id)
        ? value.selectedAppIds.filter((entry) => entry !== id)
        : [...value.selectedAppIds, id],
    );

  const hasInternal = ROI_CONFIG.catalog.some(
    (app) => app.kind === "internal" && value.selectedAppIds.includes(app.id),
  );
  const hasExternal = ROI_CONFIG.catalog.some(
    (app) => app.kind === "external" && value.selectedAppIds.includes(app.id),
  );
  const hasAny = value.selectedAppIds.length > 0;

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <fieldset>
        <legend className="mb-4 font-body text-sm text-muted-ink">
          {ROI_COPY.buildLabel}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ROI_CONFIG.catalog.map((app) => {
            const selected = value.selectedAppIds.includes(app.id);
            return (
              <button
                key={app.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleApp(app.id)}
                className={cn(
                  "rounded-full border px-4 py-2 font-body text-sm transition-colors",
                  selected
                    ? "border-black bg-ink text-white"
                    : "border-line bg-white hover:border-black",
                )}
              >
                {app.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Progressive disclosure: only ask what the selection makes relevant. */}
      {hasInternal && (
        <>
          <div>
            <label htmlFor="roi-employees" className="mb-2 block font-body text-sm">
              {ROI_COPY.employeesLabel}
            </label>
            <input
              id="roi-employees"
              type="number"
              min={1}
              inputMode="numeric"
              className={FIELD}
              value={value.employees || ""}
              onChange={(event) => set("employees", Number(event.target.value))}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="roi-pays"
              type="checkbox"
              className="size-5 accent-black"
              checked={value.paysForSoftware}
              onChange={(event) => set("paysForSoftware", event.target.checked)}
            />
            <label htmlFor="roi-pays" className="font-body text-sm">
              {ROI_COPY.paysLabel}
            </label>
          </div>

          {value.paysForSoftware && (
            <div>
              <label htmlFor="roi-spend" className="mb-2 block font-body text-sm">
                {ROI_COPY.spendLabel}
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-surface px-4 py-3 font-body text-sm">USD</span>
                <input
                  id="roi-spend"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={FIELD}
                  value={value.currentMonthlySpend || ""}
                  onChange={(event) =>
                    set("currentMonthlySpend", Number(event.target.value))
                  }
                />
              </div>
            </div>
          )}
        </>
      )}

      {hasExternal && (
        <div>
          <label htmlFor="roi-users" className="mb-2 block font-body text-sm">
            {ROI_COPY.usersLabel}
          </label>
          <input
            id="roi-users"
            type="number"
            min={1}
            inputMode="numeric"
            className={FIELD}
            value={value.externalUsers || ""}
            onChange={(event) => set("externalUsers", Number(event.target.value))}
          />
        </div>
      )}

      {/* Black, not orange: the Hero's Book a call owns the one primary action. */}
      <button
        type="submit"
        disabled={!hasAny}
        className="rounded-full bg-ink px-8 py-4 font-body text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ROI_COPY.calculate}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors. (The components are not mounted yet, so there is nothing to see in the browser until Task 7.)

- [ ] **Step 4: Commit**

```bash
git add src/app/components/RoiResult.tsx src/app/components/RoiForm.tsx
git commit -m "feat(roi): add result panel and progressive-disclosure form"
```

---

### Task 7: Section wrapper and mount

**Files:**
- Create: `src/app/sections/RoiCalculator.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `RoiForm`, `RoiResult`, `calculateRoi`, `ROI_COPY`.
- Produces: `RoiCalculator()` — the section, carrying `id="roi-calculator"`.

> **Merge-conflict warning.** `App.tsx` is also edited by PRD 1's plan (section order, `bg-white` → `bg-page`). If both land, expect a conflict here. Resolve by **keeping both changes**: PRD 1's ordering and background, plus this import and element. Re-run `npm run build` after resolving.

- [ ] **Step 1: Write the section**

Create `src/app/sections/RoiCalculator.tsx`:

```tsx
import { useRef, useState } from "react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { useMediaQuery } from "../lib/use-media-query";
import { RoiForm } from "../components/RoiForm";
import { RoiResult } from "../components/RoiResult";
import { ROI_COPY } from "../data/roi-copy";
import { calculateRoi, type RoiInputs, type RoiOutcome } from "../data/roi";

const EMPTY: RoiInputs = {
  selectedAppIds: [],
  employees: 0,
  paysForSoftware: false,
  currentMonthlySpend: 0,
  externalUsers: 0,
};

export function RoiCalculator() {
  const [inputs, setInputs] = useState<RoiInputs>(EMPTY);
  const [outcome, setOutcome] = useState<RoiOutcome | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Below md the panel stacks under the form, so a result computed off-screen
  // would be invisible. Desktop shows both side by side and must not scroll.
  const isStacked = useMediaQuery("(max-width: 767px)");

  const handleCalculate = () => {
    setOutcome(calculateRoi(inputs));
    if (isStacked) {
      // After paint, so the panel has its resolved height before we scroll.
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  return (
    <section id="roi-calculator" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>{ROI_COPY.heading}</h2>
      <div className="grid grid-cols-1 gap-8 rounded-card bg-white p-8 md:grid-cols-2 md:p-12">
        <RoiForm value={inputs} onChange={setInputs} onCalculate={handleCalculate} />
        <div ref={resultRef}>
          <RoiResult outcome={outcome} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount it in App.tsx**

Add the import alongside the other section imports:

```tsx
import { RoiCalculator } from "./sections/RoiCalculator";
```

and place the element between `<Hero />` and `<Services />`:

```tsx
<main>
  <Hero />
  <RoiCalculator />
  <Services />
  ...
</main>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open `http://localhost:5173`, and check each of these:

1. The section appears between the hero and Key Services.
2. Before any selection: the right panel reads "See what you would pay". Calculate is disabled.
3. Tick **Workflow Management Tool** and **HRIS** → employee and "already paying" fields appear; the expected-users field does **not**.
4. Enter 40 employees, tick "already paying", enter 1800 → Calculate → panel reads **7 months**, new monthly **$585**, saves **$1,215/mo**, net **$34,940**, ROI **397%**.
5. Also tick **Web Application** → the expected-users field appears. Enter 5000 → Calculate → the panel switches to **55%** of agency rates, build time **3 months**. **No savings or ROI figure is shown.**
6. Untick "already paying" with only internal apps selected → Calculate → agency mode again.
7. **No dollar figure for the project cost appears anywhere on screen.** In both modes, the only dollar amounts are the monthly ones — never `$8,800` or `$12,800`.
8. In both modes, an orange **Book a call** button appears in the panel once a result is shown, and opens Calendly in a new tab. It is absent in the resting state.
9. Resize to 375px: the form and panel stack, and every tap target is comfortably large.
10. Still at 375px, scroll so the panel is off-screen, then tap Calculate → the page scrolls the result into view. Repeat at 1440px → the page must **not** scroll, since both columns are already visible.

- [ ] **Step 4: Commit**

```bash
git add src/app/sections/RoiCalculator.tsx src/app/App.tsx
git commit -m "feat(roi): mount the calculator between hero and services"
```

---

### Task 8: Un-gate the Services chip

**Blocked on PRD 1.** PRD 1 §9 requires the `Use Nalar ROI calculator →` chip to stay unlinked until this section exists. It now exists.

**Files:**
- Modify: `src/app/sections/Services.tsx`

**Interfaces:**
- Consumes: the `#roi-calculator` anchor from Task 7.
- Produces: nothing.

- [ ] **Step 1: Check whether PRD 1 has landed**

Run: `grep -n "roi-calculator" src/app/sections/Services.tsx`

- If it prints nothing, **PRD 1's Services work has not landed yet. Stop — skip this task** and leave it for whoever finishes PRD 1. The feature is complete without it.
- If it prints a line, continue.

- [ ] **Step 2: Point the chip at the section**

PRD 1 builds this chip, so its exact markup is not knowable from here. Find the `Use Nalar ROI calculator` element in `src/app/sections/Services.tsx` and give it a live `href`, changing nothing else — not its classes, not its text.

If PRD 1 rendered it as a non-navigating element:

```tsx
<span className={CHIP_CLASSES}>Use Nalar ROI calculator →</span>
```

it becomes:

```tsx
<a href="#roi-calculator" className={CHIP_CLASSES}>
  Use Nalar ROI calculator →
</a>
```

If PRD 1 already rendered an `<a>` with a placeholder `href` (`"#"`), change only that attribute to `"#roi-calculator"`.

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, click the chip in Key Services.
Expected: the page scrolls smoothly up to the calculator section. (Lenis handles the smooth scroll; no extra configuration needed.)

- [ ] **Step 4: Commit**

```bash
git add src/app/sections/Services.tsx
git commit -m "feat(roi): link the services chip to the calculator"
```

---

## Definition of done

- [ ] `node --test --experimental-strip-types src/app/data/roi-config.test.ts` passes (5 tests)
- [ ] `node --test --experimental-strip-types src/app/data/roi.test.ts` passes (23 tests)
- [ ] `npm run build` succeeds
- [ ] All eight browser checks in Task 7 Step 3 pass
- [ ] No project cost or hourly rate is rendered anywhere in the UI
- [ ] The ROI percentage never appears without its horizon beside it

**Not covered, and must not be claimed:** the form, the two result modes, and the mobile stacking have no automated tests — this repo has no jsdom/RTL/vitest. Only the model in `src/app/data/` is covered.
