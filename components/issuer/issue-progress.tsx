"use client";

import { Check, LoaderCircle, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { QrTile } from "@/components/ui/qr-tile";
import { cn } from "@/lib/utils";

export type Phase = "idle" | "uploading" | "wallet" | "confirming" | "saving" | "done";

const STEPS = [
  { phase: "uploading", title: "Uploading", desc: "Storing the PDF in the private bucket." },
  { phase: "wallet", title: "Waiting for wallet", desc: "Approve issueCredential in MetaMask." },
  { phase: "confirming", title: "Confirming", desc: "Waiting for BSC Testnet to mine the transaction." },
  { phase: "saving", title: "Done", desc: "Recorded on-chain. Share link and QR ready." },
] as const;
const ORDER: Phase[] = ["idle", "uploading", "wallet", "confirming", "saving", "done"];

const spin = <LoaderCircle aria-hidden="true" className="size-[18px] flex-none text-cc-yellow motion-safe:animate-spin" />;
const ISLAND: Record<Phase | "error", { width: number; body: ReactNode }> = {
  idle: { width: 200, body: <><i className="block size-2 rounded-full bg-[#8B8160]" /><span className="text-cc-on-dark-muted">Ready to issue</span></> },
  uploading: { width: 280, body: <>{spin}Uploading PDF…</> },
  wallet: { width: 300, body: <><Wallet aria-hidden="true" className="size-[18px] flex-none text-cc-yellow" />Approve in MetaMask</> },
  confirming: { width: 340, body: <>{spin}Confirming on BSC Testnet</> },
  saving: { width: 340, body: <>{spin}Confirming on BSC Testnet</> },
  done: { width: 220, body: <><Check aria-hidden="true" className="size-[18px] flex-none text-cc-yellow" /><span className="font-semibold text-cc-yellow">Issued</span></> },
  error: { width: 220, body: <><i className="block size-2 rounded-full bg-cc-tampered-dark" />Issue failed</> },
};

/** Black status pill that changes width per step (prototype IssuerNew status island). */
export function StatusIsland({ phase, failed }: { phase: Phase; failed: boolean }) {
  const s = ISLAND[failed ? "error" : phase];
  return (
    <div className="flex justify-center">
      <div
        role="status"
        style={{ width: s.width }}
        className="flex h-12 max-w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-cc-ink px-[18px] text-sm whitespace-nowrap text-white shadow-[0_14px_30px_-14px_rgba(20,17,10,0.7)] transition-[width] duration-500 ease-[cubic-bezier(0.3,0.8,0.3,1)]"
      >
        {s.body}
      </div>
    </div>
  );
}

/** Four-step tracker. `failed` freezes the active step without a spinner. */
export function ProgressCard({ phase, failed }: { phase: Phase; failed: boolean }) {
  const at = ORDER.indexOf(phase);
  return (
    <section className="flex flex-col gap-[22px] rounded-3xl border border-cc-line bg-white p-8">
      <h2 className="font-disp m-0 text-2xl">Progress</h2>
      <ol className="m-0 flex list-none flex-col p-0">
        {STEPS.map((step, i) => {
          const idx = ORDER.indexOf(step.phase);
          const done = at > idx;
          const active = at === idx;
          return (
            <li key={step.phase} aria-current={active ? "step" : undefined} className="flex flex-col">
              <div className="flex items-start gap-3.5">
                <div
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 flex-none place-items-center rounded-full text-[13px] font-semibold",
                    done ? "bg-cc-ink" : active ? "border-2 border-cc-ink bg-cc-yellow" : "border-2 border-[#E0D8B8] text-[#8B8160]",
                  )}
                >
                  {done ? (
                    <Check className="size-4 text-cc-yellow" strokeWidth={3} />
                  ) : active && !failed ? (
                    <LoaderCircle className="size-4 motion-safe:animate-spin" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="flex flex-col gap-0.5 pt-1">
                  <div className={cn("text-base", done || active ? "font-bold" : "font-medium text-[#8B8160]")}>
                    {step.title}
                    {done && <span className="sr-only"> (done)</span>}
                  </div>
                  <div className="text-sm leading-[1.45] text-cc-muted-2">{step.desc}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div aria-hidden="true" className={cn("my-0 ml-[15px] h-[30px] w-[3px] rounded-sm", done ? "bg-cc-ink" : "bg-cc-line")} />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-4 rounded-3xl border-2 border-cc-tampered bg-white p-7">
      <p className="m-0 font-semibold">{message}</p>
      <Button variant="ink" size="pill-sm" className="self-start" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function SuccessCard({ slug, txUrl, onAgain }: { slug: string; txUrl: string; onAgain: () => void }) {
  const link = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/v/${slug}`;
  return (
    <section className="flex flex-col gap-5 rounded-[28px] bg-cc-yellow p-8">
      <h2 className="font-disp m-0 text-[28px] leading-[1.05]">Issued on BSC Testnet.</h2>
      <div className="flex flex-wrap items-center gap-5">
        <QrTile value={link} size={128} />
        <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
          <div className="text-[13px] font-semibold text-[#2B2200]">Share link</div>
          <a href={link} className="font-mono text-[13px] break-all underline underline-offset-4">
            {link}
          </a>
        </div>
      </div>
      <a
        href={txUrl}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-9 items-center font-mono text-[13px] underline underline-offset-[5px]"
      >
        View transaction on BscScan Testnet
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="ink-outline" size="pill-sm" onClick={onAgain}>
          Issue another
        </Button>
        <Link href="/issuer" className={buttonVariants({ variant: "ink", size: "pill-sm" })}>
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
