"use client";

import { useCallback, useRef } from "react";

const AUTH_TTL_MS = 4 * 60_000; // lib/server/wallet-auth.ts accepts a signed header set for 5 minutes

/**
 * Wraps `signAuthHeaders` so one MetaMask signature covers every API call for 4 minutes.
 * shortcut: the server does not track nonces either; drop this cache if nonces become single-use.
 */
export function useAuthHeaders(signAuthHeaders: () => Promise<Record<string, string>>) {
  const auth = useRef<{ at: number; headers: Record<string, string> } | null>(null);
  return useCallback(async () => {
    if (!auth.current || Date.now() - auth.current.at > AUTH_TTL_MS) {
      auth.current = { at: Date.now(), headers: await signAuthHeaders() };
    }
    return auth.current.headers;
  }, [signAuthHeaders]);
}
