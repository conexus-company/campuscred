import { MOCK_HASHES, MOCK_ISSUER } from "@/lib/chain/mock";
import type { CredType, Hex } from "@/lib/types/credential";

/**
 * Share-link fixtures for /v/[slug], used when NEXT_PUBLIC_USE_MOCK_CHAIN=true
 * (until alvin/03-backend-core is merged and seeded). The doc hashes are the
 * mock chain fixtures, so the sample PDFs in public/samples/ match them.
 * Sample data only.
 */
export const MOCK_SLUGS = {
  /** public/samples/sample-valid.pdf, active on the mock chain */
  valid: "k7Qm2xVa9P",
  /** public/samples/sample-revoked.pdf, revoked on the mock chain */
  revoked: "r3Td8wLc5N",
  /** Exists but the student made it private: must behave like an unknown slug. */
  private: "p9Hs4yBe2J",
} as const;

export type MockSlugRow = {
  docHash: Hex;
  credType: CredType;
  title: string;
  issuerName: string;
  issuerWallet: Hex;
  issuedAt: number;
  issueTx: Hex;
  isPublic: boolean;
};

export const MOCK_SLUG_ROWS: Record<string, MockSlugRow> = {
  [MOCK_SLUGS.valid]: {
    docHash: MOCK_HASHES.active,
    credType: "CERT_ENROLLMENT",
    title: "Certificate of Enrollment, 1st Semester AY 2026–2027",
    issuerName: "BatStateU Registrar",
    issuerWallet: MOCK_ISSUER,
    issuedAt: 1793844000,
    issueTx: "0x5c1e8a2f9d3b47e06a1c8f25d9e4b3a7c0f6e1d28b5a94c3e7f02d6b81a9c4e5",
    isPublic: true,
  },
  [MOCK_SLUGS.revoked]: {
    docHash: MOCK_HASHES.revoked,
    credType: "CERT_GRADES",
    title: "Certificate of Grades, 2nd Semester AY 2025–2026",
    issuerName: "BatStateU Registrar",
    issuerWallet: MOCK_ISSUER,
    issuedAt: 1793671200,
    issueTx: "0x8e3b0d7a1f6c29e54b8a3d1c7f0e2b96a4d5c8e13f7b0a2d9c6e4f1b83a5d7c2",
    isPublic: true,
  },
  [MOCK_SLUGS.private]: {
    docHash: MOCK_HASHES.active,
    credType: "CERT_ENROLLMENT",
    title: "Certificate of Enrollment (private)",
    issuerName: "BatStateU Registrar",
    issuerWallet: MOCK_ISSUER,
    issuedAt: 1793844000,
    issueTx: "0x5c1e8a2f9d3b47e06a1c8f25d9e4b3a7c0f6e1d28b5a94c3e7f02d6b81a9c4e5",
    isPublic: false,
  },
};
