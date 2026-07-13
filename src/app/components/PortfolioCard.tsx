import { cn, TYPE } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";

type PortfolioCardProps = {
  item: PortfolioItem;
  /** Opens the detail modal for this item. */
  onOpen: () => void;
};

export function PortfolioCard({ item, onOpen }: PortfolioCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-card bg-surface text-left",
        "transition-transform duration-300 ease-out hover:-translate-y-1",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      )}
    >
      {item.coverImage ? (
        <img
          src={item.coverImage}
          alt=""
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[16/10] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
        />
      )}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h3 className={cn(TYPE.cardTitle, "mb-2")}>{item.title}</h3>
        {item.client && (
          <p className="mb-4 text-sm text-muted-ink">{item.client}</p>
        )}
        <p className={cn(TYPE.body, "text-muted-ink")}>{item.summary}</p>
      </div>
    </button>
  );
}
