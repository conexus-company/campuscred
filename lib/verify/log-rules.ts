import type { Hex, VerifyResultKind } from "@/lib/types/credential";

/** One verification event (pr-gil.md 3.4, POST /api/verify/log). No IP, no personal data. */
export type VerifyMethod = "qr" | "link" | "upload";
export type VerifyLogEntry = { docHash: Hex; result: VerifyResultKind; method: VerifyMethod };

const RESULTS: readonly string[] = ["valid", "tampered", "revoked", "not_found"];
const METHODS: readonly string[] = ["qr", "link", "upload"];
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

/** Accepts exactly { docHash, result, method }; anything else (extra fields included) is dropped. */
export function parseLogEntry(body: unknown): VerifyLogEntry | null {
  if (!body || typeof body !== "object") return null;
  const { docHash, result, method } = body as Record<string, unknown>;
  if (typeof docHash !== "string" || !HASH_RE.test(docHash)) return null;
  if (typeof result !== "string" || !RESULTS.includes(result)) return null;
  if (typeof method !== "string" || !METHODS.includes(method)) return null;
  return { docHash: docHash.toLowerCase() as Hex, result: result as VerifyResultKind, method: method as VerifyMethod };
}
