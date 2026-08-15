import { MotionConfig } from "motion/react";
import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { Services } from "./sections/Services";
import { Approach } from "./sections/Approach";
import { Portfolio } from "./sections/Portfolio";
import { FAQ } from "./sections/FAQ";
import { CTA } from "./sections/CTA";
import { SmoothScroll } from "./lib/smooth-scroll";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        {/* overflow-x-clip (not -hidden): hidden creates a scroll container,
            which silently disables position:sticky for every descendant —
            the Services section relies on sticky for its scroll-pin. */}
        <div className="min-h-screen overflow-x-clip bg-page font-display text-black selection:bg-brand selection:text-white">
          <Navbar />
          <main>
            <Hero />
            {/* PRD 2 — the ROI Calculator mounts here, between Hero and
                Services. Its `#roi-calculator` anchor and the Services chip
                that links to it ship together with the calculator itself,
                never before: an anchor to nothing is a dead link. */}
            <Services />
            <Portfolio />
            <Approach />
            <FAQ />
            <CTA />
          </main>
        </div>
      </SmoothScroll>
    </MotionConfig>
  );
}
