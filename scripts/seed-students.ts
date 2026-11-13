// SAMPLE DATA ONLY: fake students and a demo issuer for the demo. No real student records.
// Run: bun scripts/seed-students.ts  (bun loads .env.local). Safe to re-run.
import { getAddress } from "ethers";
import { studentRef } from "../lib/server/student-ref";
import { createAdminClient } from "../lib/supabase/admin";

const password = process.env.DEMO_STUDENT_PASSWORD;
if (!password) throw new Error("DEMO_STUDENT_PASSWORD is not set");
const issuerEnv = process.env.DEMO_ISSUER_WALLET;
if (!issuerEnv) throw new Error("DEMO_ISSUER_WALLET is not set");
const issuerWallet = getAddress(issuerEnv);

const STUDENTS = [
  { studentNo: "22-00001", fullName: "Sample Student One", email: "student1@example.com" },
  { studentNo: "22-00002", fullName: "Sample Student Two", email: "student2@example.com" },
  { studentNo: "22-00003", fullName: "Sample Student Three", email: "student3@example.com" },
];

const supabase = createAdminClient();

// shortcut: only the first 1000 auth users are scanned, fine for a demo project; paginate if the project grows.
const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;

for (const s of STUDENTS) {
  const existing = list.users.find((u) => u.email === s.email);
  let userId: string;
  if (existing) {
    // Reset the password so the demo password in env always works.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
    userId = existing.id;
    console.log(`auth user exists: ${s.email} (password reset)`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email: s.email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
    console.log(`auth user created: ${s.email}`);
  }

  const { error } = await supabase.from("students").upsert({
    id: userId,
    student_no: s.studentNo,
    full_name: s.fullName,
    email: s.email,
    student_ref: studentRef(s.studentNo),
  });
  if (error) throw error;
  console.log(`students row upserted: ${s.studentNo}`);
}

const { error: issuerError } = await supabase
  .from("issuers")
  .upsert({ wallet: issuerWallet, display_name: "Office of the Registrar (sample)", active: true });
if (issuerError) throw issuerError;
console.log(`issuers row upserted: ${issuerWallet}`);
