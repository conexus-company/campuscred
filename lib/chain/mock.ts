import type { ChainRecord, Hex } from "@/lib/types/credential";

/**
 * Mock chain, used when NEXT_PUBLIC_USE_MOCK_CHAIN=true (until CP2).
 * The active and revoked fixtures are the SHA-256 of the sample PDFs in
 * public/samples/, so they verify by real upload on /verify.
 * Sample data only.
 */
export const MOCK_HASHES = {
  /** public/samples/sample-valid.pdf */
  active: "0xe5439593abe67f41e8b08d0abd795ed2b30bbe073027b33c66a90ec54af30c53",
  /** public/samples/sample-revoked.pdf */
  revoked: "0x490a8b5d66aed34421beb047d2d420efe1a8f47192bc22eccff3865003f2cf37",
  /** Not on the mock chain. Any other hash behaves the same. */
  unknown: "0xb802fa193e6d7c41a0958b2f6e1d34c7a9f05e82b6d1c340a7e2d9f61c58b034",
} as const satisfies Record<string, Hex>;

/** Sample issuer wallet. gil/02 maps it to "BatStateU Registrar" until GET /api/issuers exists. */
export const MOCK_ISSUER: Hex = "0x4a1b7e2c9d03f58a6b21c4e07d9f3a85b6e2c9e2";

const ZERO32: Hex = `0x${"0".repeat(64)}`;
const ZERO_ADDRESS: Hex = `0x${"0".repeat(40)}`;

// Fixed sample timestamps (seconds). 5 Nov 2026, 3 Nov 2026 and 11 Nov 2026, 10:00 Asia/Manila.
const NOV_5 = 1793844000;
const NOV_3 = 1793671200;
const NOV_11 = 1794362400;

const FIXTURES: Record<string, Omit<ChainRecord, "docHash">> = {
  [MOCK_HASHES.active]: {
    status: "active",
    studentRef: "0x3be07a915dc4f2e86b1d09a47c35e8f21a6d90b4c7e5f318e0a2b6d94f1c7a53",
    credType: "CERT_ENROLLMENT",
    issuer: MOCK_ISSUER,
    issuedAt: NOV_5,
    revokedAt: null,
    revokeReason: null,
  },
  [MOCK_HASHES.revoked]: {
    status: "revoked",
    studentRef: "0x3be07a915dc4f2e86b1d09a47c35e8f21a6d90b4c7e5f318e0a2b6d94f1c7a53",
    credType: "CERT_GRADES",
    issuer: MOCK_ISSUER,
    issuedAt: NOV_3,
    revokedAt: NOV_11,
    revokeReason: "ISSUED_IN_ERROR",
  },
};

/** What the contract's verify() returns for a hash it has never seen. */
export function emptyRecord(docHash: Hex): ChainRecord {
  return {
    docHash,
    status: "none",
    studentRef: ZERO32,
    credType: "UNKNOWN",
    issuer: ZERO_ADDRESS,
    issuedAt: null,
    revokedAt: null,
    revokeReason: null,
  };
}

/** Short pause so loading states are visible, like a real RPC round trip. */
const MOCK_LATENCY_MS = 350;

export async function mockChainRecord(docHash: Hex, latencyMs = MOCK_LATENCY_MS): Promise<ChainRecord> {
  if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));
  const hit = FIXTURES[docHash.toLowerCase()];
  return hit ? { docHash, ...hit } : emptyRecord(docHash);
}
