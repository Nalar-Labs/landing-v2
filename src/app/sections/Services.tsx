import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICE_GROUPS } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { SERVICE_CARD_COUNT, getServicesHeadingLabel } from "../lib/service-scroll-sequence";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

// Global card index (0-5) each group's items start at, in render order.
const GROUP_INDEX_OFFSETS = SERVICE_GROUPS.reduce<number[]>((offsets, group, i) => {
  offsets.push(i === 0 ? 0 : offsets[i - 1] + SERVICE_GROUPS[i - 1].items.length);
  return offsets;
}, []);

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [headingLabel, setHeadingLabel] = useState<"Consultation" | "Implementation">(
    "Consultation",
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (reducedMotion) return;
    setHeadingLabel(getServicesHeadingLabel(progress));
  });

  return (
    <section id="services" ref={sectionRef} className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Key Services</h2>

      <div className="space-y-16 md:space-y-24">
        {SERVICE_GROUPS.map((group, groupIndex) => {
          const displayHeading =
            group.heading === "Consultation" ? headingLabel : group.heading;

          return (
            <div key={group.heading}>
              <h3 className={cn(TYPE.h3, "mb-10 md:mb-12")}>{displayHeading}</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {group.items.map((service, itemIndex) => (
                  <ServiceCard
                    key={service.title}
                    {...service}
                    index={GROUP_INDEX_OFFSETS[groupIndex] + itemIndex}
                    cardCount={SERVICE_CARD_COUNT}
                    scrollYProgress={scrollYProgress}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
