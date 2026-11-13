import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "ink": black circle with a yellow check (light backgrounds). "yellow": yellow circle with a black check (dark backgrounds). */
  tone?: "ink" | "yellow";
  /** Render as a link. Omit for a plain mark. */
  href?: string;
  /** Hide the wordmark and show only the circle. */
  markOnly?: boolean;
  className?: string;
};

export function LogoMark({ tone = "ink", className }: { tone?: "ink" | "yellow"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        tone === "ink" ? "bg-cc-ink" : "bg-cc-yellow",
        className,
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={tone === "ink" ? "var(--cc-yellow)" : "var(--cc-ink)"}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export function Logo({ tone = "ink", href, markOnly, className }: LogoProps) {
  const body = (
    <>
      <LogoMark tone={tone} />
      {markOnly ? <span className="sr-only">CampusCred</span> : "CampusCred"}
    </>
  );
  const classes = cn("font-disp inline-flex items-center gap-3 text-2xl", className);
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <span className={classes}>{body}</span>
  );
}
