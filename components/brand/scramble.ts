const HEX = "0123456789abcdef";

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
    out += HEX[(tick * 7 + i * 13 + i * i) % 16];
  }
  return out;
}
