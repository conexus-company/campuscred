import { LayoutDashboard, ShieldCheck, UserCog } from "lucide-react";
import { Suspense } from "react";
import { AppShell, type AppShellNavItem } from "@/components/shell/app-shell";
import { RoleGate } from "@/components/wallet/role-gate";

const NAV: AppShellNavItem[] = [
  { href: "/admin", label: "Admin", icon: <UserCog /> },
  { href: "/issuer", label: "Issuer dashboard", icon: <LayoutDashboard /> },
  { href: "/verify", label: "Verify a document", icon: <ShieldCheck /> },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Same shape as app/issuer/layout.tsx: AppShell calls usePathname, so it sits behind Suspense.
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
