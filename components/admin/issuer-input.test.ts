import { describe, expect, test } from "bun:test";
import { Wallet, ZeroAddress } from "ethers";
import { MAX_NAME_LENGTH, validateIssuerInput } from "./issuer-input";

const wallet = Wallet.createRandom().address;
const errorsOf = (w: string, n: string, active: string[] = []) => {
  const r = validateIssuerInput(w, n, active);
  return r.ok ? {} : r.errors;
};

describe("validateIssuerInput", () => {
  test("rejects an invalid address", () => {
    expect(errorsOf("0x1234", "Office").wallet).toContain("valid wallet address");
    expect(errorsOf("", "Office").wallet).toBeDefined();
  });

  test("rejects the zero address", () => {
    expect(errorsOf(ZeroAddress, "Office").wallet).toBe("The zero address cannot be an issuer.");
  });

  test("rejects an empty or whitespace name", () => {
    expect(errorsOf(wallet, "   ").name).toBe("Enter a display name.");
  });

  test("rejects a name over the limit", () => {
    expect(errorsOf(wallet, "a".repeat(MAX_NAME_LENGTH + 1)).name).toBeDefined();
    expect(errorsOf(wallet, "a".repeat(MAX_NAME_LENGTH)).name).toBeUndefined();
  });

  test("rejects a wallet that is already active, in any case", () => {
    expect(errorsOf(wallet.toLowerCase(), "Office", [wallet]).wallet).toBe("Already an approved issuer.");
  });

  test("accepts valid input, trimmed and checksummed", () => {
    expect(validateIssuerInput(` ${wallet.toLowerCase()} `, "  Registrar  ", [])).toEqual({
      ok: true,
      wallet,
      name: "Registrar",
    });
  });
});
