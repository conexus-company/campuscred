import { describe, expect, test } from "bun:test";
import { chunk, matchBatch, parseBatchCsv } from "./batch";

describe("parseBatchCsv", () => {
  test("skips the header and blank lines, keeps commas in titles", () => {
    const csv = 'student_no,title\r\n2024-0001,Diploma, BS CS\n\n2024-0002,"Certificate of Enrollment"\n';
    expect(parseBatchCsv(csv)).toEqual({
      rows: [
        { studentNo: "2024-0001", title: "Diploma, BS CS" },
        { studentNo: "2024-0002", title: "Certificate of Enrollment" },
      ],
      badLines: [],
    });
  });

  test("reports lines with no comma, no student number or no title", () => {
    expect(parseBatchCsv("2024-0001\n,Title\n2024-0003,\n2024-0004,ok").badLines).toEqual([1, 2, 3]);
  });

  test("rejects titles over 200 characters", () => {
    expect(parseBatchCsv(`2024-0001,${"x".repeat(201)}`).badLines).toEqual([1]);
  });
});

describe("matchBatch", () => {
  const rows = [
    { studentNo: "A", title: "t" },
    { studentNo: "B", title: "t" },
    { studentNo: "C", title: "t" },
    { studentNo: "C", title: "t2" },
  ];
  const files = [{ name: "A.pdf" }, { name: "B.PDF" }, { name: "C.pdf" }, { name: "Z.pdf" }];

  test("pairs rows by file name and reports the rest", () => {
    const m = matchBatch([...rows, { studentNo: "D", title: "t" }], files);
    expect(m.matched.map((r) => r.file.name)).toEqual(["A.pdf", "B.PDF"]);
    expect(m.missingPdf).toEqual(["D"]);
    expect(m.extraPdf).toEqual(["Z.pdf"]);
    expect(m.duplicates).toEqual(["C"]);
  });
});

test("chunk splits into groups of at most 50", () => {
  expect(chunk(Array.from({ length: 101 }, (_, i) => i)).map((c) => c.length)).toEqual([50, 50, 1]);
});
