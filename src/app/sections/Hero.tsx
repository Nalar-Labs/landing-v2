import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn, TYPE } from "../lib/layout";
import { HERO } from "../data/content";

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-32"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[1400px] text-center"
      >
        <h1 className={cn(TYPE.hero, "mx-auto mb-16 max-w-[1345px] md:mb-24")}>
          {HERO.headline}
        </h1>

        <div className="flex flex-col items-center justify-center gap-8 font-body text-xl sm:flex-row sm:gap-16 md:text-[24px]">
          {HERO.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-60"
            >
              {link.label}
            </a>
          ))}
        </div>
      </motion.div>

      {/* Scroll affordance — mobile */}
      <a
        href="#services"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-soft px-5 py-2 text-sm font-light text-white md:hidden"
      >
        Explore Nalar
        <ArrowRight className="size-4" />
      </a>
    </section>
  );
}
