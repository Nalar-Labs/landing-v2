import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { cn, TYPE } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";

type PortfolioModalProps = {
  /** The modal is open while this is non-null. */
  item: PortfolioItem | null;
  onClose: () => void;
};

export function PortfolioModal({ item, onClose }: PortfolioModalProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-card border-line p-0 sm:max-w-3xl">
        {item && (
          /* data-lenis-prevent: Lenis owns wheel events site-wide; without
             it the modal body cannot scroll independently of the page.
             Scrolling an inner div (not DialogContent) keeps the close X
             pinned while long content scrolls. */
          <div data-lenis-prevent className="max-h-[85vh] overflow-y-auto">
            {item.coverImage ? (
              <img
                src={item.coverImage}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="aspect-[21/9] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
              />
            )}
            <article className="p-8 md:p-12">
              <DialogTitle className={cn(TYPE.cardTitle, "mb-1")}>
                {item.title}
              </DialogTitle>
              {item.client && (
                <p className="mb-4 text-sm text-muted-ink">{item.client}</p>
              )}
              <DialogDescription
                className={cn(TYPE.body, "mb-6 text-muted-ink")}
              >
                {item.summary}
              </DialogDescription>
              {item.tags.length > 0 && (
                <ul className="mb-8 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-line px-3 py-1 text-sm text-muted-ink"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown>{item.body}</ReactMarkdown>
              </div>
            </article>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
