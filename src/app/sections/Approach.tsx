import { useRef } from "react";
import { useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { APPROACH_STEPS } from "../data/content";
import { ApproachItem } from "../components/ApproachItem";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";
import { useMediaQuery } from "../lib/use-media-query";

export function Approach() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // Remount on breakpoint change so useScroll re-registers with the right
  // offsets — motion doesn't retarget an existing scroll tracker.
  return <ApproachInner key={isDesktop ? "pinned" : "flowing"} isDesktop={isDesktop} />;
}

function ApproachInner({ isDesktop }: { isDesktop: boolean }) {
  const trackRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Desktop pins the section: the page holds still while scroll drives each
  // step into focus in turn, releasing once the last step has finished.
  // Mobile (and reduced motion) keeps normal flow.
  const pin = isDesktop && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: pin ? ["start start", "end end"] : ["start 0.7", "end 0.4"],
  });

  return (
    <section ref={trackRef} className={cn(CONTAINER, pin ? "h-[250vh]" : SECTION.wrap)}>
      {/* pt-24 clears the fixed navbar while pinned */}
      <div className={pin ? "sticky top-0 flex h-screen flex-col justify-center pt-24" : undefined}>
        <h2
          className={
            pin
              ? "font-display text-[64px] font-light leading-[1.05] tracking-[-1.92px] mb-8"
              : cn(TYPE.h2, SECTION.titleGap)
          }
        >
          Approach
        </h2>

        {/* Vertical rail; each ApproachItem places its own node on it */}
        <ol
          className={cn(
            "ml-4 border-l-2 border-line pl-8",
            pin ? "space-y-10" : "space-y-24 md:ml-8 md:space-y-32 md:pl-16",
          )}
        >
          {APPROACH_STEPS.map((step, index) => (
            <ApproachItem
              key={step.title}
              {...step}
              index={index}
              stepCount={APPROACH_STEPS.length}
              scrollYProgress={scrollYProgress}
              reducedMotion={reducedMotion}
              compact={pin}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
