// Server only: reads the Supabase session cookie.
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Student = {
  id: string;
  email: string;
  /** From the students table (RLS: own row only). Falls back to the email if the row is missing. */
  fullName: string;
};

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * The signed-in student, or a redirect to /login. Call it inside a Suspense boundary
 * (it reads cookies). This is the real guard; the proxy redirect is only a fast path.
 */
export async function getCurrentStudent(): Promise<Student> {
  // Always a request-time check, even when Supabase is not configured at build time.
  await connection();
  if (!supabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase.from("students").select("full_name").eq("id", user.id).maybeSingle();
  const email = user.email ?? "";
  return { id: user.id, email, fullName: (row?.full_name as string | undefined) ?? email };
}
