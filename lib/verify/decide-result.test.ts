import { describe, expect, test } from "bun:test";
import { emptyRecord } from "@/lib/chain/mock";
import type { ChainRecord, Hex, VerifyResultKind } from "@/lib/types/credential";
import { decideResult, type DecideInput } from "./decide-result";

const H1 = `0x${"1".repeat(64)}` as Hex;
const H2 = `0x${"2".repeat(64)}` as Hex;

const rec = (status: ChainRecord["status"], docHash: Hex = H1): ChainRecord => ({
  ...emptyRecord(docHash),
  status,
  credType: status === "none" ? "UNKNOWN" : "CERT_ENROLLMENT",
});

const rows: [string, DecideInput, VerifyResultKind][] = [
  // 3.7 rule 2: bare upload on /verify
  ["bare upload, active", { record: rec("active"), openedViaSlug: false, uploadedDocHash: H1 }, "valid"],
  ["bare upload, revoked", { record: rec("revoked"), openedViaSlug: false, uploadedDocHash: H1 }, "revoked"],
  ["bare upload, none", { record: rec("none"), openedViaSlug: false, uploadedDocHash: H1 }, "not_found"],
  // 3.7 rule 1: slug context with an upload
  ["slug, equal hash, active", { record: rec("active"), openedViaSlug: true, slugDocHash: H1, uploadedDocHash: H1 }, "valid"],
  ["slug, equal hash, revoked", { record: rec("revoked"), openedViaSlug: true, slugDocHash: H1, uploadedDocHash: H1 }, "revoked"],
  ["slug, different hash", { record: rec("active"), openedViaSlug: true, slugDocHash: H1, uploadedDocHash: H2 }, "tampered"],
  // 3.7 rule 3: unknown or private slug
  ["slug, private or unknown", { record: rec("none"), openedViaSlug: true }, "not_found"],
  // Extra cases
  ["slug, different hash, other file is a real credential", { record: rec("active", H1), openedViaSlug: true, slugDocHash: H1, uploadedDocHash: H2 }, "tampered"],
  ["slug, different hash, slug revoked", { record: rec("revoked"), openedViaSlug: true, slugDocHash: H1, uploadedDocHash: H2 }, "tampered"],
  ["slug, page load without upload, active", { record: rec("active"), openedViaSlug: true, slugDocHash: H1 }, "valid"],
  ["slug, page load without upload, revoked", { record: rec("revoked"), openedViaSlug: true, slugDocHash: H1 }, "revoked"],
  ["slug, equal hash in a different case", { record: rec("active"), openedViaSlug: true, slugDocHash: H1, uploadedDocHash: H1.toUpperCase().replace("0X", "0x") as Hex }, "valid"],
  ["slug, upload but no slug hash (private)", { record: rec("none"), openedViaSlug: true, uploadedDocHash: H2 }, "not_found"],
];

describe("decideResult (pr-gil.md 3.7)", () => {
  for (const [name, input, expected] of rows) {
    test(`${name} -> ${expected}`, () => {
      expect(decideResult(input)).toBe(expected);
    });
  }

  test("a bare upload can never be tampered", () => {
    for (const status of ["none", "active", "revoked"] as const) {
      expect(decideResult({ record: rec(status), openedViaSlug: false, uploadedDocHash: H2, slugDocHash: H1 })).not.toBe(
        "tampered",
      );
    }
  });
});
