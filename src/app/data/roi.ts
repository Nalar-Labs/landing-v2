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

/**
 * A small fixed base for the server, plus a per-user amount that tapers:
 * seats are a fair infra proxy for a 100-person tool and a poor one at 10k
 * users, so users beyond the taper point bill at the cheaper rate.
 * Continuous everywhere — no cliffs.
 */
export function hostingMonthly(users: number, config: RoiConfig = ROI_CONFIG): number {
  const count = Math.max(0, users);
  const taper = config.hostingTaperAfterUsers;
  const scaled =
    count <= taper
      ? count * config.hostingPerUserMonthly
      : taper * config.hostingPerUserMonthly +
        (count - taper) * config.hostingPerUserBeyondMonthly;
  return Math.max(config.hostingBaseMonthly, scaled);
}

/**
 * Monthly upkeep priced at our consulting rate: a small commitment per app
 * plus load that tracks audience size. Calibrated to delivered work — an
 * internal tool runs on near-pure infra; a 10k-user product needs real ops.
 */
export function maintenanceMonthly(
  tier: Tier,
  appCount: number,
  users: number,
  config: RoiConfig = ROI_CONFIG,
): number {
  const hours =
    config.maintenanceHoursPerApp[tier] * Math.max(0, appCount) +
    config.maintenanceHoursPerThousandUsers * (Math.max(0, users) / 1000);
  return hours * config.consultingHourlyRate;
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
 * Raw fractional months: base covers the first `appsIncludedInBase` units of
 * weight, each unit beyond adds `monthsPerAdditionalApp`, and the tier
 * multiplier stretches the total (bigger audience = hardening, migration,
 * rollout). The BUILD COST bills this raw figure; the calendar shown to the
 * visitor is `buildMonths`, which rounds up and never promises the shorter
 * month. Billing raw is what keeps a small tool's payback honest — a
 * 1.15-month build costs 1.15 months, not 2.
 */
export function buildMonthsRaw(
  totalWeight: number,
  tier: Tier,
  config: RoiConfig = ROI_CONFIG,
): number {
  if (totalWeight <= 0) return 0;
  const { baseMonths, appsIncludedInBase, monthsPerAdditionalApp, tierMonthsMultiplier } =
    config.timeline;
  const extra = Math.max(0, totalWeight - appsIncludedInBase);
  return (baseMonths + extra * monthsPerAdditionalApp) * tierMonthsMultiplier[tier];
}

/** Calendar months shown to the visitor — raw, rounded up. */
export function buildMonths(
  totalWeight: number,
  tier: Tier,
  config: RoiConfig = ROI_CONFIG,
): number {
  return Math.ceil(buildMonthsRaw(totalWeight, tier, config));
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
  /** What the same scope takes an agency, in calendar months. PUBLIC. */
  agencyBuildMonths: number;
  /** INTERNAL ONLY — never render. Bills raw fractional months. */
  buildCost: number;
  /** INTERNAL ONLY — never render. */
  agencyEquivalent: number;
  /**
   * PUBLIC hourly team rates (owner decision 2026-08-16, partially reversing
   * PRD §6): the tier's hourly rate and the agency benchmark's hourly
   * equivalent (benchmark / monthly hours) may be shown side by side.
   * Project totals (buildCost, agencyEquivalent) stay internal.
   */
  ourHourlyRate: number;
  agencyHourlyRate: number;
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
  | ({
      mode: "agency";
      reason: "external" | "not-paying";
      /**
       * SaaS spend replaced by the INTERNAL tools in a mixed selection,
       * against a running cost sized by employees only — the §4 "split by
       * path" model, adopted for display 2026-08-16. Null unless internal
       * apps are ticked, real spend exists, and the saving is positive
       * (never render a negative saving).
       */
      internalMonthlySaving: number | null;
    } & RoiCommon)
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
  const rawMonths = buildMonthsRaw(totalWeight, tier, config);
  const months = Math.ceil(rawMonths);

  // Maintenance scales with the count of ticked apps, not their weights: the
  // commitment is "hours per app", which survives a call unlike a weighted sum.
  const picked = new Set(inputs.selectedAppIds);
  const appCount = config.catalog.filter((app) => picked.has(app.id)).length;

  const hosting = hostingMonthly(scaleUsers, config);
  const maintenance = maintenanceMonthly(tier, appCount, scaleUsers, config);
  // Both sides bill the raw fraction so the comparison stays apples-to-apples.
  const agencyEquivalent = config.agencyMonthly * rawMonths;
  const buildCost = tierRate.monthlyRate * rawMonths;

  const agencyShare = agencyEquivalent > 0 ? buildCost / agencyEquivalent : 0;

  const common: RoiCommon = {
    tier,
    buildMonths: months,
    agencyBuildMonths: Math.ceil(rawMonths * config.agencyMonthsMultiplier),
    buildCost,
    agencyEquivalent,
    ourHourlyRate: tierRate.hourlyRate,
    agencyHourlyRate: config.agencyMonthly / config.monthlyHours,
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
    // §4 split-by-path, display only: what the INTERNAL share of a mixed
    // selection saves, sized by employees so the external audience cannot
    // inflate the running cost charged against SaaS savings.
    const employees = internalWeight > 0 ? finiteNonNegative(inputs.employees) : 0;
    const internalAppCount = config.catalog.filter(
      (app) => picked.has(app.id) && app.kind === "internal",
    ).length;
    const internalTier = resolveTier(employees, config);
    const internalRunMonthly =
      hostingMonthly(employees, config) +
      maintenanceMonthly(internalTier, internalAppCount, employees, config);
    const rawInternalSaving = spend - internalRunMonthly;
    const internalMonthlySaving =
      internalWeight > 0 && inputs.paysForSoftware && spend > 0 && rawInternalSaving > 0
        ? rawInternalSaving
        : null;

    return {
      mode: "agency",
      reason: externalWeight > 0 ? "external" : "not-paying",
      internalMonthlySaving,
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
