import { FileCheck2, ScanSearch } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageBanner } from "@/components/shell/page-banner";
import { AppShell, type AppShellNavItem } from "@/components/shell/app-shell";
import { APP_SHELL_FOOTER_LINK } from "@/components/shell/app-shell-styles";
import { CredentialCard } from "@/components/student/credential-card";
import { listMyCredentials } from "@/lib/auth/credentials";
import { signOut } from "@/lib/auth/actions";
import { getCurrentStudent } from "@/lib/auth/session";
import type { MyCredential } from "@/lib/types/credential";

export const metadata: Metadata = { title: "My credentials · CampusCred" };

const NAV: AppShellNavItem[] = [
  { href: "/student", label: "My credentials", icon: <FileCheck2 /> },
  { href: "/verify", label: "Verify a document", icon: <ScanSearch /> },
];

/** Artboard "5 · Student wallet". The session guard runs inside the Suspense boundary. */
export default function StudentPage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <Wallet />
    </Suspense>
  );
}

async function Wallet() {
  const student = await getCurrentStudent();
  let credentials: MyCredential[] | null = null;
  let failed = false;
  try {
    credentials = await listMyCredentials();
  } catch {
    failed = true;
  }
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

  return (
    <AppShell
      nav={NAV}
      identity={{ title: student.fullName, subtitle: "Student" }}
      footer={
        <form action={signOut}>
          <button type="submit" className={APP_SHELL_FOOTER_LINK}>
            Sign out
          </button>
        </form>
      }
    >
      <PageBanner
        title="My credentials"
        subtitle="Download a PDF, or share a credential by QR code or link. Anyone can check it in seconds."
      />

      {failed ? (
        <p role="alert" className="m-0 rounded-[22px] border border-cc-line bg-white px-6 py-5 text-[15px]">
          We couldn’t load your credentials. Refresh the page to try again.
        </p>
      ) : credentials && credentials.length > 0 ? (
        <ul className="m-0 flex flex-col gap-3 p-0" aria-label="Your credentials">
          {credentials.map((c, i) => (
            <CredentialCard key={c.docHash} credential={c} siteUrl={siteUrl} defaultOpen={i === 0} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-[22px] border border-dashed border-cc-line bg-cc-paper px-6 py-14 text-center">
          <FileCheck2 aria-hidden="true" className="size-8 text-cc-muted" />
          <p className="m-0 text-lg font-semibold">Your registrar will issue your credentials here.</p>
        </div>
      )}
    </AppShell>
  );
}

function WalletSkeleton() {
  return (
    <div className="flex min-h-dvh bg-cc-page max-[980px]:flex-col" aria-busy="true">
      <div className="flex-[0_0_236px] bg-cc-side max-[980px]:h-16 max-[980px]:flex-none" />
      <div className="flex flex-1 flex-col gap-6 px-8 pt-6 max-[980px]:px-4">
        <div className="h-[220px] rounded-[28px] bg-cc-side/90" />
        <p className="m-0 text-cc-muted">Loading your credentials…</p>
      </div>
    </div>
  );
}
