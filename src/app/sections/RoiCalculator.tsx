import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { useMediaQuery } from "../lib/use-media-query";
import { RoiForm } from "../components/RoiForm";
import { RoiResult } from "../components/RoiResult";
import { ROI_COPY } from "../data/roi-copy";
import { calculateRoi, type RoiInputs, type RoiOutcome } from "../data/roi";

const EMPTY: RoiInputs = {
  selectedAppIds: [],
  employees: 0,
  paysForSoftware: false,
  currentMonthlySpend: 0,
  externalUsers: 0,
};

export function RoiCalculator() {
  const [inputs, setInputs] = useState<RoiInputs>(EMPTY);
  const [outcome, setOutcome] = useState<RoiOutcome | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Below md the panel stacks under the form, so a result computed off-screen
  // would be invisible. Desktop shows both side by side and must not scroll.
  const isStacked = useMediaQuery("(max-width: 767px)");
  // undefined when Lenis is skipped (reduced motion) — see smooth-scroll.tsx.
  const lenis = useLenis();

  // Any edit to the form invalidates the displayed result: without this, the
  // panel keeps showing figures for a selection the visitor has since
  // changed (e.g. unticking every app should return to the resting state,
  // not keep showing the last computed outcome).
  const handleChange = (next: RoiInputs) => {
    setInputs(next);
    setOutcome(null);
  };

  const handleCalculate = () => {
    setOutcome(calculateRoi(inputs));
    if (isStacked) {
      // After paint, so the panel has its resolved height before we scroll.
      requestAnimationFrame(() => {
        const el = resultRef.current;
        if (!el) return;
        // Lenis owns document scroll site-wide (see smooth-scroll.tsx), so a
        // native scrollIntoView is fought frame-by-frame and only actually
        // moves the page when Lenis is skipped for reduced motion.
        if (lenis) {
          const offset = -(window.innerHeight - el.getBoundingClientRect().height) / 2;
          lenis.scrollTo(el, { offset });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  };

  return (
    <section id="roi-calculator" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>{ROI_COPY.heading}</h2>
      <div className="grid grid-cols-1 gap-8 rounded-card bg-surface p-8 md:grid-cols-2 md:p-12">
        <RoiForm value={inputs} onChange={handleChange} onCalculate={handleCalculate} />
        <div ref={resultRef}>
          <RoiResult outcome={outcome} />
        </div>
      </div>
    </section>
  );
}
