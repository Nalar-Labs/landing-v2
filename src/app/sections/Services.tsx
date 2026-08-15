import { useRef } from "react";
import { useScroll } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICES } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";
import { useMediaQuery } from "../lib/use-media-query";

export function Services() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // Remount on breakpoint change so useScroll re-registers with the right
  // offsets — motion doesn't retarget an existing scroll tracker.
  return <ServicesInner key={isDesktop ? "pinned" : "flowing"} isDesktop={isDesktop} />;
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
      {/* pt-60 clears the fixed navbar while pinned */}
      <div className={pin ? "sticky top-0 flex h-screen flex-col pt-60" : undefined}>
        {/* mb-6 while pinned (not mb-12): the chip below consumes headroom
            inside the fixed h-screen panel, and the card grid must still fit. */}
        <h2 className={pin ? cn(TYPE.h3, "mb-6") : cn(TYPE.h2, SECTION.titleGap)}>
          We help you
        </h2>

        <a
          href="#roi-calculator"
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-body text-sm transition-colors hover:border-ink"
        >
          Use Nalar ROI calculator
          <ArrowRight className="size-4" aria-hidden />
        </a>

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
      </div>
    </section>
  );
}
