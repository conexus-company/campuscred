"use client";

import { useEffect, useState } from "react";

/** 0..1 progress from `measure`, recomputed on scroll and resize (rAF-throttled). Always 1 under reduced motion. */
export function useScrollProgress(measure: () => number | null): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = reduce ? 1 : measure();
      if (p === null) return;
      setProgress((prev) => (Math.abs(prev - p) > 0.005 || (p === 1 && prev !== 1) ? p : prev));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [measure]);

  return progress;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
