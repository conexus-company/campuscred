"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type VisibilitySwitchProps = {
  docHash: string;
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
};

/**
 * "Public link" switch (FR-12). Flips at once, then saves; on failure it flips back and says so.
 * When off, the credential's share link and QR answer Not found.
 */
export function VisibilitySwitch({ docHash, isPublic, onChange }: VisibilitySwitchProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labelId = useId();
  const hintId = useId();

  async function toggle() {
    const next = !isPublic;
    setSaving(true);
    setError(null);
    onChange(next);
    try {
      const res = await fetch(`/api/credentials/${docHash}/visibility`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { isPublic: boolean };
      onChange(body.isPublic);
    } catch {
      onChange(!next);
      setError("We couldn’t save that change. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-cc-paper px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <span id={labelId} className="text-[15px] font-semibold">
          Public link
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          disabled={saving}
          onClick={toggle}
          className={cn(
            "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-cc-ink transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none",
            isPublic ? "bg-cc-ink" : "bg-white",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-[left] duration-200 motion-reduce:transition-none",
              isPublic ? "left-[30px] bg-cc-yellow" : "left-[3px] bg-cc-ink",
            )}
          />
        </button>
      </div>
      <p id={hintId} className="m-0 text-sm text-cc-muted">
        {isPublic
          ? "On: anyone with the link or QR code can check this credential."
          : "Off: the link and QR code show Not found until you turn this back on."}
      </p>
      {error && (
        <p role="alert" className="m-0 text-sm font-semibold text-[#991B1B]">
          {error}
        </p>
      )}
    </div>
  );
}
