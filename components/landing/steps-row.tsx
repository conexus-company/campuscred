"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { clamp01, useScrollProgress } from "./use-scroll-progress";

const STEPS = [
  { title: "Issue", text: "The registrar uploads the official PDF and signs with a wallet." },
  { title: "Fingerprint", text: "Only a SHA-256 fingerprint goes on the chain. The PDF stays private." },
  { title: "Share", text: "The student shares a QR code or link. No wallet needed." },
  { title: "Verify", text: "Anyone checks it in seconds, with no account." },
];

/** The four steps with a progress line that fills on scroll; each step lights up as the line reaches it. */
export function StepsRow() {
  const ref = useRef<HTMLDivElement>(null);
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    const vh = window.innerHeight;
    return clamp01((vh * 0.8 - el.getBoundingClientRect().top) / (vh * 0.5));
  }, []);
  const p = useScrollProgress(measure);

  return (
    <div ref={ref} className="relative mt-[100px] max-[560px]:mt-14">
      <div aria-hidden="true" className="absolute top-7 right-0 left-0 h-1 rounded-sm bg-cc-track max-[560px]:hidden" />
      <div
        aria-hidden="true"
        className="absolute top-7 left-0 h-1 rounded-sm bg-cc-ink max-[560px]:hidden"
        style={{ width: `${(p * 100).toFixed(1)}%` }}
      />
      <ol className="relative m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-7 p-0">
        {STEPS.map((s, i) => {
          const on = p >= i / (STEPS.length - 1) - 0.02;
          return (
            <li key={s.title} className="relative z-1">
              <div
                className={cn(
                  "font-disp grid size-[60px] place-items-center rounded-full border-[3px] text-[22px] tracking-normal transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)]",
                  on
                    ? "scale-112 -rotate-6 border-cc-ink bg-cc-yellow text-cc-ink"
                    : "border-[#E5DDBA] bg-white text-[#8A8164]",
                )}
              >
                {i + 1}
              </div>
              <b
                className={cn(
                  "font-disp mt-[22px] block text-[26px] tracking-[-0.03em] transition-colors duration-400",
                  on ? "text-cc-ink" : "text-[#8A8164]",
                )}
              >
                {s.title}
              </b>
              <span
                className={cn(
                  "mt-2 block max-w-[250px] text-[16.5px] leading-[1.5] transition-colors duration-400",
                  on ? "text-cc-muted" : "text-cc-muted-2",
                )}
              >
                {s.text}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
