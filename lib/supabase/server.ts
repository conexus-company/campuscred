import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Session-aware client for Server Components, Server Functions and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
          } catch {
            // Server Components cannot write cookies; the session is refreshed elsewhere.
          }
        },
      },
    },
  );
}
