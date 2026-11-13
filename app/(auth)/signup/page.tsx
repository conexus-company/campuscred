import { redirect } from "next/navigation";

/** Sign up is the claim flow in gil/08. Until then students use the accounts their registrar seeded. */
export default function SignupPage() {
  redirect("/login");
}
