import type { IssuerCredential } from "@/lib/server/issuer-credentials";

export type StudentGroup = {
  /** "" for credentials whose student row is missing. */
  studentNo: string;
  studentName: string;
  credentials: IssuerCredential[];
  active: number;
  revoked: number;
};

/** Groups issuer credential rows by student: students by name, credentials newest first. */
export function groupByStudent(rows: IssuerCredential[]): StudentGroup[] {
  const groups = new Map<string, StudentGroup>();
  for (const r of rows) {
    const key = r.studentNo ?? "";
    let g = groups.get(key);
    if (!g) {
      g = { studentNo: key, studentName: r.studentName ?? "Unknown student", credentials: [], active: 0, revoked: 0 };
      groups.set(key, g);
    }
    g.credentials.push(r);
    g[r.status] += 1;
  }
  const list = [...groups.values()];
  for (const g of list) g.credentials.sort((a, b) => b.issuedAt - a.issuedAt);
  return list.sort((a, b) => a.studentName.localeCompare(b.studentName) || a.studentNo.localeCompare(b.studentNo));
}
