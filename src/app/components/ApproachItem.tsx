import { cn, TYPE } from "../lib/layout";
import type { ApproachStep } from "../data/content";

/**
 * One node on the Approach timeline. The dot sits on the shared rail drawn by
 * the parent section; active steps get a larger, darker dot.
 */
export function ApproachItem({
  title,
  subtitle,
  active = false,
  steps,
  paragraph,
}: ApproachStep) {
  return (
    <li className="relative">
      {/* Timeline node — aligned to the parent rail */}
      <span
        aria-hidden
        className={cn(
          "absolute top-2 rounded-full",
          active
            ? "-left-[42px] size-[18px] bg-ink md:-left-[73px] md:size-[25px]"
            : "-left-[39px] size-[12px] bg-line md:-left-[68px] md:size-[15px]",
        )}
      />
      <div className="max-w-[800px]">
        <h3 className={TYPE.stepTitle}>{title}</h3>
        {subtitle && <h4 className={cn(TYPE.stepTitle, "mt-2")}>{subtitle}</h4>}

        {steps && (
          <ol className={cn(TYPE.bodyRelaxed, "mt-6 list-decimal space-y-2 pl-6")}>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {paragraph && (
          <p className={cn(TYPE.bodyRelaxed, "mt-6 text-black/80")}>{paragraph}</p>
        )}
      </div>
    </li>
  );
}
