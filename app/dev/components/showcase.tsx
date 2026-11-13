"use client";

import { FileText, LayoutGrid, Plus, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { HashText } from "@/components/brand/hash-text";
import { Logo } from "@/components/brand/logo";
import { StatusPill, type PillStatus } from "@/components/brand/status-pill";
import { AppShell } from "@/components/shell/app-shell";
import { PageBanner } from "@/components/shell/page-banner";
import { SiteNav } from "@/components/shell/site-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropZone } from "@/components/ui/drop-zone";
import { QrTile } from "@/components/ui/qr-tile";
import { TabsPill } from "@/components/ui/tabs-pill";
import { Timeline } from "@/components/ui/timeline";

// Sample values only. The hash is SHA-256("abc").
const SAMPLE_HASH = "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const OTHER_HASH = "0xc41e90b75a2d3f61e08c7b94a2d5e1f03b6c8a97d4e2f15b0c3a68e9d7f42b10";
const SAMPLE_LINK = "https://[DOMAIN]/v/k7Qm2xVt9a";
const STATUSES: PillStatus[] = ["valid", "revoked", "tampered", "not_found", "active", "pending", "match"];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-disp m-0 text-[28px]">{title}</h2>
        {note && <p className="m-0 mt-1 text-sm text-cc-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function Showcase() {
  const [tab, setTab] = useState<"all" | "active" | "revoked">("all");
  const [hashKey, setHashKey] = useState(0);
  const [hash, setHash] = useState(SAMPLE_HASH);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-16 pb-24">
      <SiteNav
        links={[
          { href: "/verify", label: "(Verify)" },
          { href: "/student", label: "(Students)" },
          { href: "/issuer", label: "(Issuers)" },
        ]}
        actions={
          <Button variant="ink" size="pill-sm">
            Login
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-16 px-8 max-[560px]:px-4">
        <div>
          <h1 className="font-disp m-0 text-5xl">Components</h1>
          <p className="m-0 mt-2 text-cc-muted">
            Dev-only gallery for gil/00-foundation. Resize to 980px and 360px to check the responsive rules.
          </p>
        </div>

        <Section title="Buttons" note="Pill variants: ink, yellow, ink-outline. Sizes: pill-sm, pill, pill-lg. shadcn variants still work.">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ink" size="pill-lg">Choose a PDF</Button>
            <Button variant="ink" size="pill">Verify a document</Button>
            <Button variant="ink" size="pill-sm">Login</Button>
            <Button variant="yellow" size="pill"><Plus />Issue new</Button>
            <Button variant="ink-outline" size="pill">Share QR and link</Button>
            <Button variant="ink" size="pill" disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button>shadcn default</Button>
            <Button variant="outline">shadcn outline</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="link">link</Button>
          </div>
          <div className="cc-on-dark flex flex-wrap gap-3 rounded-3xl bg-cc-side p-6">
            <Button variant="yellow" size="pill">Yellow on dark</Button>
            <Button variant="ink" size="pill">Ink on dark</Button>
          </div>
        </Section>

        <Section title="Logo">
          <div className="flex flex-wrap items-center gap-8">
            <Logo />
            <Logo markOnly />
            <div className="rounded-2xl bg-cc-side p-4">
              <Logo tone="yellow" className="text-white" />
            </div>
          </div>
        </Section>

        <Section title="Status pill" note="Always a dot plus a word.">
          <div className="flex flex-wrap gap-3">
            {STATUSES.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 rounded-3xl bg-cc-side p-6">
            {STATUSES.map((s) => (
              <StatusPill key={s} status={s} size="md" />
            ))}
          </div>
        </Section>

        <Section title="Hash text" note="First 10 characters highlighted. Scramble respects prefers-reduced-motion.">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="text-[19px] leading-[1.6]">
                <HashText key={hashKey} value={hash} scramble mutedTail={false} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="ink" size="pill-sm" onClick={() => setHashKey((k) => k + 1)}>
                  Replay scramble
                </Button>
                <Button
                  variant="ink-outline"
                  size="pill-sm"
                  onClick={() => setHash((h) => (h === SAMPLE_HASH ? OTHER_HASH : SAMPLE_HASH))}
                >
                  Change value
                </Button>
              </div>
              <div className="text-sm leading-[1.7]">
                <HashText value={SAMPLE_HASH} />
              </div>
              <div className="text-[13px]">
                file <HashText value={OTHER_HASH} highlight="red" short /> · record <HashText value={SAMPLE_HASH} short />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Where this stands</CardTitle>
                <CardDescription>White, line border, 24px radius.</CardDescription>
              </CardHeader>
              <CardContent>This credential is active and matches an issued record.</CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Small card</CardTitle>
                <CardDescription>size=&quot;sm&quot;</CardDescription>
              </CardHeader>
              <CardContent>Tighter spacing.</CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Page banner">
          <PageBanner
            title="Issued credentials"
            subtitle="Every credential you issue is recorded on the chain."
            action={<Button variant="yellow" size="pill"><Plus />Issue new</Button>}
          />
          <PageBanner
            tone="yellow"
            size="hero"
            title="Verify a document"
            subtitle="Upload the PDF you were sent. Your browser fingerprints it and checks the chain. The file is never uploaded."
          />
        </Section>

        <Section title="Tabs pill">
          <TabsPill
            label="Filter by status"
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "revoked", label: "Revoked" },
            ]}
          />
          <p className="m-0 text-sm text-cc-muted">Selected: {tab}</p>
        </Section>

        <Section title="Drop zone" note="PDF only. Try a non-PDF to see the error.">
          <DropZone onFile={(f) => setPicked(f.name)} />
          <DropZone size="compact" onFile={(f) => setPicked(f.name)} />
          <DropZone size="compact" disabled onFile={() => {}} title="Disabled" />
          <p className="m-0 text-sm text-cc-muted" aria-live="polite">
            {picked ? `Picked: ${picked}` : "Nothing picked yet."}
          </p>
        </Section>

        <Section title="Timeline">
          <div className="grid gap-8 sm:grid-cols-2">
            <Timeline
              items={[{ title: "Issued", date: "5 Nov 2026", text: "Recorded on BNB Smart Chain by BatStateU Registrar.", tone: "valid" }]}
            />
            <Timeline
              items={[
                { title: "Revoked", date: "11 Nov 2026", text: "Withdrawn by BatStateU Registrar. Reason: issued in error.", tone: "revoked" },
                { title: "Issued", date: "5 Nov 2026", text: "Recorded on BNB Smart Chain by BatStateU Registrar." },
              ]}
            />
          </div>
        </Section>

        <Section title="QR tile" note={`Encodes ${SAMPLE_LINK}. Scan it with a phone.`}>
          <div className="flex flex-wrap items-end gap-6">
            <QrTile value={SAMPLE_LINK} />
            <QrTile value={SAMPLE_LINK} size={140} />
          </div>
        </Section>

        <Section title="App shell" note="Dark sidebar above 980px, compact top bar below.">
          <div className="overflow-hidden rounded-3xl border border-cc-line">
            <AppShell
              nav={[
                { href: "/dev/components", label: "Dashboard", icon: <LayoutGrid /> },
                { href: "/issuer/new", label: "Issue credential", icon: <FileText /> },
                { href: "/verify", label: "Verify a document", icon: <ShieldCheck /> },
              ]}
              identity={{ title: "Batangas State University", subtitle: "Team Conexus" }}
              footerLink={{ label: "Back to public site", href: "/" }}
              topBar={
                <>
                  <span className="flex items-center gap-2">
                    <i aria-hidden="true" className="block size-2 rounded-full bg-cc-valid" />
                    Signed in as issuer
                  </span>
                  <span className="rounded-full border border-cc-line bg-white px-3.5 py-2 font-mono text-[13px] text-cc-ink">
                    0x4a1b…c9e2 · BSC Testnet
                  </span>
                </>
              }
            >
              <PageBanner title="Issued credentials" subtitle="Sample content inside the shell." />
              <Card>
                <CardContent>Main column: flex 1 1 560px, min-width 0.</CardContent>
              </Card>
            </AppShell>
          </div>
        </Section>
      </div>
    </div>
  );
}
