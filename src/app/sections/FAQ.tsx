import { ArrowRight } from "lucide-react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { CALENDLY_URL, FAQ_ITEMS } from "../data/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export function FAQ() {
  return (
    <section id="faq" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Questions? We have answers</h2>

      {/* Collapsible, all closed by default. Not an independently scrollable
          region, so it needs no data-lenis-prevent. */}
      <Accordion type="single" collapsible className="mx-auto w-full max-w-[900px]">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question} className="border-line">
            <AccordionTrigger className="text-left font-display text-[20px] font-medium leading-snug tracking-[-0.6px] md:text-[28px] md:tracking-[-0.84px]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent
              className={cn(TYPE.body, "text-ink-soft md:text-[20px] md:leading-relaxed")}
            >
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 flex justify-center md:mt-16">
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-3 rounded-full border border-black/45 bg-surface px-8 py-4 font-body text-xl transition-colors hover:border-black md:text-[24px]"
        >
          <span>Book a call</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:scale-105">
            <ArrowRight className="size-4" />
          </span>
        </a>
      </div>
    </section>
  );
}
