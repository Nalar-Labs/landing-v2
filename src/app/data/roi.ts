import { ROI_CONFIG, type RoiConfig, type Tier, type AppKind } from "./roi-config.ts";

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
  /**
   * Null when the tier rate is at or above the agency benchmark (share >= 1).
   * Printing "112% of typical agency rates" would be worse than printing
   * nothing, so the view must omit the headline rather than show a number
   * that undercuts the pitch.
   */
  percentOfAgency: number | null;
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
  | ({ mode: "agency"; reason: "external" | "not-paying" } & RoiCommon)
  | ({ mode: "roi" } & RoiCommon & {
      monthlySaving: number;
      payback: Payback;
      /**
       * Null unless the project actually returns more than it costs within
       * the horizon — i.e. only when `netBenefit > 0`. `netBenefit` is
       * negative for a whole band of positive `monthlySaving` values (any
       * saving smaller than `buildCost / horizonMonths`), so gating on this
       * figure rather than on `monthlySaving` is the only way to honour the
       * owner's rule: never show a negative ROI number. `monthlySaving`
       * still carries the (possibly negative) reason even when this is null.
       */
      netBenefit: number | null;
      /** Null exactly when `netBenefit` is null, for the same reason. */
      roiFraction: number | null;
    });

/**
 * Coerce a user-supplied number to a usable non-negative value.
 * `Math.max(0, NaN)` is NaN, so clamping alone would let a non-finite input
 * slip past every downstream guard and render "NaN months" to a visitor.
 */
function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

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

  // A stale hidden-field value must not inflate the tier: `employees` only
  // renders when an internal app is ticked, and `externalUsers` only when an
  // external app is ticked, so each is only trusted when its field is visible.
  const scaleUsers = Math.max(
    internalWeight > 0 ? finiteNonNegative(inputs.employees) : 0,
    externalWeight > 0 ? finiteNonNegative(inputs.externalUsers) : 0,
  );

  const tier = resolveTier(scaleUsers, config);
  const tierRate = config.tiers.find((entry) => entry.name === tier)!;
  const months = buildMonths(totalWeight, config);

  const hosting = hostingMonthly(scaleUsers, config);
  const maintenance = maintenanceMonthly(tier, config);
  const agencyEquivalent = config.agencyMonthly * months;
  const buildCost = tierRate.monthlyRate * months;

  const agencyShare = agencyEquivalent > 0 ? buildCost / agencyEquivalent : 0;

  const common: RoiCommon = {
    tier,
    buildMonths: months,
    buildCost,
    agencyEquivalent,
    percentOfAgency: agencyShare >= 1 ? null : agencyShare,
    hostingMonthly: hosting,
    maintenanceMonthly: maintenance,
    newMonthly: hosting + maintenance,
    horizonMonths: config.horizonMonths,
  };

  const spend = finiteNonNegative(inputs.currentMonthlySpend);
  const qualifiesForRoi =
    internalWeight > 0 && externalWeight === 0 && inputs.paysForSoftware && spend > 0;

  if (!qualifiesForRoi) {
    return {
      mode: "agency",
      reason: externalWeight > 0 ? "external" : "not-paying",
      ...common,
    };
  }

  const monthlySaving = spend - common.newMonthly;

  let payback: Payback;
  if (monthlySaving <= 0) {
    payback = { kind: "no-payback" };
  } else if (buildCost / monthlySaving > config.horizonMonths) {
    payback = { kind: "beyond-horizon" };
  } else {
    payback = { kind: "months", months: buildCost / monthlySaving };
  }

  const rawNetBenefit = monthlySaving * config.horizonMonths - buildCost;
  const netBenefit = rawNetBenefit > 0 ? rawNetBenefit : null;
  const roiFraction =
    netBenefit === null ? null : buildCost > 0 ? netBenefit / buildCost : 0;

  return {
    mode: "roi",
    ...common,
    monthlySaving,
    payback,
    netBenefit,
    roiFraction,
  };
}

/**
 * Cheapest and dearest tier as a share of the agency benchmark. Public — it is
 * a ratio, not a rate.
 *
 * Null when the benchmark is zero or missing — dividing by it would render
 * "Infinity%" in the resting-state teaser, so the caller must omit that
 * sentence rather than print a nonsense range.
 */
export function agencyShareRange(
  config: RoiConfig = ROI_CONFIG,
): { min: number; max: number } | null {
  if (config.agencyMonthly <= 0) return null;
  const shares = config.tiers.map((tier) => tier.monthlyRate / config.agencyMonthly);
  return { min: Math.min(...shares), max: Math.max(...shares) };
}

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
