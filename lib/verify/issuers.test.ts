import { beforeEach, describe, expect, test } from "bun:test";
import { MOCK_ISSUER } from "@/lib/chain/mock";
import { issuerName, resetIssuerCache } from "./issuers";

const OTHER = "0x9999999999999999999999999999999999991234";

const respond = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("issuerName", () => {
  beforeEach(() => resetIssuerCache());

  test("uses /api/issuers when it answers", async () => {
    const f = respond(200, [{ wallet: OTHER.toUpperCase().replace("0X", "0x"), displayName: "CICS Dean", active: true }]);
    expect(await issuerName(OTHER, f)).toBe("CICS Dean");
  });

  test("falls back to the mock registrar when the route is missing", async () => {
    expect(await issuerName(MOCK_ISSUER, respond(404, { error: "not_found" }))).toBe("BatStateU Registrar");
  });

  test("falls back to the mock registrar when fetch throws", async () => {
    const boom = async (): Promise<Response> => {
      throw new Error("offline");
    };
    expect(await issuerName(MOCK_ISSUER, boom)).toBe("BatStateU Registrar");
  });

  test("unknown wallet shows the short address", async () => {
    expect(await issuerName(OTHER, respond(200, []))).toBe("0x9999…1234");
  });

  test("ignores malformed rows", async () => {
    expect(await issuerName(OTHER, respond(200, [{ wallet: 5 }, null, "x"]))).toBe("0x9999…1234");
  });

  test("loads the list once", async () => {
    let calls = 0;
    const f = async () => {
      calls++;
      return new Response("[]", { status: 200 });
    };
    await issuerName(OTHER, f);
    await issuerName(MOCK_ISSUER, f);
    expect(calls).toBe(1);
  });
});
