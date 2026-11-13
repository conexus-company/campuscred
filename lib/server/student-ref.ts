import { keccak256, toUtf8Bytes } from "ethers";
import type { Hex } from "@/lib/contract/config";

/** Salted student reference stored on chain (pr-alvin.md 3.6). Server only. */
export function studentRef(studentNo: string): Hex {
  const salt = process.env.STUDENT_REF_SALT;
  if (!salt) throw new Error("STUDENT_REF_SALT is not set");
  return keccak256(toUtf8Bytes(`${salt}:${studentNo}`)) as Hex;
}
