import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { artifacts, ethers } from "hardhat";

const Status = { None: 0n, Active: 1n, Revoked: 2n };
const h = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
const b32 = (s: string) => ethers.encodeBytes32String(s);

const DOC = h("doc-1");
const DOC2 = h("doc-2");
const STUDENT = h("student-1");
const CRED_TYPE = h("CERT_ENROLLMENT");
const REASON = b32("ISSUED_IN_ERROR");

async function deployFixture() {
  const [admin, issuer, issuer2, outsider] = await ethers.getSigners();
  const cc = await ethers.deployContract("CampusCred", [admin.address]);
  await cc.addIssuer(issuer.address, "Registrar Office");
  await cc.addIssuer(issuer2.address, "Dean Office");
  const ISSUER_ROLE = await cc.ISSUER_ROLE();
  return { cc, admin, issuer, issuer2, outsider, ISSUER_ROLE };
}

async function issuedFixture() {
  const f = await deployFixture();
  await f.cc.connect(f.issuer).issueCredential(DOC, STUDENT, CRED_TYPE);
  return f;
}

describe("CampusCred", () => {
  describe("issuer management", () => {
    it("admin can add an issuer and the name is stored", async () => {
      const { cc, outsider, ISSUER_ROLE } = await loadFixture(deployFixture);
      await expect(cc.addIssuer(outsider.address, "Library"))
        .to.emit(cc, "IssuerAdded")
        .withArgs(outsider.address, "Library");
      expect(await cc.hasRole(ISSUER_ROLE, outsider.address)).to.equal(true);
      expect(await cc.issuerName(outsider.address)).to.equal("Library");
    });

    it("non-admin cannot add or remove an issuer", async () => {
      const { cc, issuer, outsider } = await loadFixture(deployFixture);
      const DEFAULT_ADMIN_ROLE = await cc.DEFAULT_ADMIN_ROLE();
      await expect(cc.connect(outsider).addIssuer(outsider.address, "X"))
        .to.be.revertedWithCustomError(cc, "AccessControlUnauthorizedAccount")
        .withArgs(outsider.address, DEFAULT_ADMIN_ROLE);
      await expect(cc.connect(issuer).removeIssuer(issuer.address))
        .to.be.revertedWithCustomError(cc, "AccessControlUnauthorizedAccount")
        .withArgs(issuer.address, DEFAULT_ADMIN_ROLE);
    });

    it("removeIssuer revokes the role, emits IssuerRemoved and keeps the name", async () => {
      const { cc, issuer, ISSUER_ROLE } = await loadFixture(deployFixture);
      await expect(cc.removeIssuer(issuer.address)).to.emit(cc, "IssuerRemoved").withArgs(issuer.address);
      expect(await cc.hasRole(ISSUER_ROLE, issuer.address)).to.equal(false);
      expect(await cc.issuerName(issuer.address)).to.equal("Registrar Office");
    });
  });

  describe("issueCredential", () => {
    it("issuer can issue; emits CredentialIssued with the right arguments", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      await expect(cc.connect(issuer).issueCredential(DOC, STUDENT, CRED_TYPE))
        .to.emit(cc, "CredentialIssued")
        .withArgs(DOC, STUDENT, CRED_TYPE, issuer.address);
    });

    it("non-issuer (including admin without ISSUER_ROLE) gets NotAllowed", async () => {
      const { cc, admin, outsider } = await loadFixture(deployFixture);
      await expect(cc.connect(outsider).issueCredential(DOC, STUDENT, CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "NotAllowed",
      );
      await expect(cc.connect(admin).issueCredential(DOC, STUDENT, CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "NotAllowed",
      );
    });

    it("issuing the same hash twice reverts with AlreadyIssued (also across issuers)", async () => {
      const { cc, issuer, issuer2 } = await loadFixture(issuedFixture);
      await expect(cc.connect(issuer).issueCredential(DOC, STUDENT, CRED_TYPE))
        .to.be.revertedWithCustomError(cc, "AlreadyIssued")
        .withArgs(DOC);
      await expect(cc.connect(issuer2).issueCredential(DOC, h("other"), CRED_TYPE))
        .to.be.revertedWithCustomError(cc, "AlreadyIssued")
        .withArgs(DOC);
    });

    it("re-issuing a revoked hash still reverts with AlreadyIssued", async () => {
      const { cc, issuer } = await loadFixture(issuedFixture);
      await cc.connect(issuer).revokeCredential(DOC, REASON);
      await expect(cc.connect(issuer).issueCredential(DOC, STUDENT, CRED_TYPE))
        .to.be.revertedWithCustomError(cc, "AlreadyIssued")
        .withArgs(DOC);
    });

    it("zero hash reverts with EmptyHash", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      await expect(cc.connect(issuer).issueCredential(ethers.ZeroHash, STUDENT, CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "EmptyHash",
      );
    });
  });

  describe("verify", () => {
    it("returns the full Active record after issuing", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      await cc.connect(issuer).issueCredential(DOC, STUDENT, CRED_TYPE);
      const issuedAt = await time.latest();
      const c = await cc.verify(DOC);
      expect(c.studentRef).to.equal(STUDENT);
      expect(c.credType).to.equal(CRED_TYPE);
      expect(c.issuer).to.equal(issuer.address);
      expect(c.issuedAt).to.equal(issuedAt);
      expect(c.revokedAt).to.equal(0n);
      expect(c.status).to.equal(Status.Active);
      expect(c.revokeReason).to.equal(ethers.ZeroHash);
    });

    it("returns status None (zeroed record) for an unknown hash and the zero hash, without reverting", async () => {
      const { cc } = await loadFixture(deployFixture);
      for (const hash of [h("unknown"), ethers.ZeroHash]) {
        const c = await cc.verify(hash);
        expect(c.status).to.equal(Status.None);
        expect(c.issuer).to.equal(ethers.ZeroAddress);
        expect(c.issuedAt).to.equal(0n);
      }
    });
  });

  describe("revokeCredential", () => {
    it("issuing wallet can revoke; record and CredentialRevoked event are correct", async () => {
      const { cc, issuer } = await loadFixture(issuedFixture);
      await expect(cc.connect(issuer).revokeCredential(DOC, REASON))
        .to.emit(cc, "CredentialRevoked")
        .withArgs(DOC, REASON, issuer.address);
      const revokedAt = await time.latest();
      const c = await cc.verify(DOC);
      expect(c.status).to.equal(Status.Revoked);
      expect(c.revokedAt).to.equal(revokedAt);
      expect(c.revokeReason).to.equal(REASON);
      expect(c.issuer).to.equal(issuer.address);
      expect(c.studentRef).to.equal(STUDENT);
    });

    it("another issuer cannot revoke; an outsider cannot revoke", async () => {
      const { cc, issuer2, outsider } = await loadFixture(issuedFixture);
      await expect(cc.connect(issuer2).revokeCredential(DOC, REASON)).to.be.revertedWithCustomError(cc, "NotAllowed");
      await expect(cc.connect(outsider).revokeCredential(DOC, REASON)).to.be.revertedWithCustomError(cc, "NotAllowed");
    });

    it("admin can revoke any credential", async () => {
      const { cc, admin } = await loadFixture(issuedFixture);
      await expect(cc.connect(admin).revokeCredential(DOC, REASON))
        .to.emit(cc, "CredentialRevoked")
        .withArgs(DOC, REASON, admin.address);
      expect((await cc.verify(DOC)).status).to.equal(Status.Revoked);
    });

    it("revoking twice reverts with AlreadyRevoked", async () => {
      const { cc, issuer, admin } = await loadFixture(issuedFixture);
      await cc.connect(issuer).revokeCredential(DOC, REASON);
      await expect(cc.connect(issuer).revokeCredential(DOC, REASON))
        .to.be.revertedWithCustomError(cc, "AlreadyRevoked")
        .withArgs(DOC);
      await expect(cc.connect(admin).revokeCredential(DOC, REASON))
        .to.be.revertedWithCustomError(cc, "AlreadyRevoked")
        .withArgs(DOC);
    });

    it("unknown hash reverts with NotFound", async () => {
      const { cc, admin } = await loadFixture(deployFixture);
      const unknown = h("unknown");
      await expect(cc.connect(admin).revokeCredential(unknown, REASON))
        .to.be.revertedWithCustomError(cc, "NotFound")
        .withArgs(unknown);
    });

    it("check order: NotFound before NotAllowed, NotAllowed before AlreadyRevoked", async () => {
      const { cc, issuer, outsider } = await loadFixture(issuedFixture);
      const unknown = h("unknown");
      await expect(cc.connect(outsider).revokeCredential(unknown, REASON))
        .to.be.revertedWithCustomError(cc, "NotFound")
        .withArgs(unknown);
      await cc.connect(issuer).revokeCredential(DOC, REASON);
      await expect(cc.connect(outsider).revokeCredential(DOC, REASON)).to.be.revertedWithCustomError(cc, "NotAllowed");
    });
  });

  describe("removed issuer", () => {
    it("cannot issue, cannot revoke, past credentials stay Active, name kept", async () => {
      const { cc, admin, issuer } = await loadFixture(issuedFixture);
      await cc.connect(admin).removeIssuer(issuer.address);

      await expect(cc.connect(issuer).issueCredential(DOC2, STUDENT, CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "NotAllowed",
      );
      await expect(cc.connect(issuer).issueBatch([DOC2], [STUDENT], CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "NotAllowed",
      );
      // Decision 2: a removed issuer cannot revoke, even their own credential.
      await expect(cc.connect(issuer).revokeCredential(DOC, REASON)).to.be.revertedWithCustomError(cc, "NotAllowed");

      const c = await cc.verify(DOC);
      expect(c.status).to.equal(Status.Active);
      expect(c.issuer).to.equal(issuer.address);
      expect(await cc.issuerName(issuer.address)).to.equal("Registrar Office");

      // Admin can still revoke the removed issuer's credential.
      await expect(cc.connect(admin).revokeCredential(DOC, REASON)).to.emit(cc, "CredentialRevoked");
    });

    it("re-added issuer can issue again and revoke their old credentials", async () => {
      const { cc, admin, issuer } = await loadFixture(issuedFixture);
      await cc.connect(admin).removeIssuer(issuer.address);
      await expect(cc.connect(admin).addIssuer(issuer.address, "Registrar Office (new)"))
        .to.emit(cc, "IssuerAdded")
        .withArgs(issuer.address, "Registrar Office (new)");
      expect(await cc.issuerName(issuer.address)).to.equal("Registrar Office (new)");
      await expect(cc.connect(issuer).issueCredential(DOC2, STUDENT, CRED_TYPE)).to.emit(cc, "CredentialIssued");
      await expect(cc.connect(issuer).revokeCredential(DOC, REASON))
        .to.emit(cc, "CredentialRevoked")
        .withArgs(DOC, REASON, issuer.address);
    });
  });

  describe("issueBatch", () => {
    const docs = (n: number, prefix = "batch") => Array.from({ length: n }, (_, i) => h(`${prefix}-${i}`));

    it("stores every item and emits one CredentialIssued per item", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      const hashes = docs(3);
      const refs = docs(3, "student");
      const tx = cc.connect(issuer).issueBatch(hashes, refs, CRED_TYPE);
      for (let i = 0; i < 3; i++) {
        await expect(tx).to.emit(cc, "CredentialIssued").withArgs(hashes[i], refs[i], CRED_TYPE, issuer.address);
      }
      for (let i = 0; i < 3; i++) {
        const c = await cc.verify(hashes[i]);
        expect(c.status).to.equal(Status.Active);
        expect(c.studentRef).to.equal(refs[i]);
        expect(c.credType).to.equal(CRED_TYPE);
        expect(c.issuer).to.equal(issuer.address);
      }
    });

    it("accepts exactly 50 items", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      const hashes = docs(50);
      await cc.connect(issuer).issueBatch(hashes, docs(50, "student"), CRED_TYPE);
      expect((await cc.verify(hashes[49])).status).to.equal(Status.Active);
    });

    it("rejects more than 50 items with BatchTooLarge(size)", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      await expect(cc.connect(issuer).issueBatch(docs(51), docs(51, "student"), CRED_TYPE))
        .to.be.revertedWithCustomError(cc, "BatchTooLarge")
        .withArgs(51);
    });

    it("rejects mismatched arrays with LengthMismatch", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      await expect(cc.connect(issuer).issueBatch(docs(2), docs(3, "student"), CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "LengthMismatch",
      );
    });

    it("non-issuer gets NotAllowed", async () => {
      const { cc, outsider } = await loadFixture(deployFixture);
      await expect(cc.connect(outsider).issueBatch(docs(1), docs(1, "student"), CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "NotAllowed",
      );
    });

    it("duplicate hash inside the same batch reverts AlreadyIssued and stores nothing", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      const [a, b] = docs(2);
      await expect(cc.connect(issuer).issueBatch([a, b, a], docs(3, "student"), CRED_TYPE))
        .to.be.revertedWithCustomError(cc, "AlreadyIssued")
        .withArgs(a);
      expect((await cc.verify(a)).status).to.equal(Status.None);
      expect((await cc.verify(b)).status).to.equal(Status.None);
    });

    it("hash already on chain reverts AlreadyIssued and stores nothing (all or nothing)", async () => {
      const { cc, issuer } = await loadFixture(issuedFixture);
      const [a] = docs(1);
      await expect(cc.connect(issuer).issueBatch([a, DOC], docs(2, "student"), CRED_TYPE))
        .to.be.revertedWithCustomError(cc, "AlreadyIssued")
        .withArgs(DOC);
      expect((await cc.verify(a)).status).to.equal(Status.None);
    });

    it("zero hash inside a batch reverts EmptyHash and stores nothing", async () => {
      const { cc, issuer } = await loadFixture(deployFixture);
      const [a] = docs(1);
      await expect(
        cc.connect(issuer).issueBatch([a, ethers.ZeroHash], docs(2, "student"), CRED_TYPE),
      ).to.be.revertedWithCustomError(cc, "EmptyHash");
      expect((await cc.verify(a)).status).to.equal(Status.None);
    });
  });

  describe("pause", () => {
    it("only admin can pause and unpause", async () => {
      const { cc, admin, issuer } = await loadFixture(deployFixture);
      await expect(cc.connect(issuer).pause()).to.be.revertedWithCustomError(cc, "AccessControlUnauthorizedAccount");
      await cc.connect(admin).pause();
      await expect(cc.connect(issuer).unpause()).to.be.revertedWithCustomError(cc, "AccessControlUnauthorizedAccount");
    });

    it("when paused, issue/batch/revoke revert with EnforcedPause, verify still works; unpause restores", async () => {
      const { cc, admin, issuer } = await loadFixture(issuedFixture);
      await expect(cc.connect(admin).pause()).to.emit(cc, "Paused").withArgs(admin.address);

      await expect(cc.connect(issuer).issueCredential(DOC2, STUDENT, CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "EnforcedPause",
      );
      await expect(cc.connect(issuer).issueBatch([DOC2], [STUDENT], CRED_TYPE)).to.be.revertedWithCustomError(
        cc,
        "EnforcedPause",
      );
      await expect(cc.connect(issuer).revokeCredential(DOC, REASON)).to.be.revertedWithCustomError(cc, "EnforcedPause");
      await expect(cc.connect(admin).revokeCredential(DOC, REASON)).to.be.revertedWithCustomError(cc, "EnforcedPause");

      expect((await cc.verify(DOC)).status).to.equal(Status.Active);
      expect((await cc.verify(DOC2)).status).to.equal(Status.None);

      await expect(cc.connect(admin).unpause()).to.emit(cc, "Unpaused").withArgs(admin.address);
      await expect(cc.connect(issuer).issueCredential(DOC2, STUDENT, CRED_TYPE))
        .to.emit(cc, "CredentialIssued")
        .withArgs(DOC2, STUDENT, CRED_TYPE, issuer.address);
      await expect(cc.connect(issuer).revokeCredential(DOC, REASON))
        .to.emit(cc, "CredentialRevoked")
        .withArgs(DOC, REASON, issuer.address);
    });
  });

  describe("non-transferability (FR-10)", () => {
    it("ABI has no function named transfer* or approve*, and no ERC-721 interface", async () => {
      const artifact = await artifacts.readArtifact("CampusCred");
      const fnNames = (artifact.abi as { type: string; name?: string }[])
        .filter((e) => e.type === "function")
        .map((e) => e.name ?? "");
      expect(fnNames).to.include("issueCredential"); // sanity: ABI was actually read
      expect(fnNames.filter((n) => /^(transfer|approve|safeTransfer|setApprovalForAll)/i.test(n))).to.deep.equal([]);

      const { cc } = await loadFixture(deployFixture);
      cc.interface.forEachFunction((fn) => {
        expect(fn.name).to.not.match(/^(transfer|approve)/i);
      });
      expect(await cc.supportsInterface("0x80ac58cd")).to.equal(false); // ERC-721
    });
  });
});
