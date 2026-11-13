"use client";

import type { VerifyLogEntry } from "./log-rules";

const sent = new Set<string>();

/**
 * Records a verify result for the admin counts. Fire and forget: never blocks or breaks the
 * result screen. Each (hash, result, method) is sent once per page load.
 */
export function logVerification(entry: VerifyLogEntry): void {
  const key = `${entry.docHash}:${entry.result}:${entry.method}`;
  if (sent.has(key)) return;
  sent.add(key);
  try {
    void fetch("/api/verify/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging is best effort.
  }
}
