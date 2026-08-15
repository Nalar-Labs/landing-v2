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
