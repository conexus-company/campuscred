import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { getCurrentStudent } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My credentials · CampusCred" };

// Placeholder for gil/06 (session guard and sign out). gil/07 replaces this with the wallet.
export default function StudentPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1240px] flex-col gap-6 bg-cc-page px-8 py-16 max-[560px]:px-4">
      <Suspense fallback={<p className="m-0 text-cc-muted">Loading your account…</p>}>
        <Signed />
      </Suspense>
    </main>
  );
}

async function Signed() {
  const student = await getCurrentStudent();
  return (
    <div className="flex flex-col gap-4 rounded-[28px] bg-cc-side px-10 py-11 text-white max-[560px]:px-6">
      <h1 className="font-disp m-0 text-[clamp(36px,5vw,64px)]">Hi, {student.fullName}</h1>
      <p className="m-0 text-cc-on-dark-muted">Your credentials will appear here.</p>
      <form action={signOut}>
        <Button type="submit" variant="yellow" size="pill">
          Sign out
        </Button>
      </form>
    </div>
  );
}
