// Minimal types for the `bun:test` runner so `bunx tsc --noEmit` passes on
// test files without adding @types/bun. Covers only what our tests use;
// extend as needed, or replace this file with @types/bun if the team adds it.
declare module "bun:test" {
  type Fn = () => void | Promise<void>;

  interface Matchers<R = void> {
    toBe(expected: unknown): R;
    toEqual(expected: unknown): R;
    toStrictEqual(expected: unknown): R;
    toHaveLength(length: number): R;
    toMatch(pattern: RegExp | string): R;
    toContain(item: unknown): R;
    toBeNull(): R;
    toBeDefined(): R;
    toBeUndefined(): R;
    toBeTruthy(): R;
    toBeFalsy(): R;
    toBeGreaterThan(n: number): R;
    toBeLessThan(n: number): R;
    toThrow(expected?: unknown): R;
    not: Matchers<R>;
    resolves: Matchers<Promise<void>>;
    rejects: Matchers<Promise<void>>;
  }

  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: Fn, timeoutMs?: number): void;
  export function it(name: string, fn: Fn, timeoutMs?: number): void;
  export function beforeEach(fn: Fn): void;
  export function afterEach(fn: Fn): void;
  export function expect(actual: unknown): Matchers;
}
