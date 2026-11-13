import type * as Contract from "@/lib/contract/codes";
import type { PillStatus } from "@/components/brand/status-pill";

// Shared credential types (pr-gil.md 3.4). Keep in sync with both PR docs.

export type Hex = `0x${string}`;
export type CredType =
  | "CERT_ENROLLMENT" | "CERT_GRADES" | "CERT_COMPLETION"
  | "CERT_GOOD_MORAL" | "CERT_SEMINAR" | "DIPLOMA" | "TRANSCRIPT";
export type RevokeReason = "ISSUED_IN_ERROR" | "WRONG_DETAILS" | "REPLACED" | "FRAUD";
export type VerifyResultKind = "valid" | "revoked" | "tampered" | "not_found";

export interface ChainRecord {
  docHash: Hex;
  status: "none" | "active" | "revoked";
  studentRef: Hex;
  credType: CredType | "UNKNOWN";   // decoded with decodeCredType()
  issuer: Hex;
  issuedAt: number | null;          // unix seconds
  revokedAt: number | null;
  revokeReason: RevokeReason | null; // decoded with decodeReason()
}

/** One entry of GET /api/students/me/credentials (pr-gil.md 3.4). No PDF path, no student data. */
export type MyCredential = {
  docHash: Hex;
  slug: string;
  credType: CredType;
  title: string;
  issuerName: string;
  /** Unix seconds, like the chain. */
  issuedAt: number;
  status: "active" | "revoked";
  issueTx: Hex;
  revokeTx?: Hex;
  revokeReason?: RevokeReason;
  isPublic: boolean;
};

// Compile-time guards: tsc fails if these drift from Alvin's codes.ts or the StatusPill.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
export type _CredTypeMatchesCodes = Assert<Same<CredType, Contract.CredType>>;
export type _ReasonMatchesCodes = Assert<Same<RevokeReason, Contract.RevokeReason>>;
export type _PillShowsEveryResult = Assert<VerifyResultKind extends PillStatus ? true : false>;
