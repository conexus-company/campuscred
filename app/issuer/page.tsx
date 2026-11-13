import { WalletCard } from "@/components/issuer/wallet-card";
import { PageBanner } from "@/components/shell/page-banner";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

// shortcut: banner and wallet card only; the credentials table lands in alvin/06-issuer-dashboard.
export default function IssuerPage() {
  return (
    <>
      <PageBanner title="Issued credentials" />
      <WalletCard />
    </>
  );
}
