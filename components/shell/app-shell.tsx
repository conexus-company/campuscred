"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type AppShellNavItem = {
  href: string;
  label: string;
  /** 18px icon, e.g. a lucide-react icon. Decorative: the label names the link. */
  icon?: ReactNode;
  /** "exact" (default) or "prefix" to stay active on child routes. */
  match?: "exact" | "prefix";
};

type AppShellProps = {
  nav: AppShellNavItem[];
  /** Shown at the bottom of the sidebar. Hidden in the compact top bar below 980px. */
  identity: { title: string; subtitle?: string };
  footerLink: { label: string; href: string };
  /** Optional strip at the top right of the main column ("Signed in as issuer", wallet chip). */
  topBar?: ReactNode;
  children: ReactNode;
};

/**
 * Dark sidebar plus main column (prototype Issuer.dc.html and Student.dc.html).
 * Below 980px the sidebar becomes a compact top bar: nav in a row, identity text hidden.
 */
export function AppShell({ nav, identity, footerLink, topBar, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-wrap items-stretch bg-cc-page text-cc-ink">
      <aside
        className={cn(
          "cc-on-dark flex flex-[0_0_236px] flex-col gap-7 bg-cc-side px-4 py-6 text-cc-on-dark",
          "max-[980px]:flex-[1_1_100%] max-[980px]:flex-row max-[980px]:flex-wrap max-[980px]:items-center max-[980px]:gap-x-4 max-[980px]:gap-y-2.5 max-[980px]:px-4 max-[980px]:py-3",
        )}
      >
        <Logo tone="yellow" href="/" className="px-2 text-[22px] text-white" />

        <nav aria-label="Main" className="flex flex-col gap-1.5 max-[980px]:flex-row max-[980px]:flex-wrap max-[980px]:gap-1">
          {nav.map((item) => {
            const active =
              item.match === "prefix"
                ? pathname === item.href || pathname.startsWith(item.href + "/")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold transition-colors duration-200 [&_svg]:size-[18px] [&_svg]:shrink-0",
                  active ? "bg-cc-yellow text-cc-ink" : "text-[#E7DDB4] hover:bg-white/8",
                )}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto flex flex-col gap-1 border-t border-white/14 pt-[18px] pl-2",
            "max-[980px]:mt-0 max-[980px]:ml-auto max-[980px]:border-t-0 max-[980px]:p-0",
          )}
        >
          <div className="text-[15px] font-semibold text-white max-[980px]:hidden">{identity.title}</div>
          {identity.subtitle && <div className="text-sm text-[#CFC59A] max-[980px]:hidden">{identity.subtitle}</div>}
          <Link
            href={footerLink.href}
            className="mt-2.5 flex min-h-8 items-center text-sm font-semibold text-white underline decoration-cc-yellow decoration-2 underline-offset-[6px] max-[980px]:mt-0"
          >
            {footerLink.label}
          </Link>
        </div>
      </aside>

      <main className="flex min-w-0 flex-[1_1_560px] flex-col gap-6 px-8 pt-6 pb-16 max-[980px]:px-4 max-[980px]:pt-5 max-[980px]:pb-12">
        {topBar && (
          <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-cc-muted">{topBar}</div>
        )}
        {children}
      </main>
    </div>
  );
}
