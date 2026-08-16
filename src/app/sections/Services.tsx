import { useRef } from "react";
import { useScroll } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PHILOSOPHY_INTRO, PHILOSOPHY_OUTRO, SERVICES } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";
import { useMediaQuery } from "../lib/use-media-query";

/**
 * Body copy for this section's intro and outro. Matches the FAQ's answer
 * styling so both read as the same voice at the same weight.
 */
const PHILOSOPHY_BODY = cn(TYPE.body, "text-ink-soft md:text-[20px] md:leading-relaxed");

export function Services() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  /**
   * The pinned panel is a fixed h-screen box holding heading, intro, three
   * cards and the outro. Below ~700px of viewport height that stack no longer
   * fits and the outro clips off the bottom — a 1366x768 laptop lands right on
   * the edge. Short viewports get the normal flowing layout instead, which
   * cannot clip at any height.
   */
  const isTallEnough = useMediaQuery("(min-height: 700px)");
  const canPin = isDesktop && isTallEnough;
  // Remount on breakpoint change so useScroll re-registers with the right
  // offsets — motion doesn't retarget an existing scroll tracker.
  return <ServicesInner key={canPin ? "pinned" : "flowing"} isDesktop={canPin} />;
}

function ServicesInner({ isDesktop }: { isDesktop: boolean }) {
  const trackRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Desktop pins the section: the tall track scrolls beneath a sticky,
  // viewport-height panel while progress opens the three cards in turn,
  // then releases the page. Mobile (and reduced motion) keeps normal flow.
  const pin = isDesktop && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: pin ? ["start start", "end end"] : ["start end", "end start"],
  });

  return (
    <section
      id="services"
      ref={trackRef}
      className={cn(CONTAINER, pin ? "h-[260vh]" : SECTION.wrap)}
    >
      {/* pt-36 clears the fixed navbar while pinned. Was pt-60, but the panel
          is a fixed h-screen box and now also carries the intro and outro —
          at 240px of top padding the outro clipped below a ~713px viewport,
          which a 1366x768 laptop hits. */}
      <div className={pin ? "sticky top-0 flex h-screen flex-col pt-36" : undefined}>
        {/* Tighter margins while pinned: the intro and outro below both consume
            headroom inside the fixed h-screen panel, and the cards must still fit. */}
        <h2 className={pin ? cn(TYPE.h3, "mb-4") : cn(TYPE.h2, "mb-6")}>
          Our Philosophy
        </h2>

        {/* Same body treatment as the FAQ answers — TYPE.body + text-ink-soft
            is the house style for section body copy, so this reads as part of
            the same page rather than a lighter aside. */}
        <div className={cn("max-w-4xl", pin ? "mb-6" : "mb-10")}>
          {PHILOSOPHY_INTRO.map((line) => (
            <p key={line} className={PHILOSOPHY_BODY}>
              {line}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 auto-rows-fr md:grid-cols-3">
          {SERVICES.map((service, index) => (
            <ServiceCard
              key={service.title}
              {...service}
              index={index}
              scrollYProgress={scrollYProgress}
              reducedMotion={reducedMotion}
              compact={pin}
              scrollDriven={pin}
            />
          ))}
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center gap-3",
            pin ? "mt-6" : "mt-10",
          )}
        >
          <span className={PHILOSOPHY_BODY}>{PHILOSOPHY_OUTRO}</span> <b>
          <a
            href="#roi-calculator"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-brand px-4 py-2 font-body text-sm text-white transition-colors hover:bg-brand-hover"
          >
            Use our ROI Calculator
            <ArrowRight className="size-4" aria-hidden />
          </a> 
            </b>
        </div>
      </div>
    </section>
  );
}
