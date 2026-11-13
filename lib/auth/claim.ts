"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "./session";
import { signInMessage } from "./messages";
import { validateClaim } from "./claim-rules";

export type ClaimState = { error: string | null; studentNo: string; email: string };

const NO_MATCH = "We couldn’t match that student number and email. Check both, or ask your registrar.";

/**
 * /signup: a student claims the record their registrar created by student number and email,
 * then picks a password. Each account can be claimed once (app_metadata.claimed).
 *
 * DEMO-GRADE (gil/08, agreed): this does not prove the person owns the email. Anyone who knows
 * a student's number and email can claim an unclaimed account. Before real use, send an email
 * code (signInWithOtp, shouldCreateUser: false) and set the password only after verifyOtp.
 */
export async function claimAccount(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const input = {
    studentNo: String(formData.get("studentNo") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const checked = validateClaim(input);
  const keep = { studentNo: checked.studentNo, email: checked.email };
  if (checked.error) return { error: checked.error, ...keep };
  if (!supabaseConfigured()) return { error: signInMessage("not_configured"), ...keep };

  try {
    const admin = createAdminClient();
    const { data: student, error } = await admin
      .from("students")
      .select("id, email")
      .eq("student_no", checked.studentNo)
      .maybeSingle();
    if (error) throw error;
    // Same message for an unknown number and a wrong email, so neither is confirmed on its own.
    if (!student || String(student.email).toLowerCase() !== checked.email) return { error: NO_MATCH, ...keep };

    const { data: found, error: userError } = await admin.auth.admin.getUserById(student.id as string);
    if (userError || !found.user) return { error: NO_MATCH, ...keep };
    if (found.user.app_metadata?.claimed === true) {
      return { error: "This account is already set up. Sign in instead, or ask your registrar to reset it.", ...keep };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(found.user.id, {
      password: input.password,
      app_metadata: { ...found.user.app_metadata, claimed: true },
    });
    if (updateError) {
      const weak = updateError.code === "weak_password";
      return {
        error: weak
          ? "Pick a stronger password: at least 8 characters, not a common one."
          : "We couldn’t set up your account right now. Try again in a moment.",
        ...keep,
      };
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: checked.email,
      password: input.password,
    });
    if (signInError) return { error: "Your account is ready. Sign in with your new password.", ...keep };
  } catch {
    return { error: "We couldn’t set up your account right now. Try again in a moment.", ...keep };
  }

  redirect("/student");
}
