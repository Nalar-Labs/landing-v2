import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { APPROACH_STEPS } from "../data/content";
import { ApproachItem } from "../components/ApproachItem";

export function Approach() {
  return (
    <section className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Approach</h2>

      {/* Vertical rail; each ApproachItem places its own node on it */}
      <ol className="ml-4 space-y-24 border-l-2 border-line pl-8 md:ml-8 md:space-y-32 md:pl-16">
        {APPROACH_STEPS.map((step) => (
          <ApproachItem key={step.title} {...step} />
        ))}
      </ol>
    </section>
  );
}
