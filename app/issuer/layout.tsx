import { FilePlus2, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { Suspense } from "react";
import { AppShell, type AppShellNavItem } from "@/components/shell/app-shell";
import { RoleGate } from "@/components/wallet/role-gate";

const NAV: AppShellNavItem[] = [
  { href: "/issuer", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/issuer/new", label: "Issue credential", icon: <FilePlus2 /> },
  { href: "/issuer/students", label: "Students", icon: <Users /> },
  { href: "/verify", label: "Verify a document", icon: <ShieldCheck /> },
];

export default function IssuerLayout({ children }: LayoutProps<"/issuer">) {
  // AppShell calls usePathname, which suspends under /issuer/credential/[hash] (unknown param at build time).
  return (
    <Suspense>
      <AppShell
        nav={NAV}
        identity={{ title: "Registrar's office", subtitle: "Issuer · BSC Testnet" }}
        footerLink={{ label: "Back to site", href: "/" }}
      >
        <RoleGate role="issuer">{children}</RoleGate>
      </AppShell>
    </Suspense>
  );
}
