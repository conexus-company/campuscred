import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageBannerProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-hand slot: a button, or the pinned note on /verify. */
  action?: ReactNode;
  /** "dark" for app screens (issuer, student, results). "yellow" for public pages (/verify). */
  tone?: "dark" | "yellow";
  /** "app" sizes the title for the app shell; "hero" is the larger public banner. */
  size?: "app" | "hero";
  className?: string;
};

/** Rounded banner with a large Poppins title (prototype Issuer, Student and Verify). */
export function PageBanner({ title, subtitle, action, tone = "dark", size = "app", className }: PageBannerProps) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "relative flex flex-wrap items-end justify-between gap-6",
        dark ? "cc-on-dark rounded-[28px] bg-cc-side px-10 py-11 text-white" : "rounded-[36px] bg-cc-yellow px-12 py-14 text-cc-ink",
        "max-[560px]:px-6 max-[560px]:py-8",
        className,
      )}
    >
      <div className={cn("flex flex-col", size === "hero" ? "max-w-[620px] gap-[18px]" : "gap-3.5")}>
        <h1
          className={cn(
            "font-disp m-0",
            size === "hero" ? "text-[clamp(44px,7vw,104px)] leading-[0.92]" : "text-[clamp(40px,5vw,68px)] leading-none",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "m-0 max-w-[560px]",
              size === "hero" ? "text-xl leading-[1.55]" : "text-lg",
              dark ? "text-cc-on-dark-muted" : "text-[#1F1700]",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
