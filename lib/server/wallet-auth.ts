import { getAddress, verifyMessage } from "ethers";
import type { Hex } from "@/lib/contract/config";
import {
  WALLET_ADDRESS_HEADER,
  WALLET_ISSUED_HEADER,
  WALLET_NONCE_HEADER,
  WALLET_SIGNATURE_HEADER,
  buildAuthMessage,
} from "@/lib/wallet/auth-message";
import { hasRole } from "./chain";

const MAX_AGE_MS = 5 * 60_000;
const MAX_SKEW_MS = 60_000;

export class WalletAuthError extends Error {
  constructor(
    readonly code: "unauthorized" | "forbidden",
    readonly status: 401 | 403,
  ) {
    super(code);
  }
}

const unauthorized = () => new WalletAuthError("unauthorized", 401);
const forbidden = () => new WalletAuthError("forbidden", 403);

/** Verifies the signed wallet headers (pr-alvin.md 3.4) and returns the checksummed signer. */
export function verifyWalletAuth(headers: Headers, now = Date.now()): Hex {
  // shortcut: nonces are not stored, so a signed header set is replayable within the 5-minute window; store used nonces with expiry if replay becomes a real threat.
  const address = headers.get(WALLET_ADDRESS_HEADER);
  const nonce = headers.get(WALLET_NONCE_HEADER);
  const issued = headers.get(WALLET_ISSUED_HEADER);
  const signature = headers.get(WALLET_SIGNATURE_HEADER);
  if (!address || !nonce || !issued || !signature) throw unauthorized();

  const issuedMs = Date.parse(issued);
  if (Number.isNaN(issuedMs) || now - issuedMs > MAX_AGE_MS || issuedMs - now > MAX_SKEW_MS) throw unauthorized();

  let signer: string;
  try {
    signer = verifyMessage(buildAuthMessage(nonce, issued), signature);
  } catch {
    throw unauthorized(); // malformed signature
  }
  if (signer.toLowerCase() !== address.toLowerCase()) throw unauthorized();
  return getAddress(signer) as Hex;
}

type RoleCheck = typeof hasRole;

export async function requireIssuer(address: string, check: RoleCheck = hasRole): Promise<void> {
  if (!(await check("issuer", address))) throw forbidden();
}

export async function requireAdmin(address: string, check: RoleCheck = hasRole): Promise<void> {
  if (!(await check("admin", address))) throw forbidden();
}
