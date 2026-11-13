// Issues one sample credential from the signer (must hold ISSUER_ROLE) and prints its document hash.
// CONTRACT_ADDRESS (required). PDF_PATH (optional): file to hash; defaults to generated sample bytes.
// STUDENT_REF (optional): bytes32 salted reference; defaults to a sample value. Sample data only.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ethers } from "hardhat";

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS is not set");
  const bytes = process.env.PDF_PATH
    ? readFileSync(process.env.PDF_PATH)
    : Buffer.from(`CampusCred hand-issued sample ${new Date().toISOString()}`);
  const docHash = "0x" + createHash("sha256").update(bytes).digest("hex");
  const studentRef = process.env.STUDENT_REF ?? ethers.id("sample-student-ref");
  const credType = ethers.id("CERT_ENROLLMENT");

  const cc = await ethers.getContractAt("CampusCred", address);
  const tx = await cc.issueCredential(docHash, studentRef, credType);
  const receipt = await tx.wait();
  console.log(`docHash ${docHash}`);
  console.log(`tx https://testnet.bscscan.com/tx/${receipt!.hash}`);
  const record = await cc.verify(docHash);
  console.log(`status on chain: ${record.status} (1 = Active)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
