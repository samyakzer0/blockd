/**
 * BlockD Unified Evidence Service (JavaScript / Node.js)
 * Orchestrates full evidence lifecycle:
 * Ingest -> Encrypt (AES-256-GCM) -> Pin IPFS -> On-Chain Smart Contract Registration -> Chain of Custody Audit
 */

const { CryptoEngine } = require("./cryptoEngine");
const { IPFSClient } = require("./storage/ipfsClient");
const {
  MockContractEngine,
  Role,
  EvidenceType,
  EvidenceStatus,
  AccessAction,
} = require("./web3Client");

class EvidenceService {
  constructor(options = {}) {
    this.contract = options.contractEngine || new MockContractEngine();
    this.ipfs = options.ipfsClient || new IPFSClient({ useMockStore: true });
  }

  /**
   * Complete Ingestion Workflow
   */
  async ingestEvidence({
    officerAddress,
    caseId,
    evidenceType,
    title,
    rawPayload,
    requiresWarrant = false,
  }) {
    const rawBuffer = Buffer.isBuffer(rawPayload)
      ? rawPayload
      : Buffer.from(rawPayload, "utf-8");

    // 1. Generate AES-256 Key & Encrypt
    const keyHex = CryptoEngine.generateAesKeyHex();
    const encryptedPackage = CryptoEngine.encrypt(rawBuffer, keyHex);

    // 2. Upload Encrypted Envelope to IPFS
    const packageBytes = Buffer.from(JSON.stringify(encryptedPackage), "utf-8");
    const ipfsReceipt = await this.ipfs.uploadBytes(
      packageBytes,
      `${caseId}_${title}.enc`
    );
    const cid = ipfsReceipt.cid;

    // 3. Register on Blockchain Smart Contract
    const evidenceId = this.contract.registerEvidence(
      officerAddress,
      caseId,
      evidenceType,
      title,
      cid,
      encryptedPackage.sha256Checksum,
      keyHex,
      requiresWarrant
    );

    return {
      evidenceId,
      caseId,
      title,
      ipfsCid: cid,
      sha256Checksum: encryptedPackage.sha256Checksum,
      submittingOfficer: officerAddress,
      encryptionKeyHex: keyHex,
      gatewayUrl: ipfsReceipt.gatewayUrl,
      status: "REGISTERED_ON_CHAIN",
    };
  }

  /**
   * Complete Retrieval & Decryption Workflow with Cryptographic Verification
   */
  async retrieveAndDecrypt({
    officerAddress,
    evidenceId,
    purpose,
    decryptionKeyHex,
  }) {
    const record = this.contract.getEvidence(evidenceId);

    // 1. Log access on-chain
    this.contract.logAccess(
      officerAddress,
      evidenceId,
      AccessAction.DECRYPT,
      purpose,
      "Decrypted and validated for case analysis"
    );

    // 2. Fetch ciphertext from IPFS
    const rawPackageBytes = await this.ipfs.fetchBytes(record.ipfsCid);
    const encryptedPackage = JSON.parse(rawPackageBytes.toString("utf-8"));

    // 3. Decrypt payload
    const decryptedPayload = CryptoEngine.decrypt(
      encryptedPackage,
      decryptionKeyHex
    );

    // 4. Verify on-chain cryptographic integrity
    const computedHash = CryptoEngine.computeSha256(decryptedPayload);
    const isAuthentic = this.contract.verifyIntegrity(evidenceId, computedHash);

    if (!isAuthentic) {
      this.contract.updateEvidenceStatus(
        officerAddress,
        evidenceId,
        EvidenceStatus.TAMPERED_FLAGGED,
        "Calculated SHA-256 hash does not match immutable on-chain record"
      );
      throw new Error(
        "CRITICAL SECURITY ALERT: Evidence has been tampered with!"
      );
    }

    return {
      evidenceId,
      caseId: record.caseId,
      title: record.title,
      payload: decryptedPayload,
      sha256Verified: true,
      status: record.status,
    };
  }

  /**
   * Fetches the complete immutable Chain of Custody audit trail.
   */
  getAuditTrail(evidenceId) {
    return this.contract.getChainOfCustody(evidenceId);
  }
}

module.exports = {
  EvidenceService,
  Role,
  EvidenceType,
  EvidenceStatus,
  AccessAction,
};
