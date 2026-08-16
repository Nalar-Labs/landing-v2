// Ported from docs/roi-calculator-config.xlsx. That workbook is the source of
// truth: change a number there first, then mirror it here.
//
// AHEAD OF THE WORKBOOK (2026-08-16): complexity weights, per-app maintenance
// hours, and the tier timeline multiplier were tuned in code first (owner asked
// for less optimistic estimates). Re-sync the workbook before the next tuning
// pass. Reasoning recorded in docs/PRDs/2026-08-16_roi-calculator_PENDING.md.
//
// Provenance (workbook README tab):
//   Tier rates, consulting rate, agency benchmark -> Financial Plan 2026.
//   Maintenance hours -> a commitment we set, priced at the consulting rate.
//   Hosting base + per-user -> a deliberately simple estimate, not an AWS quote.
//   Complexity weights -> relative build effort, workflow tool = 1.00 baseline.

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
  /** Users beyond this count are billed at the cheaper beyond-rate. */
  hostingTaperAfterUsers: number;
  hostingPerUserBeyondMonthly: number;
  /** Monthly upkeep hours per ticked app, by tier. */
  maintenanceHoursPerApp: Record<Tier, number>;
  /** Extra upkeep hours per 1,000 users — ops load tracks audience size. */
  maintenanceHoursPerThousandUsers: number;
  catalog: CatalogApp[];
  timeline: {
    baseMonths: number;
    appsIncludedInBase: number;
    monthsPerAdditionalApp: number;
    /**
     * Scale (users) stretches the timeline: hardening, migration, SSO and
     * rollout all grow with the audience even when the feature list doesn't.
     */
    tierMonthsMultiplier: Record<Tier, number>;
  };
  /** Agencies ship the same scope this many times slower. Judgement figure. */
  agencyMonthsMultiplier: number;
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
    // High calibrated 2026-08-16 to a real delivered project (web app, 10k
    // users, billed $5,000/mo) — also the rate on the current retainer. The
    // Financial Plan's $80/hr aspiration lost to the rate actually charged.
    { name: "High", hourlyRate: 62.5, monthlyRate: 62.5 * MONTHLY_HOURS, fromUsers: 101 },
  ],

  // hosting = MAX(base, tapered per-user). Deliberately continuous: the banded
  // table this replaced jumped $150 -> $400 between 100 and 101 users. The
  // taper (full rate to 500 users, a third beyond) exists because seats are a
  // decent infra proxy for a 100-person tool and a terrible one at 10k users.
  hostingBaseMonthly: 25,
  hostingPerUserMonthly: 0.3,
  hostingTaperAfterUsers: 500,
  hostingPerUserBeyondMonthly: 0.01,

  // Calibrated 2026-08-16 to two real data points: a 10k-user web app runs on
  // ~$500/mo all-in (hosting 245 + 7h upkeep = 490 here), and a 100-employee
  // internal tool on ~$60/mo — "just a t3.large" (hosting 30 + 0.8h = 58).
  // AI-era ops are near-pure infra for internal tools; audience adds load.
  maintenanceHoursPerApp: { Low: 0.5, Medium: 0.75, High: 2 },
  maintenanceHoursPerThousandUsers: 0.5,

  // Weights are relative build effort against the workflow tool (1.00).
  // Payroll and HRIS carry compliance and data-migration weight; mobile carries
  // store review and platform duplication; chat carries realtime infra.
  // External weights calibrated against the same delivered project: one web
  // app at High tier must come out at 6 months (2 + 1.5 extra, x1.5, ceil).
  // Customer-facing products are multi-month builds in their own right.
  catalog: [
    { id: "workflow", label: "Workflow Management Tool", kind: "internal", weight: 1 },
    { id: "chat", label: "Internal Chat", kind: "internal", weight: 1.25 },
    { id: "hris", label: "HRIS", kind: "internal", weight: 1.5 },
    { id: "payroll", label: "Payroll Management", kind: "internal", weight: 1.75 },
    { id: "web", label: "Web Application", kind: "external", weight: 3.5 },
    { id: "mobile", label: "Mobile Application", kind: "external", weight: 4 },
    { id: "desktop", label: "Desktop Application", kind: "external", weight: 3 },
  ],

  // Base 1 month covers the first 1.0 of weight, so raw months ~= total
  // weight: a weight-1.0 tool is a month of work at small scale. The tier
  // multiplier stretches that with audience size. Display rounds UP; the
  // BUILD COST bills the raw fraction — a 1.15-month tool costs 1.15 months,
  // not 2 (this is what puts small-tool payback inside a year).
  timeline: {
    baseMonths: 1,
    appsIncludedInBase: 1,
    monthsPerAdditionalApp: 1,
    tierMonthsMultiplier: { Low: 1, Medium: 1.15, High: 1.5 },
  },
  agencyMonthsMultiplier: 2.5,
};
