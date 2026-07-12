import { ArrowRight } from "lucide-react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { CTA as CTA_CONTENT } from "../data/content";
import abstractBg from "../../imports/pasted_text/abstract-background.svg";

export function CTA() {
  return (
    <section id="contact" className={cn(CONTAINER, SECTION.wrap)}>
      <div className="relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-card bg-black p-8 text-center text-white md:aspect-[2.2/1]">
        {/* Abstract background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={abstractBg}
            alt=""
            aria-hidden
            className="absolute left-1/2 top-1/2 min-h-[200%] min-w-[200%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover opacity-75 md:min-w-[120%]"
          />
        </div>
        <div className="absolute inset-0 z-10 bg-black/40" />

        <div className="relative z-20 flex flex-col items-center">
          <h2
            className={cn(
              "mb-12 max-w-[981px] font-display text-[48px] font-normal leading-[1.1] tracking-[-2.88px] md:text-[96px]",
            )}
          >
            {CTA_CONTENT.headline}
          </h2>
          <a
            href={CTA_CONTENT.href}
            className="group flex items-center gap-3 rounded-full bg-brand px-8 py-4 text-white transition-colors hover:bg-brand-hover"
          >
            <span className={cn(TYPE.body, "md:text-[36px] md:tracking-[-1.08px]")}>
              {CTA_CONTENT.buttonLabel}
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-brand transition-transform group-hover:scale-110">
              <ArrowRight className="size-5" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
