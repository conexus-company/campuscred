import type { ChainRecord, Hex, VerifyResultKind } from "@/lib/types/credential";

export type DecideInput = {
  /** The chain record for the hash being judged: the slug's hash, or the uploaded hash on a bare upload. */
  record: ChainRecord;
  openedViaSlug: boolean;
  /** Hash stored for the slug (from /api/verify/[slug]). Missing means the slug is unknown or private. */
  slugDocHash?: Hex;
  uploadedDocHash?: Hex;
};

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function fromStatus(record: ChainRecord): VerifyResultKind {
  if (record.status === "active") return "valid";
  if (record.status === "revoked") return "revoked";
  return "not_found";
}

/**
 * Verify result rules (pr-gil.md 3.7).
 * 1. Slug context + upload: a different hash is always "tampered"; an equal hash follows the chain.
 * 2. Bare upload: chain status only. Never "tampered", because a hash alone
 *    cannot tell an edited file from an unknown one.
 * 3. Unknown or private slug: "not_found".
 */
export function decideResult({ record, openedViaSlug, slugDocHash, uploadedDocHash }: DecideInput): VerifyResultKind {
  if (openedViaSlug) {
    if (!slugDocHash) return "not_found";
    if (uploadedDocHash && !same(uploadedDocHash, slugDocHash)) return "tampered";
    return fromStatus(record);
  }
  return fromStatus(record);
}
