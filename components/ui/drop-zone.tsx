"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  /** Called with a PDF. Non-PDF files never reach this callback. */
  onFile: (file: File) => void;
  /** "lg": centred block (/verify, /issuer/new). "compact": one row (/v/[slug] "Got a copy?"). */
  size?: "lg" | "compact";
  title?: string;
  hint?: string;
  buttonLabel?: string;
  disabled?: boolean;
  className?: string;
};

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Dashed drop target on butter with a "Choose a PDF" button. The button is the
 * keyboard path; drag and drop is an extra for pointer users. PDF only.
 */
export function DropZone({
  onFile,
  size = "lg",
  title = "Drop a PDF here",
  hint = "PDF only. Fingerprinted on this device with SHA-256.",
  buttonLabel = "Choose a PDF",
  disabled,
  className,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  function take(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isPdf(file)) {
      setError(`"${file.name}" is not a PDF. Choose a PDF file.`);
      return;
    }
    setError(null);
    onFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    if (!disabled) take(e.dataTransfer.files);
  }

  const lg = size === "lg";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed border-cc-ink bg-cc-butter transition-colors",
          lg
            ? "flex flex-col items-center gap-[18px] rounded-3xl px-8 py-16 text-center max-[560px]:px-5 max-[560px]:py-10"
            : "flex flex-wrap items-center justify-between gap-4 rounded-[20px] p-7 max-[560px]:p-5",
          over && "bg-[#F7E7A0]",
          disabled && "opacity-60",
        )}
      >
        {lg && (
          <div aria-hidden="true" className="grid size-[72px] place-items-center rounded-full bg-cc-ink">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cc-yellow)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </div>
        )}
        <div className={cn("font-disp", lg ? "text-[34px] leading-[1.05] max-[560px]:text-[28px]" : "text-xl tracking-[-0.02em]")}>
          {title}
        </div>
        {lg && hint && <div className="text-base text-cc-muted">{hint}</div>}
        <Button
          variant="ink"
          size={lg ? "pill-lg" : "pill"}
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            take(e.currentTarget.files);
            e.currentTarget.value = "";
          }}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="m-0 text-sm font-semibold text-[#991B1B]">
          {error}
        </p>
      )}
    </div>
  );
}
