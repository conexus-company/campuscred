import { Contract, Interface, type BrowserProvider, type ContractTransactionResponse } from "ethers";
import { CAMPUSCRED_ABI } from "@/lib/contract/CampusCred.abi";
import { encodeReason, type RevokeReason } from "@/lib/contract/codes";
import { CONTRACT_ADDRESS, type Hex } from "@/lib/contract/config";

const iface = new Interface(CAMPUSCRED_ABI);

/** CampusCred contract bound to the connected MetaMask signer. */
export async function getWriteContract(provider: BrowserProvider): Promise<Contract> {
  return new Contract(CONTRACT_ADDRESS, CAMPUSCRED_ABI, await provider.getSigner());
}

// Each helper returns once MetaMask has sent the tx; callers await tx.wait() to show a "Confirming" step.
type Tx = Promise<ContractTransactionResponse>;

export const issueCredential = (c: Contract, docHash: Hex, studentRef: Hex, credType32: Hex): Tx =>
  c.issueCredential(docHash, studentRef, credType32);
export const revokeCredential = (c: Contract, docHash: Hex, reason: RevokeReason): Tx =>
  c.revokeCredential(docHash, encodeReason(reason));
export const addIssuer = (c: Contract, wallet: string, name: string): Tx => c.addIssuer(wallet, name);
export const removeIssuer = (c: Contract, wallet: string): Tx => c.removeIssuer(wallet);
export const pause = (c: Contract): Tx => c.pause();
export const unpause = (c: Contract): Tx => c.unpause();

const NOT_ALLOWED = "This wallet is not allowed to do that.";
const MESSAGES: Record<string, string> = {
  AlreadyIssued: "This document was already issued.",
  NotAllowed: NOT_ALLOWED,
  AccessControlUnauthorizedAccount: NOT_ALLOWED,
  EmptyHash: "Choose a PDF first.",
  EnforcedPause: "Issuing is paused by the admin.",
  AlreadyRevoked: "This credential is already revoked.",
  NotFound: "This credential is not on chain.",
};
export const CANCELLED_MESSAGE = "You cancelled the request in MetaMask. Nothing was issued.";
export const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

type ErrLike = {
  code?: unknown;
  data?: unknown;
  revert?: { name?: string } | null;
  error?: { code?: unknown; data?: unknown };
  info?: { error?: { code?: unknown; data?: unknown } };
};

function errorName(e: ErrLike): string | undefined {
  if (e.revert?.name) return e.revert.name;
  for (const data of [e.data, e.info?.error?.data, e.error?.data]) {
    if (typeof data !== "string") continue;
    try {
      const parsed = iface.parseError(data);
      if (parsed) return parsed.name;
    } catch {
      // not CampusCred revert data
    }
  }
}

/** Friendly message for a failed wallet or contract call (pr-alvin.md alvin/04). */
export function mapContractError(err: unknown): string {
  if (!err || typeof err !== "object") return FALLBACK_MESSAGE;
  const e = err as ErrLike;
  const codes = [e.code, e.info?.error?.code, e.error?.code];
  if (codes.includes("ACTION_REJECTED") || codes.includes(4001)) return CANCELLED_MESSAGE;
  return MESSAGES[errorName(e) ?? ""] ?? FALLBACK_MESSAGE;
}
