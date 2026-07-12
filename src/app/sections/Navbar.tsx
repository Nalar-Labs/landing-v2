import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/layout";
import { NAV_LINKS } from "../data/content";
import darkLogo from "../../imports/logo/FA_Nalar Logo_dark.svg";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  return (
    <>
      <nav className="pointer-events-none fixed left-0 top-0 z-50 flex w-full items-center justify-between px-6 py-8 text-black md:px-12">
        <div className="pointer-events-auto flex-1">
          <a href="#home" className="relative z-[60] flex w-fit items-center gap-2" onClick={close}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-2 md:h-12 md:w-12"
              aria-hidden="true"
            >
              <img src={darkLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-3xl font-light tracking-[-1.2px] md:text-[40px]">
              Nalar
            </span>
          </a>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className="pointer-events-auto z-[60] flex h-[19px] w-[37px] flex-col justify-between"
        >
          <span
            className="block h-[2px] w-full bg-black transition-all duration-300"
            style={{ transform: isOpen ? "translateY(8.5px) rotate(45deg)" : "none" }}
          />
          <span
            className="block h-[2px] w-full bg-black transition-all duration-300"
            style={{ opacity: isOpen ? 0 : 1 }}
          />
          <span
            className="block h-[2px] w-full bg-black transition-all duration-300"
            style={{ transform: isOpen ? "translateY(-8.5px) rotate(-45deg)" : "none" }}
          />
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-white px-6 md:px-12"
          >
            <div className="flex flex-col space-y-4 font-display text-[48px] font-light leading-tight tracking-[-2.88px] md:text-[96px]">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "transition-colors",
                    link.accent ? "text-brand hover:text-brand-hover" : "hover:text-gray-600",
                  )}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
