import { MOCK_ISSUER } from "@/lib/chain/mock";
import { shortAddress } from "@/lib/format";

/**
 * Issuer display names for the verify screens.
 *
 * Source: Alvin's GET /api/issuers -> [{ wallet, displayName, active }] (alvin/05-issue-api).
 * MOCK: until that route exists, or when it fails, the sample issuer wallet used
 * by lib/chain/mock.ts resolves to "BatStateU Registrar". Remove FALLBACK_NAMES
 * once /api/issuers is live and seeded.
 */
const FALLBACK_NAMES: Record<string, string> = {
  [MOCK_ISSUER.toLowerCase()]: "BatStateU Registrar",
};

/** Don't hold up a verify result waiting for names. */
const ISSUERS_TIMEOUT_MS = 2000;

type IssuerRow = { wallet: string; displayName: string; active?: boolean };
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

let cache: Promise<Map<string, string>> | null = null;

async function load(fetchFn: Fetch): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  try {
    const res = await fetchFn("/api/issuers", { signal: AbortSignal.timeout(ISSUERS_TIMEOUT_MS) });
    if (!res.ok) return names;
    const rows = (await res.json()) as unknown;
    if (Array.isArray(rows)) {
      for (const row of rows as IssuerRow[]) {
        if (typeof row?.wallet === "string" && typeof row?.displayName === "string") {
          names.set(row.wallet.toLowerCase(), row.displayName);
        }
      }
    }
  } catch {
    // Route missing, offline or timed out: fall back below.
  }
  return names;
}

/** Start loading names early (e.g. when a file is dropped). Safe to call repeatedly. */
export function prefetchIssuers(fetchFn: Fetch = fetch): void {
  cache ??= load(fetchFn);
}

/** Display name for an issuer wallet. Never throws; falls back to the short address. */
export async function issuerName(wallet: string, fetchFn: Fetch = fetch): Promise<string> {
  cache ??= load(fetchFn);
  const key = wallet.toLowerCase();
  return (await cache).get(key) ?? FALLBACK_NAMES[key] ?? shortAddress(wallet);
}

/** Tests only. */
export function resetIssuerCache(): void {
  cache = null;
}
