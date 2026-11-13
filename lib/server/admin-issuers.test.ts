import { describe, expect, test } from "bun:test";
import { Wallet } from "ethers";
import type { Hex } from "@/lib/contract/config";
import { issuerRowChange } from "./admin-issuers";

const wallet = Wallet.createRandom().address as Hex;
const lower = wallet.toLowerCase() as Hex;

describe("issuerRowChange", () => {
  test("IssuerAdded upserts an active row with a checksummed wallet and the event's name", () => {
    expect(issuerRowChange({ kind: "added", wallet: lower, name: "Registrar" }, true)).toEqual({
      kind: "upsert",
      row: { wallet, display_name: "Registrar", active: true },
    });
  });

  test("IssuerRemoved deactivates the checksummed wallet and leaves the name alone", () => {
    expect(issuerRowChange({ kind: "removed", wallet: lower }, false)).toEqual({
      kind: "update",
      wallet,
      active: false,
    });
  });

  test("a replayed IssuerAdded for a since-removed wallet stays inactive", () => {
    const change = issuerRowChange({ kind: "added", wallet: lower, name: "Registrar" }, false);
    expect(change).toEqual({ kind: "upsert", row: { wallet, display_name: "Registrar", active: false } });
  });
});
