"use client";

import { useEffect, useState } from "react";
import { scrambleFrame } from "./scramble";
import { useReducedMotion } from "./use-reduced-motion";

type Options = {
  /** Set false to show the target as-is. */
  enabled?: boolean;
  /** Milliseconds per frame. Prototype: 40. */
  frameMs?: number;
  /** Frames until fully revealed. Prototype: 22. */
  resolveTicks?: number;
};

/**
 * Animates `target` from hex noise to the real value, left to right
 * (prototype Verify.dc.html, about one second). Restarts when `target` changes.
 * With prefers-reduced-motion the target is returned immediately.
 */
export function useScrambleText(target: string, { enabled = true, frameMs = 40, resolveTicks = 22 }: Options = {}) {
  const reduced = useReducedMotion();
  const animate = enabled && !reduced;
  const [state, setState] = useState({ target, tick: 0 });

  // Reset when the target changes (render-phase update of own state).
  if (state.target !== target) setState({ target, tick: 0 });

  const done = !animate || state.tick >= resolveTicks;

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setState((s) => (s.target === target ? { target, tick: s.tick + 1 } : s));
    }, frameMs);
    return () => window.clearInterval(id);
  }, [done, target, frameMs]);

  return {
    text: animate ? scrambleFrame(target, state.tick, resolveTicks) : target,
    done,
  };
}
