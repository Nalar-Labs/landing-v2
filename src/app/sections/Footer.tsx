import { cn, CONTAINER } from "../lib/layout";
import { FOOTER } from "../data/content";
import lightLogo from "../../imports/logo/FA_Nalar Logo_light.svg";

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className={cn(CONTAINER, "py-16 md:py-24")}>
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center md:h-12 md:w-12"
            aria-hidden="true"
          >
            <img src={lightLogo} alt="" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-3xl font-light tracking-[-1.2px] md:text-[40px]">
            Nalar
          </span>
        </div>

        <div className="mt-10 flex flex-col gap-10 md:mt-16 md:flex-row md:justify-between">
          <ul className="flex flex-col gap-3 font-body text-base md:text-lg">
            {FOOTER.links.map((link) => {
              const isExternal = link.href.startsWith("http");
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="max-w-[420px] font-display text-lg font-light leading-snug tracking-[-0.54px] text-white/70 md:text-[20px]">
            {FOOTER.blurb}
          </p>
        </div>
      </div>
    </footer>
  );
}
