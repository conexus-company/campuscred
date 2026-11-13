"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { signIn, type SignInState } from "@/lib/auth/actions";

const inputClass =
  "h-12 w-full rounded-[14px] border border-cc-line bg-white px-4 text-base text-cc-ink placeholder:text-cc-muted-2 aria-invalid:border-cc-tampered";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null, email: "" });
  const errorId = useId();
  const invalid = state.error ? true : undefined;

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-[28px] border border-cc-line bg-white px-8 py-9 max-[560px]:px-5 max-[560px]:py-7"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="font-disp m-0 text-[30px] leading-tight">Student login</h2>
        <p className="m-0 text-[15px] text-cc-muted">Use the email and password from your registrar.</p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={invalid}
          aria-describedby={state.error ? errorId : undefined}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={invalid}
          aria-describedby={state.error ? errorId : undefined}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p id={errorId} role="alert" className="m-0 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-[15px] leading-[1.5] text-[#991B1B]">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="ink" size="pill-lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="m-0 text-sm leading-[1.55] text-cc-muted-2">
        First time?{" "}
        <Link href="/signup" className="font-semibold text-cc-ink underline decoration-cc-yellow decoration-2 underline-offset-4">
          Set up your account
        </Link>
      </p>

      <p className="m-0 text-sm leading-[1.55] text-cc-muted-2">
        Issuers sign in with their wallet on the issuer page. Checking a document needs no account.
      </p>
    </form>
  );
}
