import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET } from "./route";

test("GET /api/admin/stats rejects a request without wallet headers", async () => {
  const res = await GET(new NextRequest("http://localhost/api/admin/stats"));
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ error: "unauthorized" });
});
