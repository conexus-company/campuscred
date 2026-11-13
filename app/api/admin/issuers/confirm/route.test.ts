import { describe, expect, test } from "bun:test";
import { Wallet } from "ethers";
import { NextRequest } from "next/server";
import {
  WALLET_ADDRESS_HEADER,
  WALLET_ISSUED_HEADER,
  WALLET_NONCE_HEADER,
  WALLET_SIGNATURE_HEADER,
  buildAuthMessage,
} from "@/lib/wallet/auth-message";
import { POST } from "./route";

const post = (headers: Record<string, string> = {}) =>
  POST(
    new NextRequest("http://localhost/api/admin/issuers/confirm", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: "0x12" }),
    }),
  );

describe("POST /api/admin/issuers/confirm", () => {
  test("rejects a request without wallet headers", async () => {
    const res = await post();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  test("rejects a signature from a different wallet than the claimed address", async () => {
    const signer = Wallet.createRandom();
    const nonce = crypto.randomUUID();
    const issued = new Date().toISOString();
    const res = await post({
      [WALLET_ADDRESS_HEADER]: Wallet.createRandom().address,
      [WALLET_NONCE_HEADER]: nonce,
      [WALLET_ISSUED_HEADER]: issued,
      [WALLET_SIGNATURE_HEADER]: await signer.signMessage(buildAuthMessage(nonce, issued)),
    });
    expect(res.status).toBe(401);
  });
});
