"use client";

import { Check, Copy, QrCode } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QrTile } from "@/components/ui/qr-tile";

type ShareSheetProps = {
  /** Full share link, `${NEXT_PUBLIC_SITE_URL}/v/${slug}`. */
  link: string;
  title: string;
  isPublic: boolean;
};

/**
 * "Share QR and link": a button that opens a bottom sheet (native <dialog>, so focus is
 * trapped and Escape closes it) with a real QR code, the link, Copy link and Done.
 */
export function ShareSheet({ link, title, isPublic }: ShareSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const headingId = useId();

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // No clipboard permission: select the text so the student can copy it by hand.
      linkRef.current?.select();
    }
  }

  function close() {
    ref.current?.close();
  }

  return (
    <>
      <Button variant="ink-outline" size="pill-sm" onClick={() => ref.current?.showModal()}>
        <QrCode aria-hidden="true" />
        Share QR and link
      </Button>

      <dialog
        ref={ref}
        aria-labelledby={headingId}
        onClose={() => setCopied(false)}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] bg-cc-paper p-0 text-cc-ink backdrop:bg-cc-ink/55 open:animate-in open:slide-in-from-bottom-8 motion-reduce:open:animate-none"
      >
        <div className="flex flex-col items-center gap-5 px-6 pt-3 pb-7">
          <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-cc-line" />
          <div className="flex w-full flex-col gap-1 text-center">
            <h2 id={headingId} className="font-disp m-0 text-[26px] leading-tight">
              Share this credential
            </h2>
            <p className="m-0 text-[15px] text-cc-muted">{title}</p>
          </div>

          <QrTile value={`${link}?via=qr`} size={240} label={`QR code that opens the verify page for ${title}`} />

          <div className="flex w-full flex-col gap-2">
            <label htmlFor={`${headingId}-link`} className="text-sm font-semibold">
              Share link
            </label>
            <input
              id={`${headingId}-link`}
              ref={linkRef}
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 w-full rounded-xl border border-cc-line bg-white px-3.5 font-mono text-sm focus-visible:outline-3 focus-visible:outline-cc-ink"
            />
          </div>

          <p className="m-0 text-center text-sm text-cc-muted">
            Anyone with this link sees the issuer, type and date. Your name is not shown.
          </p>
          {!isPublic && (
            <p className="m-0 text-center text-sm font-semibold">
              This credential is private, so the link shows Not found until you make it public.
            </p>
          )}

          <div className="flex w-full flex-wrap justify-center gap-3">
            <Button variant="ink" size="pill-sm" onClick={copy}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Link copied" : "Copy link"}
            </Button>
            <Button variant="ink-outline" size="pill-sm" onClick={close}>
              Done
            </Button>
          </div>
          <span className="sr-only" role="status">
            {copied ? "Link copied" : ""}
          </span>
        </div>
      </dialog>
    </>
  );
}
