import { BarChart3, ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { AppShell, type AppShellNavItem } from "@/components/shell/app-shell";
import { RoleGate } from "@/components/wallet/role-gate";

const NAV: AppShellNavItem[] = [
  { href: "/admin", label: "Overview", icon: <BarChart3 /> },
  { href: "/verify", label: "Verify a document", icon: <ShieldCheck /> },
];

// shortcut: minimal shell for alvin/13 stats; gil's alvin/10-admin owns this layout and replaces it.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense>
      <AppShell
        nav={NAV}
        identity={{ title: "Registrar admin", subtitle: "Admin · BSC Testnet" }}
        footerLink={{ label: "Back to site", href: "/" }}
      >
        <RoleGate role="admin">{children}</RoleGate>
      </AppShell>
    </Suspense>
  );
}
