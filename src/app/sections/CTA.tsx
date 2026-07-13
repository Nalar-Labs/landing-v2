import { ArrowRight } from "lucide-react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { CTA as CTA_CONTENT } from "../data/content";
import bottomBg from "../../imports/bottom_section.svg";

export function CTA() {
  return (
    <section id="contact" className={cn(CONTAINER, SECTION.wrap)}>
      <div className="relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-card bg-black p-8 text-center text-white md:aspect-[2.2/1]">
        {/* Background image (carries its own dark wash) */}
        <img
          src={bottomBg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10 bg-black/25" />

        <div className="relative z-20 flex flex-col items-center">
          <h2
            className={cn(
              "mb-12 max-w-[981px] font-display text-[clamp(36px,7.5vw,96px)] font-normal leading-[1.1] tracking-[-0.03em]",
            )}
          >
            {CTA_CONTENT.headline}
          </h2>
          <a
            href={CTA_CONTENT.href}
            target="_blank"
            rel="noreferrer"
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
