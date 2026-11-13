import { AdminStats } from "@/components/admin/admin-stats";
import { IssuersCard } from "@/components/admin/issuers-card";
import { PauseCard } from "@/components/admin/pause-card";
import { PageBanner } from "@/components/shell/page-banner";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function AdminPage() {
  return (
    <>
      <PageBanner title="Admin" subtitle="Totals across every issuer, approved issuer wallets, and the emergency pause." />
      <AdminStats />
      <IssuersCard />
      <PauseCard />
    </>
  );
}
