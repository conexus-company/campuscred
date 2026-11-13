import { Contract, JsonRpcProvider, Network } from "ethers";
import { CAMPUSCRED_ABI } from "@/lib/contract/CampusCred.abi";
import { decodeCredType, decodeReason } from "@/lib/contract/codes";
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URLS } from "@/lib/contract/config";
import type { ChainRecord, Hex } from "@/lib/types/credential";
import { mockChainRecord } from "./mock";

/** Per-RPC timeout before falling back to the next URL (pr-gil.md 8: slow venue Wi-Fi). */
export const RPC_TIMEOUT_MS = 3000;

/** Both RPCs failed or timed out. Screens should say the chain could not be reached, not "Not found". */
export class ChainUnavailableError extends Error {
  constructor(public readonly causes: unknown[]) {
    super("Could not reach BNB Smart Chain. Check your connection and try again.");
    this.name = "ChainUnavailableError";
  }
}

export function isMockChain(): boolean {
  // Inlined at build time for the browser bundle.
  return process.env.NEXT_PUBLIC_USE_MOCK_CHAIN === "true";
}

/** Raw tuple from CampusCred.verify(bytes32). */
export type RawCredential = {
  studentRef: string;
  credType: string;
  issuer: string;
  issuedAt: bigint;
  revokedAt: bigint;
  status: bigint | number;
  revokeReason: string;
};

const STATUS = ["none", "active", "revoked"] as const;

/** Pure decoding of the contract's struct into a ChainRecord. Exported for tests. */
export function decodeRecord(docHash: Hex, raw: RawCredential): ChainRecord {
  const status = STATUS[Number(raw.status)] ?? "none";
  if (status === "none") {
    return {
      docHash,
      status,
      studentRef: raw.studentRef as Hex,
      credType: "UNKNOWN",
      issuer: raw.issuer as Hex,
      issuedAt: null,
      revokedAt: null,
      revokeReason: null,
    };
  }
  const issuedAt = Number(raw.issuedAt);
  const revokedAt = Number(raw.revokedAt);
  return {
    docHash,
    status,
    studentRef: raw.studentRef as Hex,
    credType: decodeCredType(raw.credType),
    issuer: raw.issuer as Hex,
    issuedAt: issuedAt > 0 ? issuedAt : null,
    revokedAt: status === "revoked" && revokedAt > 0 ? revokedAt : null,
    revokeReason: status === "revoked" ? decodeReason(raw.revokeReason) : null,
  };
}

// One read-only contract per RPC URL, created lazily and reused.
const contracts = new Map<string, Contract>();

function contractFor(url: string): Contract {
  let c = contracts.get(url);
  if (!c) {
    // staticNetwork skips the eth_chainId probe on every call.
    const provider = new JsonRpcProvider(url, CHAIN_ID, { staticNetwork: Network.from(CHAIN_ID) });
    c = new Contract(CONTRACT_ADDRESS, CAMPUSCRED_ABI, provider);
    contracts.set(url, c);
  }
  return c;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`RPC timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Reads one credential from the CampusCred contract. No wallet needed.
 * Tries each RPC URL in order with a 3-second timeout. Honors
 * NEXT_PUBLIC_USE_MOCK_CHAIN. Throws ChainUnavailableError if every RPC fails.
 */
export async function readChainRecord(docHash: Hex): Promise<ChainRecord> {
  if (isMockChain()) return mockChainRecord(docHash);

  const causes: unknown[] = [];
  for (const url of RPC_URLS) {
    try {
      const raw = (await withTimeout(contractFor(url).verify(docHash), RPC_TIMEOUT_MS)) as RawCredential;
      return decodeRecord(docHash, raw);
    } catch (e) {
      causes.push(e);
    }
  }
  throw new ChainUnavailableError(causes);
}
