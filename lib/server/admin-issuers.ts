// Pure mapping from a mined issuer event to the `issuers` table change (alvin/10-admin). Server only.
import { getAddress } from "ethers";
import type { IssuerEvent } from "./chain";

export type IssuerRowChange =
  | { kind: "upsert"; row: { wallet: string; display_name: string; active: boolean } }
  | { kind: "update"; wallet: string; active: boolean };

/**
 * Wallets are stored checksummed, like the seed script. The name comes from the event, never the client.
 * `isIssuerNow` is the current on-chain role, so replaying an old tx cannot undo a later add or remove.
 * IssuerRemoved keeps display_name: old credentials still show their issuer (pr-alvin.md decision 3).
 */
export function issuerRowChange(event: IssuerEvent, isIssuerNow: boolean): IssuerRowChange {
  const wallet = getAddress(event.wallet);
  return event.kind === "added"
    ? { kind: "upsert", row: { wallet, display_name: event.name, active: isIssuerNow } }
    : { kind: "update", wallet, active: isIssuerNow };
}
