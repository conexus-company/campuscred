import { afterEach, describe, expect, test } from "bun:test";
import { keccak256, toUtf8Bytes } from "ethers";
import { studentRef } from "./student-ref";

const original = process.env.STUDENT_REF_SALT;
afterEach(() => {
  process.env.STUDENT_REF_SALT = original;
});

describe("studentRef", () => {
  test("same input gives the same output", () => {
    process.env.STUDENT_REF_SALT = "salt-a";
    expect(studentRef("22-00001")).toBe(studentRef("22-00001"));
  });

  test("different salt gives a different output", () => {
    process.env.STUDENT_REF_SALT = "salt-a";
    const a = studentRef("22-00001");
    process.env.STUDENT_REF_SALT = "salt-b";
    expect(studentRef("22-00001")).not.toBe(a);
  });

  test("different student number gives a different output", () => {
    process.env.STUDENT_REF_SALT = "salt-a";
    expect(studentRef("22-00001")).not.toBe(studentRef("22-00002"));
  });

  test("matches keccak256 of salt:studentNo", () => {
    process.env.STUDENT_REF_SALT = "salt-a";
    expect(studentRef("22-00001")).toBe(keccak256(toUtf8Bytes("salt-a:22-00001")) as `0x${string}`);
  });

  test.each([undefined, ""])("missing salt (%p) throws", (salt) => {
    if (salt === undefined) delete process.env.STUDENT_REF_SALT;
    else process.env.STUDENT_REF_SALT = salt;
    expect(() => studentRef("22-00001")).toThrow("STUDENT_REF_SALT");
  });
});
