import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { Services } from "./sections/Services";
import { Approach } from "./sections/Approach";
import { CTA } from "./sections/CTA";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-display text-black selection:bg-brand selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Approach />
        <CTA />
      </main>
    </div>
  );
}
