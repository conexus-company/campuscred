"use client";

import { useCallback, useRef } from "react";
import { clamp01, useScrollProgress } from "./use-scroll-progress";

/**
 * Paragraph whose words light up from 14% to full opacity as it scrolls through the viewport
 * (prototype "The problem / The fix"). One scroll listener per paragraph, no per-word observers.
 */
export function ScrollLitText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    return clamp01((vh * 0.82 - r.top) / (r.height + vh * 0.28));
  }, []);
  const p = useScrollProgress(measure);
  const words = text.trim().split(/\s+/);
  const n = words.length;

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          className="transition-opacity duration-250 ease-linear"
          style={{ opacity: 0.14 + 0.86 * clamp01(p * (n + 4) - i) }}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
