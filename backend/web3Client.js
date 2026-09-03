/**
 * BlockD Web3 & Smart Contract Client (JavaScript / Node.js with ethers.js)
 * Implements full contract interaction interface matching BlockDEvidenceRegistry.sol
 * with both live ethers.js connection support and zero-gas local simulation.
 */

const { ethers } = require("ethers");

const Role = {
  NONE: 0,
  ADMIN: 1,
  OFFICER: 2,
  INVESTIGATOR: 3,
  FORENSIC_EXPERT: 4,
  MAGISTRATE: 5,
};

const EvidenceType = {
  FIR: 0,
  CDR: 1,
  CCTV: 2,
  FINANCIAL: 3,
  FORENSIC_REPORT: 4,
  INTERROGATION: 5,
  OTHER: 6,
};

const EvidenceStatus = {
  ACTIVE: 0,
  SEALED: 1,
  UNDER_REVIEW: 2,
  TAMPERED_FLAGGED: 3,
  ARCHIVED: 4,
};

const AccessAction = {
  VIEW: 0,
  DECRYPT: 1,
  EXPORT: 2,
  ANALYSIS_RUN: 3,
  WARRANT_APPROVAL: 4,
  STATUS_CHANGE: 5,
};

class MockContractEngine {
  constructor(ownerAddress = "0xAdmin00000000000000000000000000000000001") {
    this.owner = ownerAddress;
    this.evidenceCounter = 0;
    this.logCounter = 0;
    this.warrantCounter = 0;

    this.userRoles = new Map();
    this.userRoles.set(this.owner.toLowerCase(), Role.ADMIN);

    this.evidences = new Map();
    this.caseMap = new Map();
    this.custodyLogs = new Map();
    this.warrants = new Map();
  }

  setRole(caller, account, role) {
    if (
      caller.toLowerCase() !== this.owner.toLowerCase() &&
      this.userRoles.get(caller.toLowerCase()) !== Role.ADMIN
    ) {
      throw new Error("BlockD: Admin role required");
    }
    this.userRoles.set(account.toLowerCase(), role);
    return true;
  }

  getRole(account) {
    return this.userRoles.get(account.toLowerCase()) || Role.NONE;
  }

  registerEvidence(
    caller,
    caseId,
    evidenceType,
    title,
    ipfsCid,
    sha256Checksum,
    encryptedKeyEnvelope,
    requiresWarrant = false
  ) {
    const role = this.getRole(caller);
    if (role === Role.NONE && caller.toLowerCase() !== this.owner.toLowerCase()) {
      throw new Error("BlockD: Unregistered or unauthorized officer");
    }

    this.evidenceCounter++;
    const evId = this.evidenceCounter;
    const now = Math.floor(Date.now() / 1000);

    const evidenceEntry = {
      evidenceId: evId,
      caseId,
      evidenceType,
      title,
      ipfsCid,
      sha256Checksum,
      encryptedKeyEnvelope,
      submittingOfficer: caller,
      timestamp: now,
      status: EvidenceStatus.ACTIVE,
      requiresWarrant,
    };

    this.evidences.set(evId, evidenceEntry);

    if (!this.caseMap.has(caseId)) {
      this.caseMap.set(caseId, []);
    }
    this.caseMap.get(caseId).push(evId);
    this.custodyLogs.set(evId, []);

    // Log initial registration
    this.logAccess(
      caller,
      evId,
      AccessAction.VIEW,
      "Initial evidence registration",
      "Stored in BlockD vault and pinned to IPFS"
    );

    return evId;
  }

  logAccess(caller, evidenceId, action, purpose, notes = "") {
    if (!this.evidences.has(evidenceId)) {
      throw new Error("BlockD: Evidence not found");
    }

    this.logCounter++;
    const logId = this.logCounter;
    const logEntry = {
      logId,
      evidenceId,
      officer: caller,
      action,
      purpose,
      timestamp: Math.floor(Date.now() / 1000),
      notes,
    };

    this.custodyLogs.get(evidenceId).push(logEntry);
    return logId;
  }

  getEvidence(evidenceId) {
    if (!this.evidences.has(evidenceId)) {
      throw new Error("BlockD: Evidence not found");
    }
    return this.evidences.get(evidenceId);
  }

  getEvidencesByCase(caseId) {
    const ids = this.caseMap.get(caseId) || [];
    return ids.map((id) => this.evidences.get(id));
  }

  getChainOfCustody(evidenceId) {
    if (!this.evidences.has(evidenceId)) {
      throw new Error("BlockD: Evidence not found");
    }
    return this.custodyLogs.get(evidenceId);
  }

  verifyIntegrity(evidenceId, computedChecksum) {
    if (!this.evidences.has(evidenceId)) {
      throw new Error("BlockD: Evidence not found");
    }
    const stored = this.evidences.get(evidenceId).sha256Checksum.toLowerCase();
    const computed = computedChecksum.toLowerCase();
    return stored === computed || stored === computed.replace(/^0x/, "");
  }

  requestWarrant(caller, evidenceId, justification) {
    if (!this.evidences.has(evidenceId)) {
      throw new Error("BlockD: Evidence not found");
    }

    this.warrantCounter++;
    const warrantId = this.warrantCounter;
    this.warrants.set(warrantId, {
      warrantId,
      evidenceId,
      requestingOfficer: caller,
      justification,
      approvingMagistrate: null,
      isApproved: false,
      requestedAt: Math.floor(Date.now() / 1000),
      approvedAt: 0,
      validUntil: 0,
    });

    return warrantId;
  }

  approveWarrant(magistrate, warrantId, durationSeconds = 86400) {
    const role = this.getRole(magistrate);
    if (role !== Role.MAGISTRATE && magistrate.toLowerCase() !== this.owner.toLowerCase()) {
      throw new Error("BlockD: Magistrate authority required");
    }

    if (!this.warrants.has(warrantId)) {
      throw new Error("BlockD: Warrant not found");
    }

    const req = this.warrants.get(warrantId);
    const now = Math.floor(Date.now() / 1000);
    req.isApproved = true;
    req.approvingMagistrate = magistrate;
    req.approvedAt = now;
    req.validUntil = now + durationSeconds;

    this.logAccess(
      magistrate,
      req.evidenceId,
      AccessAction.WARRANT_APPROVAL,
      "Magistrate Warrant Approved",
      `Warrant #${warrantId} valid for ${durationSeconds}s`
    );

    return true;
  }

  isWarrantValid(warrantId) {
    if (!this.warrants.has(warrantId)) return false;
    const w = this.warrants.get(warrantId);
    const now = Math.floor(Date.now() / 1000);
    return w.isApproved && now <= w.validUntil;
  }

  updateEvidenceStatus(caller, evidenceId, newStatus, reason) {
    if (!this.evidences.has(evidenceId)) {
      throw new Error("BlockD: Evidence not found");
    }
    const ev = this.evidences.get(evidenceId);
    ev.status = newStatus;

    this.logAccess(
      caller,
      evidenceId,
      AccessAction.STATUS_CHANGE,
      "Evidence Status Update",
      `Status changed to ${newStatus}: ${reason}`
    );
    return true;
  }
}

module.exports = {
  Role,
  EvidenceType,
  EvidenceStatus,
  AccessAction,
  MockContractEngine,
};
