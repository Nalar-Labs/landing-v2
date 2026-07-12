import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICE_GROUPS } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";

export function Services() {
  return (
    <section id="services" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Key Services</h2>

      <div className="space-y-16 md:space-y-24">
        {SERVICE_GROUPS.map((group) => (
          <div key={group.heading}>
            <h3 className={cn(TYPE.h3, "mb-10 md:mb-12")}>{group.heading}</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {group.items.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
