import { describe, expect, test } from "bun:test";
import { Wallet } from "ethers";
import { buildAuthMessage } from "@/lib/wallet/auth-message";
import { WalletAuthError, requireAdmin, requireIssuer, verifyWalletAuth } from "./wallet-auth";

const wallet = Wallet.createRandom();
const other = Wallet.createRandom();
const NOW = Date.parse("2026-01-01T12:00:00.000Z");

async function signedHeaders(issuedMs = NOW, nonce = "abc123") {
  const issued = new Date(issuedMs).toISOString();
  return new Headers({
    "x-wallet-address": wallet.address,
    "x-wallet-nonce": nonce,
    "x-wallet-issued": issued,
    "x-wallet-signature": await wallet.signMessage(buildAuthMessage(nonce, issued)),
  });
}

function expectAuthError(fn: () => unknown, status: WalletAuthError["status"]) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(WalletAuthError);
    expect((e as WalletAuthError).status).toBe(status);
    return;
  }
  throw new Error("expected WalletAuthError");
}

describe("verifyWalletAuth", () => {
  test("accepts a valid signature and returns the checksummed address", async () => {
    const h = await signedHeaders();
    h.set("x-wallet-address", wallet.address.toLowerCase());
    expect(verifyWalletAuth(h, NOW)).toBe(wallet.address as `0x${string}`);
  });

  test("rejects a wrong signer", async () => {
    const h = await signedHeaders();
    h.set("x-wallet-address", other.address);
    expectAuthError(() => verifyWalletAuth(h, NOW), 401);
  });

  test("rejects a message older than 5 minutes", async () => {
    const h = await signedHeaders(NOW - 5 * 60_000 - 1);
    expectAuthError(() => verifyWalletAuth(h, NOW), 401);
  });

  test("rejects a message from the future", async () => {
    const h = await signedHeaders(NOW + 2 * 60_000);
    expectAuthError(() => verifyWalletAuth(h, NOW), 401);
  });

  test("rejects a missing header", async () => {
    const h = await signedHeaders();
    h.delete("x-wallet-signature");
    expectAuthError(() => verifyWalletAuth(h, NOW), 401);
  });

  test("rejects a tampered nonce", async () => {
    const h = await signedHeaders();
    h.set("x-wallet-nonce", "other");
    expectAuthError(() => verifyWalletAuth(h, NOW), 401);
  });
});

describe("role checks", () => {
  const holds = async () => true;
  const lacks = async () => false;

  test("requireIssuer", async () => {
    await expect(requireIssuer(wallet.address, holds)).resolves.toBeUndefined();
    await expect(requireIssuer(wallet.address, lacks)).rejects.toMatchObject({ code: "forbidden", status: 403 });
  });

  test("requireAdmin", async () => {
    await expect(requireAdmin(wallet.address, holds)).resolves.toBeUndefined();
    await expect(requireAdmin(wallet.address, lacks)).rejects.toMatchObject({ code: "forbidden", status: 403 });
  });

  test("asks for the right role", async () => {
    const asked: string[] = [];
    const check = async (role: "issuer" | "admin") => (asked.push(role), true);
    await requireIssuer(wallet.address, check);
    await requireAdmin(wallet.address, check);
    expect(asked).toEqual(["issuer", "admin"]);
  });
});
