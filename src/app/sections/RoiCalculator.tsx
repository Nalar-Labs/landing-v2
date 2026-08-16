import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { motion, useTransform } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { useMediaQuery } from "../lib/use-media-query";
import { PIN_PANEL, PIN_TRACK, usePinDecision, usePinnedTrack } from "../lib/use-pinned-section";
import { revealClipPath } from "../lib/roi-reveal";
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
  // 700px, measured, not guessed: the panel needs 128px of navbar clearance +
  // a 67px heading + a 32px gap + the card, and the card's worst case — every
  // conditional field shown and a result rendered — is 426px. That is 653px,
  // so 700 leaves a small margin. An earlier 820 was pure over-caution and
  // meant the section silently never pinned on a normal laptop window.
  const pin = usePinDecision(700);
  // Remount on the decision so useScroll re-registers with the right offsets.
  return <RoiCalculatorInner key={pin ? "pinned" : "flowing"} pin={pin} />;
}

function RoiCalculatorInner({ pin }: { pin: boolean }) {
  const [inputs, setInputs] = useState<RoiInputs>(EMPTY);
  const [outcome, setOutcome] = useState<RoiOutcome | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Below md the panel stacks under the form, so a result computed off-screen
  // would be invisible. Desktop shows both side by side and must not scroll.
  const isStacked = useMediaQuery("(max-width: 767px)");
  // undefined when Lenis is skipped (reduced motion) — see smooth-scroll.tsx.
  const lenis = useLenis();

  const { trackRef, scrollYProgress } = usePinnedTrack(pin);
  /**
   * Wipes open across the first 30% of the track, then stays open for the
   * remaining 70% — the same shape as a Services card, which ramps over its
   * own window and then holds at fully expanded for the rest of the scroll.
   * It must never close again on the way down.
   *
   * The inset string is computed from a clamped number rather than handed to
   * useTransform as two `inset()` strings to interpolate between: string
   * interpolation of clip-path is unreliable and can jump between endpoints
   * instead of gliding.
   */
  const revealClip = useTransform(scrollYProgress, revealClipPath);

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
    <section
      id="roi-calculator"
      ref={trackRef}
      className={cn(CONTAINER, pin ? PIN_TRACK : SECTION.wrap)}
    >
      <div className={pin ? PIN_PANEL : undefined}>
        <h2 className={cn(TYPE.h3, pin ? "mb-8" : SECTION.titleGap)}>
          {ROI_COPY.heading}
        </h2>
        {/* Wipes open top-to-bottom as the track scrolls. clip-path rather than
            height or scaleY: the panel's contents keep their real geometry, so
            the form stays usable and nothing reflows mid-reveal. */}
        <motion.div
          style={pin ? { clipPath: revealClip } : undefined}
          className="grid grid-cols-1 gap-8 rounded-card bg-surface p-8 md:grid-cols-2 md:p-12"
        >
          <RoiForm value={inputs} onChange={handleChange} onCalculate={handleCalculate} />
          <div ref={resultRef}>
            <RoiResult outcome={outcome} inputs={inputs} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
