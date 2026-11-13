import { expect, test } from "bun:test";
import type { IssuerCredential } from "@/lib/server/issuer-credentials";
import { groupByStudent } from "./group-by-student";

const row = (docHash: string, studentNo: string | null, studentName: string | null, issuedAt: number, status: "active" | "revoked") =>
  ({ docHash, studentNo, studentName, issuedAt, status }) as IssuerCredential;

test("groups by student, sorts names and newest credentials first, counts statuses", () => {
  const groups = groupByStudent([
    row("0x1", "2021-001", "Zed", 10, "active"),
    row("0x2", "2021-002", "Ana", 5, "active"),
    row("0x3", "2021-001", "Zed", 30, "revoked"),
    row("0x4", null, null, 1, "active"),
  ]);
  expect(groups.map((g) => g.studentName)).toEqual(["Ana", "Unknown student", "Zed"]);
  const zed = groups[2];
  expect(zed.credentials.map((c) => c.docHash)).toEqual(["0x3", "0x1"]);
  expect([zed.active, zed.revoked]).toEqual([1, 1]);
  expect(groups[1].studentNo).toBe("");
});

test("no rows, no groups", () => {
  expect(groupByStudent([])).toEqual([]);
});
