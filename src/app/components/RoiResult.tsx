import { cn, TYPE } from "../lib/layout";
import { ROI_COPY } from "../data/roi-copy";
import { CALENDLY_URL } from "../data/content";
import {
  agencyShareRange,
  formatPayback,
  formatPercent,
  formatUsd,
  type RoiInputs,
  type RoiOutcome,
} from "../data/roi";
import { QuoteDialog } from "./QuoteDialog";

const AGENCY_RANGE = agencyShareRange();
// Null when the agency benchmark is zero or missing — omit the teaser rather
// than print a range built from a divide-by-zero.
const RESTING_RANGE_TEASER =
  AGENCY_RANGE === null
    ? null
    : ROI_COPY.restingRangeTeaser
        .replace("{min}", formatPercent(AGENCY_RANGE.min))
        .replace("{max}", formatPercent(AGENCY_RANGE.max));

// Keyed by `RoiOutcome`'s `reason` union so a new reason value fails to
// compile here instead of silently falling through to the wrong sentence.
const AGENCY_REASON_COPY: Record<"external" | "not-paying", string> = {
  external: ROI_COPY.agencyReason.external,
  "not-paying": ROI_COPY.agencyReason.notPaying,
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-body text-sm text-muted-ink">{label}</dt>
      <dd className="font-display text-2xl tracking-[-0.72px] tabular-nums">{value}</dd>
    </div>
  );
}

export function RoiResult({
  outcome,
  inputs,
}: {
  outcome: RoiOutcome | null;
  /** Calculator state, forwarded with a quote request (owner requirement). */
  inputs: RoiInputs;
}) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[320px] flex-col justify-center rounded-card bg-page p-8 md:p-10"
    >
      {outcome === null ? (
        <div className="text-center">
          <p className={cn(TYPE.cardTitle, "mb-3")}>{ROI_COPY.restingHeadline}</p>
          <p className="mb-3 font-body text-muted-ink">{ROI_COPY.restingBody}</p>
          {/* The resting state must never be a blank box — a teaser of the
              agency comparison stands in until the visitor picks apps. Omitted
              entirely when the benchmark can't produce a real range. */}
          {RESTING_RANGE_TEASER !== null && (
            <p className="font-body text-sm text-muted-ink">{RESTING_RANGE_TEASER}</p>
          )}
        </div>
      ) : outcome.mode === "roi" ? (
        <>
          <p className="mb-2 font-body text-sm text-muted-ink">
            {outcome.payback.kind === "months"
              ? ROI_COPY.paybackLabel
              : ROI_COPY.paybackLabelFallback}
          </p>
          <p className="mb-8 font-display text-[56px] leading-none tracking-[-2px] tabular-nums md:text-[72px]">
            {formatPayback(outcome.payback)}
          </p>
          <dl className="grid grid-cols-2 gap-6">
            <Stat
              label="Est. Cost to run & maintain"
              value={`${formatUsd(outcome.newMonthly)}/mo`}
            />
            {outcome.monthlySaving > 0 ? (
              <Stat
                label={ROI_COPY.monthlySavingLabel.positive}
                value={`${formatUsd(outcome.monthlySaving)}/mo`}
              />
            ) : outcome.monthlySaving < 0 ? (
              <Stat
                label={ROI_COPY.monthlySavingLabel.negative}
                value={`${formatUsd(Math.abs(outcome.monthlySaving))}/mo`}
              />
            ) : (
              <Stat
                label={ROI_COPY.monthlySavingLabel.zero}
                value={ROI_COPY.monthlySavingZeroValue}
              />
            )}
            {/* Owner instruction: never show a negative ROI number. Both stats
                are null unless the project's net benefit is actually positive
                across the horizon, so omit rather than render a placeholder. */}
            {outcome.netBenefit !== null && (
              <Stat
                label={`Net over ${outcome.horizonMonths / 12} years`}
                value={formatUsd(outcome.netBenefit)}
              />
            )}
            {outcome.roiFraction !== null && (
              <Stat
                label={`ROI over ${outcome.horizonMonths / 12} years`}
                value={formatPercent(outcome.roiFraction)}
              />
            )}
          </dl>
        </>
      ) : outcome.percentOfAgency !== null ? (
        <>
          <p className="mb-2 font-body text-sm text-muted-ink">You would pay</p>
          <p className="mb-8 font-display text-[56px] leading-none tracking-[-2px] tabular-nums md:text-[72px]">
            {formatPercent(outcome.percentOfAgency)}
          </p>
          <p className="mb-8 font-body text-muted-ink">of typical agency rates</p>
          <dl className="grid grid-cols-2 gap-6">
            {/* Owner decision 2026-08-16: hourly team rates are public. The
                pair substantiates the percentage headline above it. Project
                totals stay internal (PRD §6). Row order: rates, build-time
                comparison, then monthly running figures. */}
            <Stat
              label={ROI_COPY.ourRateLabel}
              value={`${formatUsd(outcome.ourHourlyRate)}/hr`}
            />
            <Stat
              label={ROI_COPY.agencyRateLabel}
              value={`${formatUsd(outcome.agencyHourlyRate)}/hr`}
            />
            <Stat
              label={ROI_COPY.buildTimeLabel}
              value={`${outcome.buildMonths} months`}
            />
            <Stat
              label={ROI_COPY.agencyBuildTimeLabel}
              value={`${outcome.agencyBuildMonths} months`}
            />
            <Stat
              label="Est. Cost to run & maintain"
              value={`${formatUsd(outcome.newMonthly)}/mo`}
            />
            {/* Split-by-path saving: only for mixed selections whose internal
                tools replace real spend, and never as a negative number. */}
            {outcome.internalMonthlySaving !== null && (
              <Stat
                label={ROI_COPY.internalSavingLabel}
                value={`${formatUsd(outcome.internalMonthlySaving)}/mo`}
              />
            )}
          </dl>
          <p className="mt-6 font-body text-muted-ink">{AGENCY_REASON_COPY[outcome.reason]}</p>
        </>
      ) : (
        <>
          {/* The tier rate is at or above the agency benchmark: printing
              "112% of typical agency rates" would undercut the pitch, so
              lead with build time instead of a percentage headline. */}
          <p className="mb-2 font-body text-sm text-muted-ink">Est. Build time</p>
          <p className="mb-8 font-display text-[56px] leading-none tracking-[-2px] tabular-nums md:text-[72px]">
            {outcome.buildMonths} months
          </p>
          <dl className="grid grid-cols-2 gap-6">
            <Stat
              label={ROI_COPY.agencyBuildTimeLabel}
              value={`${outcome.agencyBuildMonths} months`}
            />
            <Stat
              label="Est. Cost to run & maintain"
              value={`${formatUsd(outcome.newMonthly)}/mo`}
            />
            {outcome.internalMonthlySaving !== null && (
              <Stat
                label={ROI_COPY.internalSavingLabel}
                value={`${formatUsd(outcome.internalMonthlySaving)}/mo`}
              />
            )}
          </dl>
          <p className="mt-6 font-body text-muted-ink">{AGENCY_REASON_COPY[outcome.reason]}</p>
        </>
      )}

      {/* The conversion point: orange primary + ink secondary (one accent
          per view — the quote button must not compete with Book a call). */}
      {outcome !== null && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-3 rounded-full bg-brand px-6 py-3 font-body text-white transition-colors hover:bg-brand-hover"
          >
            {ROI_COPY.ctaLabel}
          </a>
          <QuoteDialog inputs={inputs} outcome={outcome} />
        </div>
      )}

      <p className="mt-8 font-body text-xs text-muted-ink">{ROI_COPY.disclaimer}</p>
    </div>
  );
}
