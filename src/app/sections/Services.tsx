import { useRef } from "react";
import { useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICE_GROUPS } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { SERVICE_CARD_COUNT } from "../lib/service-scroll-sequence";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";
import { useMediaQuery } from "../lib/use-media-query";

// Global card index (0-5) each group's items start at, in render order.
const GROUP_INDEX_OFFSETS = SERVICE_GROUPS.reduce<number[]>((offsets, group, i) => {
  offsets.push(i === 0 ? 0 : offsets[i - 1] + SERVICE_GROUPS[i - 1].items.length);
  return offsets;
}, []);

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
  // viewport-height panel while progress drives the cards 1→6, then the
  // page releases. Mobile (and reduced motion) keeps normal flow.
  const pin = isDesktop && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: pin ? ["start start", "end end"] : ["start end", "end start"],
  });

  return (
    <section
      id="services"
      ref={trackRef}
      className={cn(CONTAINER, pin ? "h-[350vh]" : SECTION.wrap)}
    >
      {/* pt-24 clears the fixed navbar while pinned */}
      <div className={pin ? "sticky top-0 flex h-screen flex-col justify-center pt-24" : undefined}>
        <h2
          className={
            pin
              ? "font-display text-[64px] font-light leading-[1.05] tracking-[-1.92px] mb-8"
              : cn(TYPE.h2, SECTION.titleGap)
          }
        >
          We help you
        </h2>

        <div className={pin ? "space-y-8" : "space-y-16 md:space-y-24"}>
          {SERVICE_GROUPS.map((group, groupIndex) => (
            <div key={group.heading}>
              <h3
                className={
                  pin
                    ? "font-display text-[32px] font-light leading-[1.05] tracking-[-0.96px] mb-4"
                    : cn(TYPE.h3, "mb-10 md:mb-12")
                }
              >
                {group.heading}
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 ">
                {group.items.map((service, itemIndex) => (
                  <ServiceCard
                    key={service.title}
                    {...service}
                    index={GROUP_INDEX_OFFSETS[groupIndex] + itemIndex}
                    cardCount={SERVICE_CARD_COUNT}
                    scrollYProgress={scrollYProgress}
                    reducedMotion={reducedMotion}
                    compact={pin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
