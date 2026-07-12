import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../lib/layout";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

/** How long each word holds before transitioning out. */
const HOLD_MS = 2000;
/** Fade/slide transition duration (spec: ~300ms ease-out). */
const TRANSITION_S = 0.3;

type CyclingWordProps = {
  words: readonly string[];
  /**
   * Delay before this instance's first transition, so multiple instances
   * (hero lines 1 and 2) change at a visible offset instead of in lockstep.
   */
  offsetMs?: number;
  className?: string;
};

/**
 * Loops through `words` indefinitely: each word holds for ~2s, then the
 * outgoing word fades out sliding up while the incoming word fades in
 * rising from below. Under prefers-reduced-motion, renders the first
 * word statically and never starts the timer.
 */
export function CyclingWord({ words, offsetMs = 0, className }: CyclingWordProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || words.length < 2) return;

    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setIndex((i) => (i + 1) % words.length);
      interval = window.setInterval(() => {
        setIndex((i) => (i + 1) % words.length);
      }, HOLD_MS + TRANSITION_S * 1000);
    }, HOLD_MS + TRANSITION_S * 1000 + offsetMs);

    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [prefersReducedMotion, words, offsetMs]);

  if (prefersReducedMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span
      className={cn(
        // inline-grid stacks entering/exiting words in the same cell so the
        // line doesn't jump; overflow-hidden clips the vertical slide.
        "relative inline-grid overflow-hidden align-bottom",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: "0.5em" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-0.5em" }}
          transition={{ duration: TRANSITION_S, ease: "easeOut" }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
