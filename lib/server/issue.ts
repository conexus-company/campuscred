// Pure helpers for the issue API routes (alvin/05-issue-api). Server only.
import { createHash, randomBytes } from "node:crypto";
import type { Hex } from "@/lib/contract/config";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

export function checkPdf(bytes: Uint8Array): "too_large" | "not_pdf" | null {
  if (bytes.length > MAX_PDF_BYTES) return "too_large";
  if (!PDF_MAGIC.every((b, i) => bytes[i] === b)) return "not_pdf";
  return null;
}

/** SHA-256 of the exact bytes, as `0x` + 64 lowercase hex (pr-alvin.md 3.6). */
export const sha256Bytes = (bytes: Uint8Array): Hex =>
  `0x${createHash("sha256").update(bytes).digest("hex")}`;

/** 10 random URL-safe characters for `credentials.share_slug`. */
export const newSlug = (): string => randomBytes(8).toString("base64url").slice(0, 10);

/**
 * Cleans a student search query. Only letters, digits, space, `-`, `.` and `'` survive,
 * so the value is safe inside a PostgREST `.or()` filter. Null when under 2 characters.
 */
export function searchTerm(q: string | null): string | null {
  const term = (q ?? "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim().slice(0, 64);
  return term.length >= 2 ? term : null;
}
