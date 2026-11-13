"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInMessage } from "./messages";
import { supabaseConfigured } from "./session";

export type SignInState = { error: string | null; email: string };

/** Email and password sign-in for students. Success goes to /student; failure returns a message. */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password.", email };
  if (!supabaseConfigured()) return { error: signInMessage("not_configured"), email };

  let code: string | null = null;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) code = error.code ?? (error.status === 400 ? "invalid_credentials" : "unknown");
  } catch {
    code = "unknown";
  }
  if (code) return { error: signInMessage(code), email };

  redirect("/student");
}

/** Ends the session and returns to the landing page. */
export async function signOut(): Promise<void> {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
