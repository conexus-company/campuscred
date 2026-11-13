import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type RevealLine = {
  text: string;
  /** Left indent for the staggered layout, e.g. "7vw". */
  indent?: string;
};

type LetterRevealProps = {
  lines: RevealLine[];
  className?: string;
  /** Delay before the first letter, in ms. */
  startMs?: number;
  /** Gap between letters, in ms. */
  stepMs?: number;
};

// Prototype Main.dc.html .line / .ch. React hoists this <style> into <head> once.
// The global reduced-motion rule shortens durations but keeps delays, so the reveal is turned off outright.
const CSS = `
.cc-reveal-line{display:block;overflow:hidden;padding-bottom:.14em;margin-bottom:-.14em}
.cc-reveal-ch{display:inline-block;transform:translateY(112%);animation:cc-reveal-up .95s cubic-bezier(.2,.9,.2,1) forwards}
@keyframes cc-reveal-up{to{transform:none}}
@media (prefers-reduced-motion:reduce){.cc-reveal-ch{animation:none;transform:none}}
`;

/**
 * Headline whose letters rise into place one by one. Pure CSS, server-rendered.
 * Screen readers get the plain sentence once via aria-label; reduced motion shows it static.
 */
export function LetterReveal({ lines, className, startMs = 250, stepMs = 42 }: LetterRevealProps) {
  let index = 0;
  return (
    <>
      <style href="cc-letter-reveal" precedence="default">
        {CSS}
      </style>
      <h1 aria-label={lines.map((l) => l.text).join(" ")} className={cn("font-disp m-0", className)}>
        {lines.map((line) => (
          <span key={line.text} aria-hidden="true" className="cc-reveal-line" style={{ paddingLeft: line.indent }}>
            {Array.from(line.text).map((char, i) => {
              const style: CSSProperties = { animationDelay: `${index++ * stepMs + startMs}ms` };
              return (
                <span key={i} className="cc-reveal-ch" style={style}>
                  {char === " " ? " " : char}
                </span>
              );
            })}
          </span>
        ))}
      </h1>
    </>
  );
}
