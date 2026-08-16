import { MotionConfig } from "motion/react";
import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { RoiCalculator } from "./sections/RoiCalculator";
import { Services } from "./sections/Services";
// Approach is temporarily hidden — see the note in <main> below.
// import { Approach } from "./sections/Approach";
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
            <Services />
            <RoiCalculator />
            <Portfolio />
            {/* Approach is hidden for now, not deleted: the section component,
                its APPROACH_STEPS content and their tests are all still here.
                To bring it back, uncomment this line and its import above.
                Nothing links to it — it carries no id and appears in no nav —
                so hiding it leaves no dead anchors. */}
            {/* <Approach /> */}
            <FAQ />
            <CTA />
          </main>
          <Footer />
        </div>
      </SmoothScroll>
    </MotionConfig>
  );
}
