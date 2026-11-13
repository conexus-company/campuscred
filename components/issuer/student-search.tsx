"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

export type Student = { studentNo: string; fullName: string };

type StudentSearchProps = {
  value: Student | null;
  onChange: (student: Student | null) => void;
  authHeaders: () => Promise<Record<string, string>>;
  disabled?: boolean;
};

export const FIELD =
  "min-h-13 w-full rounded-[14px] border-[1.5px] border-[#E0D8B8] bg-white px-4 text-base text-cc-ink hover:border-[#B9AE80] disabled:opacity-60";

/** Student combobox for /issuer/new, backed by GET /api/issuer/students. */
export function StudentSearch({ value, onChange, authHeaders, disabled }: StudentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [active, setActive] = useState(-1);
  const [failed, setFailed] = useState(false);
  const listId = useId();

  useEffect(() => {
    if (value || query.trim().length < 2) return; // server ignores queries under 2 characters
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/issuer/students?q=${encodeURIComponent(query)}`, { headers: await authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = (await res.json()) as Student[];
        if (stale) return;
        setResults(rows);
        setActive(-1);
        setFailed(false);
      } catch {
        if (!stale) setFailed(true);
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query, value, authHeaders]);

  function pick(s: Student) {
    onChange(s);
    setResults([]);
    setQuery("");
  }

  if (value) {
    return (
      <div className={cn(FIELD, "flex items-center justify-between gap-3")}>
        <span>
          {value.fullName} <span className="text-cc-muted">· {value.studentNo}</span>
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="min-h-11 text-sm font-semibold underline decoration-cc-yellow decoration-2 underline-offset-4"
        >
          Change
        </button>
      </div>
    );
  }

  const open = query.trim().length >= 2 && results.length > 0;
  return (
    <div className="relative flex flex-col gap-2">
      <input
        id="student"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search by name or student number"
        disabled={disabled}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1));
          else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
          else if (e.key === "Enter" && active >= 0) pick(results[active]);
          else if (e.key === "Escape") setResults([]);
          else return;
          e.preventDefault();
        }}
        className={FIELD}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-10 m-0 mt-1 w-full list-none overflow-hidden rounded-[14px] border border-cc-line bg-white p-0 shadow-lg"
        >
          {results.map((s, i) => (
            <li
              key={s.studentNo}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className={cn("flex min-h-11 cursor-pointer items-center px-4", i === active && "bg-cc-butter")}
            >
              {s.fullName} <span className="ml-1 text-cc-muted">· {s.studentNo}</span>
            </li>
          ))}
        </ul>
      )}
      {failed && (
        <p role="alert" className="m-0 text-sm font-semibold text-[#991B1B]">
          Could not search students. Try again.
        </p>
      )}
    </div>
  );
}
