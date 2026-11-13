import Link from "next/link";
import { SiteNav } from "@/components/shell/site-nav";
import { buttonVariants } from "@/components/ui/button";

/** Public nav for the verify screens (prototype Verify.dc.html). */
export function VerifyNav({ cta = { href: "/login", label: "Login" } }: { cta?: { href: string; label: string } }) {
  return (
    <SiteNav
      links={[
        { href: "/verify", label: "(Verify)" },
        { href: "/student", label: "(Students)" },
        { href: "/issuer", label: "(Issuers)" },
      ]}
      actions={
        <Link href={cta.href} className={buttonVariants({ variant: "ink", size: "pill-sm" })}>
          {cta.label}
        </Link>
      }
    />
  );
}
