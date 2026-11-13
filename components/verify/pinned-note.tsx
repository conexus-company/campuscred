import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PinnedNoteProps = {
  title: ReactNode;
  children?: ReactNode;
  /** Degrees of tilt. Prototype: 3. */
  rotate?: number;
  className?: string;
};

/**
 * White note held by a black pin, tilted and gently floating (prototype Verify.dc.html).
 * Decorative extra: hidden below 980px. The float stops under prefers-reduced-motion.
 */
export function PinnedNote({ title, children, rotate = 3, className }: PinnedNoteProps) {
  return (
    <div className={cn("relative w-[270px] max-[980px]:hidden", className)} style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="cc-float relative rounded-[18px] bg-white px-5 pt-5 pb-[18px] shadow-[0_26px_40px_-22px_rgba(40,30,0,0.75)]">
        <i
          aria-hidden="true"
          className="absolute -top-2 left-1/2 -ml-2.5 block size-5 rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
          style={{ background: "radial-gradient(circle at 35% 30%, #8a8a8a, #2a2a2a 45%, #000)" }}
        />
        <div className="font-disp mt-1 text-[17px] leading-[1.25] tracking-[-0.02em]">{title}</div>
        {children && <p className="m-0 mt-2 text-sm leading-normal text-cc-muted">{children}</p>}
      </div>
    </div>
  );
}
