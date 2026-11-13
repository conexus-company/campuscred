"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { claimAccount, type ClaimState } from "@/lib/auth/claim";
import { MIN_PASSWORD } from "@/lib/auth/claim-rules";

const inputClass =
  "h-12 w-full rounded-[14px] border border-cc-line bg-white px-4 text-base text-cc-ink placeholder:text-cc-muted-2 aria-invalid:border-cc-tampered";

export function SignupForm() {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimAccount, {
    error: null,
    studentNo: "",
    email: "",
  });
  const errorId = useId();
  const hintId = useId();
  const invalid = state.error ? true : undefined;
  const describedBy = state.error ? errorId : undefined;

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-[28px] border border-cc-line bg-white px-8 py-9 max-[560px]:px-5 max-[560px]:py-7"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="font-disp m-0 text-[30px] leading-tight">Set up your account</h2>
        <p className="m-0 text-[15px] text-cc-muted">Use the student number and email your registrar has on file.</p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Student number
        <input
          name="studentNo"
          inputMode="numeric"
          autoComplete="off"
          placeholder="22-00001"
          required
          defaultValue={state.studentNo}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          required
          aria-invalid={invalid}
          aria-describedby={[hintId, describedBy].filter(Boolean).join(" ")}
          className={inputClass}
        />
        <span id={hintId} className="text-[13px] font-normal text-cc-muted-2">
          At least {MIN_PASSWORD} characters.
        </span>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Confirm password
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p id={errorId} role="alert" className="m-0 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-[15px] leading-[1.5] text-[#991B1B]">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="ink" size="pill-lg" disabled={pending} className="w-full">
        {pending ? "Setting up…" : "Set up account"}
      </Button>

      <p className="m-0 text-sm leading-[1.55] text-cc-muted-2">
        Already set up?{" "}
        <Link href="/login" className="font-semibold text-cc-ink underline decoration-cc-yellow decoration-2 underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
