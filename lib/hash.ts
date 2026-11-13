import type { Hex } from "@/lib/types/credential";

/**
 * SHA-256 over the exact bytes of a file, as `0x` + 64 lowercase hex characters.
 * Runs on the device (crypto.subtle); the file is never uploaded. This value is
 * the contract's mapping key (pr-gil.md 3.6).
 */
export async function sha256Hex(file: Blob): Promise<Hex> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  let hex = "";
  for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, "0");
  return `0x${hex}`;
}

/** True for `0x` + 64 hex characters, either case. */
export function isDocHash(value: string): value is Hex {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}
