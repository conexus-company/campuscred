import { describe, expect, test } from "bun:test";
import { scrambleFrame } from "./scramble";

const HASH = "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

describe("scrambleFrame", () => {
  test("keeps the length of the target", () => {
    for (const tick of [0, 3, 11, 22, 40]) {
      expect(scrambleFrame(HASH, tick, 22)).toHaveLength(HASH.length);
    }
  });

  test("always keeps the 0x prefix", () => {
    expect(scrambleFrame(HASH, 0, 22).startsWith("0x")).toBe(true);
  });

  test("resolves to the target at and after resolveTicks", () => {
    expect(scrambleFrame(HASH, 22, 22)).toBe(HASH);
    expect(scrambleFrame(HASH, 99, 22)).toBe(HASH);
  });

  test("reveals from left to right", () => {
    const half = scrambleFrame(HASH, 11, 22);
    const shown = 2 + Math.floor((HASH.length - 2) / 2);
    expect(half.slice(0, shown)).toBe(HASH.slice(0, shown));
  });

  test("only emits hex characters", () => {
    expect(scrambleFrame(HASH, 5, 22)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test("is deterministic", () => {
    expect(scrambleFrame(HASH, 7, 22)).toBe(scrambleFrame(HASH, 7, 22));
  });

  test("zero resolveTicks shows the target at once", () => {
    expect(scrambleFrame(HASH, 0, 0)).toBe(HASH);
  });
});
