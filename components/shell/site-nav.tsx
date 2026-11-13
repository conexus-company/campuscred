import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export type SiteNavLink = { href: string; label: string };

type SiteNavProps = {
  /** Text links in the middle. Hidden below 980px. */
  links?: SiteNavLink[];
  /** Right-hand slot, usually one or two pill buttons. */
  actions?: ReactNode;
};

/** Public top nav (prototype Verify.dc.html, VerifyResult.dc.html). */
export function SiteNav({ links = [], actions }: SiteNavProps) {
  return (
    <header className="mx-auto flex h-24 w-full max-w-[1240px] items-center justify-between gap-4 px-8 max-[560px]:px-4">
      <Logo href="/" className="max-[400px]:text-xl" />
      {links.length > 0 && (
        <nav aria-label="Main" className="flex gap-10 text-base font-medium max-[980px]:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="group">
              <RollText>{l.label}</RollText>
            </Link>
          ))}
        </nav>
      )}
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}

/** Text that rolls up to a copy of itself on hover or focus of the parent `.group`. */
export function RollText({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block h-[1.3em] overflow-hidden align-top leading-[1.3em]">
      <span className="block transition-transform duration-500 ease-[cubic-bezier(.2,.85,.2,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="block transition-transform duration-500 ease-[cubic-bezier(.2,.85,.2,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}
