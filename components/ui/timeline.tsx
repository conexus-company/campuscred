import { cn } from "@/lib/utils";

export type TimelineItem = {
  title: string;
  date?: string;
  text?: string;
  /** "neutral": hollow ink ring. The others: filled dot with a soft halo. */
  tone?: "neutral" | "valid" | "revoked" | "tampered";
};

const DOT: Record<NonNullable<TimelineItem["tone"]>, string> = {
  neutral: "border-[3px] border-cc-ink bg-white",
  valid: "bg-cc-valid shadow-[0_0_0_5px_#D7F5E0]",
  revoked: "bg-cc-revoked shadow-[0_0_0_5px_#FDE8C8]",
  tampered: "bg-cc-tampered shadow-[0_0_0_5px_#FECACA]",
};

/** Vertical status history, newest first (prototype VerifyResult.dc.html). */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("m-0 flex list-none flex-col p-0", className)}>
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="flex gap-4">
          <div aria-hidden="true" className="flex flex-col items-center">
            <div className={cn("mt-1 size-5 flex-none rounded-full", DOT[item.tone ?? "neutral"])} />
            {i < items.length - 1 && <div className="min-h-10 w-[3px] flex-1 rounded-sm bg-[#E0D8B8]" />}
          </div>
          <div className="flex flex-col gap-1 pb-[26px]">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-disp text-[21px] tracking-[-0.03em]">{item.title}</span>
              {item.date && <span className="text-sm text-cc-muted-2">{item.date}</span>}
            </div>
            {item.text && <div className="text-[15px] leading-[1.55] text-cc-muted">{item.text}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
