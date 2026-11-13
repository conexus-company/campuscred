"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { HashText } from "@/components/brand/hash-text";
import { StatusPill } from "@/components/brand/status-pill";
import type { MyCredential } from "@/lib/types/credential";
import { credTypeLabel, formatDate, revokeReasonText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DownloadButton } from "./download-button";
import { ShareSheet } from "./share-sheet";

type CredentialCardProps = {
  credential: MyCredential;
  /** Base for share links, e.g. https://campuscred.app (no trailing slash). */
  siteUrl: string;
  defaultOpen?: boolean;
};

/** Expandable credential card: title, type, status pill and chevron; details and actions inside. */
export function CredentialCard({ credential: c, siteUrl, defaultOpen = false }: CredentialCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const revoked = c.status === "revoked";

  return (
    <li className="list-none overflow-hidden rounded-[22px] border border-cc-line bg-white">
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[76px] w-full cursor-pointer items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-cc-paper focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-cc-ink max-[560px]:px-4"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[17px] leading-snug font-semibold">{c.title}</span>
            <span className="text-sm font-normal text-cc-muted">{credTypeLabel(c.credType)}</span>
          </span>
          <StatusPill status={c.status} />
          <ChevronDown
            aria-hidden="true"
            className={cn("size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")}
          />
        </button>
      </h2>

      <div id={panelId} hidden={!open} className="border-t border-cc-line px-6 pt-5 pb-6 max-[560px]:px-4">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[15px] max-[420px]:grid-cols-1 max-[420px]:gap-y-0.5">
          <dt className="text-cc-muted">Issuer</dt>
          <dd className="m-0 font-semibold max-[420px]:mb-2">{c.issuerName}</dd>
          <dt className="text-cc-muted">Issued</dt>
          <dd className="m-0 font-semibold max-[420px]:mb-2">{formatDate(c.issuedAt)}</dd>
          <dt className="text-cc-muted">Fingerprint</dt>
          <dd className="m-0 text-sm" title={c.docHash}>
            <HashText value={c.docHash} short />
          </dd>
        </dl>

        {revoked && (
          <p className="mt-4 mb-0 rounded-xl border border-[#F5D9A8] bg-[#FFF7E8] px-4 py-3 text-[15px]">
            <strong>Revoked by your registrar.</strong> Reason: {revokeReasonText(c.revokeReason ?? null)}. Anyone who
            checks this credential sees Revoked.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-start gap-3">
          <DownloadButton docHash={c.docHash} />
          <ShareSheet link={`${siteUrl}/v/${c.slug}`} title={c.title} isPublic={c.isPublic} />
        </div>
      </div>
    </li>
  );
}
