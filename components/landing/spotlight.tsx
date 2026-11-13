"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Footer with a soft white glow that follows the cursor (prototype closing CTA). */
export function Spotlight({ className, children, ...props }: ComponentProps<"footer">) {
  return (
    <footer
      {...props}
      className={cn("cc-land-spot", className)}
      onPointerMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </footer>
  );
}
