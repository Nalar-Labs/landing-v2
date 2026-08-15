import { useRef } from "react";
import { useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICES } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { SERVICE_CARD_COUNT } from "../lib/service-scroll-sequence";
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
        <h2
          className={
            pin
              ? "font-display text-[64px] font-light leading-[1.05] tracking-[-1.92px] mb-12"
              : cn(TYPE.h2, SECTION.titleGap)
          }
        >
          We help you
        </h2>

        <div className="grid grid-cols-1 gap-6 auto-rows-fr md:grid-cols-3">
          {SERVICES.map((service, index) => (
            <ServiceCard
              key={service.title}
              {...service}
              index={index}
              cardCount={SERVICE_CARD_COUNT}
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
