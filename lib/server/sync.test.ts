import { describe, expect, test } from "bun:test";
import { startBlock } from "./sync";

describe("startBlock", () => {
  test("starts at the deploy block on a fresh sync_state", () => expect(startBlock(0, 100)).toBe(100));
  test("continues after last_block", () => expect(startBlock(150, 100)).toBe(151));
});
