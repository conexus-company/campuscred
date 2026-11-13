import { Plus } from "lucide-react";
import Link from "next/link";
import { CredentialsTable } from "@/components/issuer/credentials-table";
import { WalletCard } from "@/components/issuer/wallet-card";
import { PageBanner } from "@/components/shell/page-banner";
import { buttonVariants } from "@/components/ui/button";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function IssuerPage() {
  return (
    <>
      <PageBanner
        title="Issued credentials"
        subtitle="Every credential you issue is recorded on the chain."
        action={
          <Link href="/issuer/new" className={buttonVariants({ variant: "yellow", size: "pill" })}>
            <Plus />
            Issue new
          </Link>
        }
      />
      <CredentialsTable />
      <div className="flex flex-wrap gap-4">
        <WalletCard />
        <section className="flex flex-[1_1_320px] flex-col gap-3 rounded-3xl border border-cc-line bg-white px-7 py-6">
          <h2 className="font-disp m-0 text-[22px]">About this data</h2>
          <p className="m-0 text-[15px] leading-relaxed text-cc-muted">
            Sample data only. Names and student numbers live off-chain and are visible to issuers only. The chain
            holds the fingerprint and a scrambled student reference.
          </p>
        </section>
      </div>
    </>
  );
}
