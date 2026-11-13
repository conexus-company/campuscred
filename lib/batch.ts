// Pure helpers for batch issue (/issuer/batch, pr-alvin.md alvin/12).

export const BATCH_CHUNK = 50; // CampusCred.sol MAX_BATCH
export type BatchRow = { studentNo: string; title: string };

/**
 * Parses `student_no,title` lines. Splits on the first comma only, so titles may hold commas;
 * surrounding double quotes on the title are dropped. A first line naming `student_no` is a header.
 * Returns the rows and the 1-based line numbers that could not be read.
 * shortcut: no full RFC 4180 (escaped quotes, newlines in a field); use a CSV parser if registrars export those.
 */
export function parseBatchCsv(text: string): { rows: BatchRow[]; badLines: number[] } {
  const rows: BatchRow[] = [];
  const badLines: number[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    if (i === 0 && /^\s*"?student_no"?\s*,/i.test(line)) return;
    const comma = line.indexOf(",");
    const studentNo = (comma < 0 ? "" : line.slice(0, comma)).trim().replace(/^"(.*)"$/, "$1");
    const title = line.slice(comma + 1).trim().replace(/^"(.*)"$/, "$1").trim();
    if (comma < 0 || !studentNo || !title || title.length > 200) badLines.push(i + 1);
    else rows.push({ studentNo, title });
  });
  return { rows, badLines };
}

/** `2024-0001.pdf` -> `2024-0001`. */
export const studentNoOf = (fileName: string) => fileName.replace(/\.pdf$/i, "").trim();

/** Pairs CSV rows with PDFs named `<student_no>.pdf`. Anything unpaired or repeated is reported, not issued. */
export function matchBatch<F extends { name: string }>(rows: BatchRow[], files: F[]) {
  const count = (keys: string[]) => keys.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map<string, number>());
  const rowCount = count(rows.map((r) => r.studentNo));
  const fileCount = count(files.map((f) => studentNoOf(f.name)));
  const byNo = new Map(files.map((f) => [studentNoOf(f.name), f]));

  const duplicates = [...new Set([...rowCount, ...fileCount].filter(([, n]) => n > 1).map(([k]) => k))];
  const dup = new Set(duplicates);
  const matched = rows.filter((r) => byNo.has(r.studentNo) && !dup.has(r.studentNo)).map((r) => ({ ...r, file: byNo.get(r.studentNo)! }));
  const missingPdf = rows.filter((r) => !byNo.has(r.studentNo)).map((r) => r.studentNo);
  const extraPdf = files.filter((f) => !rowCount.has(studentNoOf(f.name))).map((f) => f.name);
  return { matched, missingPdf, extraPdf, duplicates };
}

export function chunk<T>(items: T[], size = BATCH_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
