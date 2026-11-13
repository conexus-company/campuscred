const HEX = "0123456789abcdef";

/** Cheap deterministic mix of (tick, index) so the noise has no visible period. */
function noise(tick: number, i: number): number {
  let x = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(tick + 1, 0x85ebca6b);
  x ^= x >>> 15;
  x = Math.imul(x, 0xc2b2ae35);
  return (x >>> 28) & 15;
}

/**
 * Left-to-right "decrypt" of a hex string. At `tick` 0 every character after
 * the `0x` prefix is noise; by `resolveTicks` the full target is shown.
 * Deterministic, so it renders the same on server and client.
 */
export function scrambleFrame(target: string, tick: number, resolveTicks: number): string {
  const prefix = target.startsWith("0x") ? 2 : 0;
  const progress = resolveTicks <= 0 ? 1 : Math.min(1, Math.max(0, tick / resolveTicks));
  const resolved = prefix + Math.floor((target.length - prefix) * progress);
  let out = target.slice(0, resolved);
  for (let i = resolved; i < target.length; i++) {
    out += HEX[noise(tick, i)];
  }
  return out;
}
