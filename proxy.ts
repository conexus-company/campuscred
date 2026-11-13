import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Student session upkeep (gil/06). Server Components cannot write cookies, so this refreshes the
 * Supabase auth cookies on student routes and makes the optimistic redirects:
 * no session on /student goes to /login, a session on /login or /signup goes to /student.
 * Pages and Server Functions still check the session themselves (lib/auth/session.ts).
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isStudent = path === "/student" || path.startsWith("/student/");

  // Supabase not configured (e.g. a fresh clone): nobody can be signed in.
  if (!url || !key) {
    return isStudent ? NextResponse.redirect(new URL("/login", request.url)) : NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
      },
    },
  });

  // getUser() validates the token with Supabase and refreshes it when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = path === "/login" || path === "/signup";
  const redirectTo = isStudent && !user ? "/login" : isAuthPage && user ? "/student" : null;
  if (!redirectTo) return response;

  const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
  // Keep any refreshed or cleared auth cookies on the redirect.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ["/student/:path*", "/login", "/signup"],
};
