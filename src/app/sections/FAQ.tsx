import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { FAQ_ITEMS } from "../data/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export function FAQ() {
  return (
    <section id="faq" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h3, SECTION.titleGap)}>Your Questions, Answered</h2>

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

    </section>
  );
}
