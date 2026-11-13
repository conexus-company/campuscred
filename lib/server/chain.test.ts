import { describe, expect, test } from "bun:test";
import { Interface, Wallet, encodeBytes32String, id } from "ethers";
import { CAMPUSCRED_ABI } from "@/lib/contract/CampusCred.abi";
import type { Hex } from "@/lib/contract/config";
import { decodeIssuedLog, decodeIssuedLogs, decodeRevokedLog, decodeSyncLog } from "./chain";

const iface = new Interface(CAMPUSCRED_ABI);
const CONTRACT = Wallet.createRandom().address;
const OTHER = Wallet.createRandom().address;
const issuer = Wallet.createRandom().address as Hex;
const docHash = id("doc") as Hex;
const ref = id("ref") as Hex;
const credType = id("DIPLOMA") as Hex;
const reason = encodeBytes32String("FRAUD") as Hex;

const log = (address: string, name: string, values: unknown[]) => ({ address, ...iface.encodeEventLog(name, values) });
const issued = (address: string) => log(address, "CredentialIssued", [docHash, ref, credType, issuer]);
const revoked = (address: string) => log(address, "CredentialRevoked", [docHash, reason, issuer]);

describe("event decoding", () => {
  test("decodes CredentialIssued", () => {
    expect(decodeIssuedLog([issued(CONTRACT)], CONTRACT)).toEqual({ docHash, studentRef: ref, credType, issuer });
  });

  test("decodes CredentialRevoked", () => {
    expect(decodeRevokedLog([revoked(CONTRACT)], CONTRACT)).toEqual({ docHash, reason, by: issuer });
  });

  test("matches the contract address case-insensitively", () => {
    expect(decodeIssuedLog([issued(CONTRACT.toLowerCase())], CONTRACT)).not.toBeNull();
  });

  test("ignores logs from another address", () => {
    expect(decodeIssuedLog([issued(OTHER)], CONTRACT)).toBeNull();
    expect(decodeRevokedLog([revoked(OTHER)], CONTRACT)).toBeNull();
  });

  test("ignores the other event", () => {
    expect(decodeIssuedLog([revoked(CONTRACT)], CONTRACT)).toBeNull();
    expect(decodeRevokedLog([issued(CONTRACT)], CONTRACT)).toBeNull();
  });

  test("decodes every CredentialIssued log of a batch", () => {
    const second = log(CONTRACT, "CredentialIssued", [id("doc2"), ref, credType, issuer]);
    const got = decodeIssuedLogs([issued(CONTRACT), revoked(CONTRACT), second, issued(OTHER)], CONTRACT);
    expect(got.map((e) => e.docHash)).toEqual([docHash, id("doc2") as Hex]);
  });
});

describe("decodeSyncLog", () => {
  test("decodes the four mirrored events", () => {
    expect(decodeSyncLog(issued(CONTRACT))).toEqual({ kind: "issued", docHash });
    expect(decodeSyncLog(revoked(CONTRACT))).toEqual({ kind: "revoked", docHash, reason, by: issuer });
    expect(decodeSyncLog(log(CONTRACT, "IssuerAdded", [issuer, "Registrar"]))).toEqual({
      kind: "issuerAdded",
      wallet: issuer,
      name: "Registrar",
    });
    expect(decodeSyncLog(log(CONTRACT, "IssuerRemoved", [issuer]))).toEqual({ kind: "issuerRemoved", wallet: issuer });
  });

  test("ignores other events and foreign logs", () => {
    expect(decodeSyncLog(log(CONTRACT, "Paused", [issuer]))).toBeNull();
    expect(decodeSyncLog({ address: CONTRACT, topics: [id("Other(uint256)")], data: "0x" })).toBeNull();
  });
});
