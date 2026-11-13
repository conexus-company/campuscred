"use client";

import { cn } from "@/lib/utils";
import { useScrambleText } from "./use-scramble-text";

type HashTextProps = {
  /** "0x" + 64 hex characters. */
  value: string;
  /** Animate a left-to-right "decrypt" when the value appears or changes. */
  scramble?: boolean;
  /** Highlight colour for the first 10 characters. "red" marks a mismatched file on Tampered. */
  highlight?: "yellow" | "red";
  /** Mute the tail (default) or keep it ink, as on the "Computing fingerprint" card. */
  mutedTail?: boolean;
  /** Show only the first 10 characters and an ellipsis. */
  short?: boolean;
  className?: string;
};

/** Mono hash. The first 10 characters sit on a highlight, the rest is muted. */
export function HashText({ value, scramble = false, highlight = "yellow", mutedTail = true, short, className }: HashTextProps) {
  const { text, done } = useScrambleText(value, { enabled: scramble });
  const head = text.slice(0, 10);
  const tail = short ? "…" : text.slice(10);

  return (
    <span className={cn("font-mono break-all", className)}>
      {/* Screen readers get the final value once, not every frame. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" data-done={done || undefined}>
        <span
          className={cn("rounded-[3px] px-[3px] py-px", highlight === "yellow" ? "bg-cc-yellow" : "bg-[#FECACA]")}
        >
          {head}
        </span>
        <span className={mutedTail ? "text-cc-muted" : undefined}>{tail}</span>
      </span>
    </span>
  );
}
