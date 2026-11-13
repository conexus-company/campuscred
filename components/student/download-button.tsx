"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; url: string; expiresAt: number }
  | { kind: "expired" }
  | { kind: "error"; message: string; signIn?: boolean };

/** "0:59" */
function clock(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const TTL = 60;

/**
 * Download PDF: asks the server for a 60-second signed URL, starts the download
 * (the URL is sent as an attachment, so the page stays), then shows the time left
 * with a draining bar. At 0 it offers a fresh link.
 */
export function DownloadButton({ docHash }: { docHash: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state.kind !== "ready") return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= state.expiresAt * 1000) setState({ kind: "expired" });
    }, 250);
    return () => window.clearInterval(id);
  }, [state]);

  async function request() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/credentials/${docHash}/download-url`, { method: "POST" });
      if (res.status === 401) {
        setState({ kind: "error", message: "Your session ended. Sign in again to download.", signIn: true });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const { url, expiresAt } = (await res.json()) as { url: string; expiresAt: number };
      setNow(Date.now());
      setState({ kind: "ready", url, expiresAt });
      window.location.assign(url);
    } catch {
      setState({ kind: "error", message: "We couldn’t get your PDF. Check your connection and try again." });
    }
  }

  if (state.kind === "ready") {
    // Floor, capped at TTL - 1: the first frame reads "0:59", as on the artboard.
    const left = Math.min(TTL - 1, Math.floor(state.expiresAt - now / 1000));
    const pct = Math.max(0, Math.min(100, ((state.expiresAt - now / 1000) / TTL) * 100));
    return (
      <div className="flex min-w-[220px] flex-1 flex-col gap-2">
        {/* Announced once; the ticking clock is hidden from screen readers. */}
        <p className="sr-only" role="status">
          PDF ready. The download link expires in one minute.
        </p>
        <p className="m-0 text-[15px] font-semibold" aria-hidden="true">
          PDF ready, expires in {clock(left)}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-cc-track" aria-hidden="true">
          <div
            className="h-full rounded-full bg-cc-yellow transition-[width] duration-300 ease-linear motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <a href={state.url} className="self-start text-sm font-semibold underline decoration-cc-yellow decoration-2 underline-offset-4">
          Download didn’t start? Open the PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ink" size="pill-sm" onClick={request} disabled={state.kind === "loading"}>
        <Download aria-hidden="true" />
        {state.kind === "loading" ? "Preparing…" : state.kind === "expired" ? "Get a new download link" : "Download PDF"}
      </Button>
      {state.kind === "expired" && (
        <p className="m-0 text-sm text-cc-muted" role="status">
          That link expired. Download links last one minute.
        </p>
      )}
      {state.kind === "error" && (
        <p className="m-0 text-sm font-semibold text-cc-tampered" role="alert">
          {state.message}{" "}
          {state.signIn && (
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
