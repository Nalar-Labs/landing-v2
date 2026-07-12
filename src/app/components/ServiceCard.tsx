import { cn, TYPE } from "../lib/layout";
import type { Service } from "../data/content";

export function ServiceCard({ title, description, gradient = false }: Service) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col justify-between rounded-card p-8 md:p-[30px]",
        "transition-transform duration-300 hover:-translate-y-1",
        gradient
          ? "bg-surface bg-gradient-to-r from-[#3c3c3c33] to-[#ffffff33]"
          : "bg-surface",
      )}
    >
      <h4 className={cn(TYPE.cardTitle, "mb-8")}>{title}</h4>
      <p className={cn(TYPE.body, "text-muted-ink")}>{description}</p>
    </div>
  );
}
