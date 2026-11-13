import { decodeBytes32String, encodeBytes32String, id } from "ethers";
import type { Hex } from "./config";

export const CRED_TYPES = [
  "CERT_ENROLLMENT",
  "CERT_GRADES",
  "CERT_COMPLETION",
  "CERT_GOOD_MORAL",
  "CERT_SEMINAR",
  "DIPLOMA",
  "TRANSCRIPT",
] as const;
export type CredType = (typeof CRED_TYPES)[number];

export const REVOKE_REASONS = ["ISSUED_IN_ERROR", "WRONG_DETAILS", "REPLACED", "FRAUD"] as const;
export type RevokeReason = (typeof REVOKE_REASONS)[number];

export const REVOKE_REASON_LABELS: Record<RevokeReason, string> = {
  ISSUED_IN_ERROR: "Issued in error",
  WRONG_DETAILS: "Wrong details",
  REPLACED: "Replaced by a corrected credential",
  FRAUD: "Fraud",
};

/** keccak256 of the UTF-8 code, as stored on chain. */
export const encodeCredType = (code: CredType): Hex => id(code) as Hex;

const CRED_TYPE_BY_HASH = new Map<string, CredType>(CRED_TYPES.map((c) => [id(c), c]));

export const decodeCredType = (hash: string): CredType | "UNKNOWN" =>
  CRED_TYPE_BY_HASH.get(hash.toLowerCase()) ?? "UNKNOWN";

/** bytes32 short string, e.g. "FRAUD" padded with zeros. */
export const encodeReason = (code: RevokeReason): Hex => encodeBytes32String(code) as Hex;

export function decodeReason(value: string): RevokeReason | null {
  try {
    const s = decodeBytes32String(value);
    return (REVOKE_REASONS as readonly string[]).includes(s) ? (s as RevokeReason) : null;
  } catch {
    return null; // not a valid bytes32 string
  }
}
