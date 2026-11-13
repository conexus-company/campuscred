import { AdminStats } from "@/components/admin/admin-stats";
import { PageBanner } from "@/components/shell/page-banner";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function AdminPage() {
  return (
    <>
      <PageBanner title="Admin" subtitle="Totals across every issuer." />
      <AdminStats />
    </>
  );
}
