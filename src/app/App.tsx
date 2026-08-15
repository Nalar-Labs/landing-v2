import { MotionConfig } from "motion/react";
import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { RoiCalculator } from "./sections/RoiCalculator";
import { Services } from "./sections/Services";
import { Approach } from "./sections/Approach";
import { Portfolio } from "./sections/Portfolio";
import { FAQ } from "./sections/FAQ";
import { CTA } from "./sections/CTA";
import { Footer } from "./sections/Footer";
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
            <RoiCalculator />
            <Services />
            <Portfolio />
            <Approach />
            <FAQ />
            <CTA />
          </main>
          <Footer />
        </div>
      </SmoothScroll>
    </MotionConfig>
  );
}
