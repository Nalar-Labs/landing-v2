import { useRef } from "react";
import { useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { APPROACH_STEPS } from "../data/content";
import { ApproachItem } from "../components/ApproachItem";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

export function Approach() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Progress runs while the section crosses the middle of the viewport, so
  // each step comes into focus as the reader actually reaches it.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.7", "end 0.4"],
  });

  return (
    <section ref={sectionRef} className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Approach</h2>

      {/* Vertical rail; each ApproachItem places its own node on it */}
      <ol className="ml-4 space-y-24 border-l-2 border-line pl-8 md:ml-8 md:space-y-32 md:pl-16">
        {APPROACH_STEPS.map((step, index) => (
          <ApproachItem
            key={step.title}
            {...step}
            index={index}
            stepCount={APPROACH_STEPS.length}
            scrollYProgress={scrollYProgress}
            reducedMotion={reducedMotion}
          />
        ))}
      </ol>
    </section>
  );
}
