"use client";

import { cn } from "@/lib/utils";

export type TabsPillOption<T extends string> = { value: T; label: string };

type TabsPillProps<T extends string> = {
  options: TabsPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Filter by status". */
  label: string;
  className?: string;
};

/** Segmented control with a sliding black highlight (prototype Issuer.dc.html filter tabs). */
export function TabsPill<T extends string>({ options, value, onChange, label, className }: TabsPillProps<T>) {
  const n = options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative grid w-[400px] max-w-full rounded-full border border-cc-line bg-white p-1", className)}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-full bg-cc-ink transition-transform duration-300 ease-[cubic-bezier(.3,.8,.3,1)]"
        style={{ width: `calc((100% - 8px) / ${n})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-1 min-h-11 rounded-full px-2 text-center text-sm font-semibold transition-colors",
              on ? "text-cc-yellow" : "text-cc-muted hover:text-cc-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
