import { cn } from "../lib/layout";

type DotsProps = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Group label, e.g. "Portfolio slides". */
  label: string;
  /** Accessible name for dot n, e.g. (i) => `Show ${titles[i]}`. */
  labelForIndex: (index: number) => string;
  className?: string;
};

/** Instagram-style progress dots, shared by the carousel and the modal gallery. */
export function Dots({
  count,
  activeIndex,
  onSelect,
  label,
  labelForIndex,
  className,
}: DotsProps) {
  // A single dot communicates nothing.
  if (count < 2) return null;

  return (
    <div
      className={cn("flex justify-center gap-3", className)}
      role="group"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={labelForIndex(index)}
          aria-current={index === activeIndex}
          className="group flex h-6 w-6 items-center justify-center"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-6 bg-black"
                : "w-2 bg-black/20 group-hover:bg-black/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
