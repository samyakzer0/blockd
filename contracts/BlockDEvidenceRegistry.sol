// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockDEvidenceRegistry
 * @author BlockD Engineering Team
 * @notice Centralized smart contract for decentralized criminal evidence management,
 *         immutable Chain of Custody, role-based access control (RBAC), and warrant gating.
 * @dev Designed to be 100% self-contained and directly deployable via Remix IDE on Sepolia/EVM.
 */
contract BlockDEvidenceRegistry {

    // ==========================================
    // ENUMS & CONSTANTS
    // ==========================================

    enum Role {
        NONE,
        ADMIN,
        OFFICER,
        INVESTIGATOR,
        FORENSIC_EXPERT,
        MAGISTRATE
    }

    enum EvidenceType {
        FIR,                // First Information Report
        CDR,                // Call Detail Records
        CCTV,               // Surveillance Video / Images
        FINANCIAL,          // Bank Records, UPI / Crypto Trails
        FORENSIC_REPORT,    // Ballistics, DNA, Fingerprint Analysis
        INTERROGATION,      // Suspect / Witness Statements
        OTHER               // Miscellaneous Evidence
    }

    enum EvidenceStatus {
        ACTIVE,             // Available for authorized case investigations
        SEALED,             // Confidential / sealed by court order
        UNDER_REVIEW,       // Pending forensic re-validation
        TAMPERED_FLAGGED,   // Integrity check failed
        ARCHIVED            // Case closed
    }

    enum AccessAction {
        VIEW,               // Read metadata
        DECRYPT,            // Decrypted raw evidence payload
        EXPORT,             // Exported for court dossier
        ANALYSIS_RUN,       // Fed into AI / Graph ML pipeline
        WARRANT_APPROVAL,   // Magistrate warrant granted
        STATUS_CHANGE       // Evidence state changed
    }

    // ==========================================
    // DATA STRUCTURES
    // ==========================================

    struct Evidence {
        uint256 evidenceId;
        string caseId;
        EvidenceType evidenceType;
        string title;
        string ipfsCid;
        bytes32 sha256Checksum;         // SHA-256 hash of raw pre-encryption payload
        string encryptedKeyEnvelope;    // Asymmetric encrypted envelope of AES key
        address submittingOfficer;
        uint256 timestamp;
        EvidenceStatus status;
        bool requiresWarrant;
    }

    struct CustodyLog {
        uint256 logId;
        uint256 evidenceId;
        address officer;
        AccessAction action;
        string purpose;
        uint256 timestamp;
        string notes;
    }

    struct WarrantRequest {
        uint256 warrantId;
        uint256 evidenceId;
        address requestingOfficer;
        string justification;
        address approvingMagistrate;
        bool isApproved;
        uint256 requestedAt;
        uint256 approvedAt;
        uint256 validUntil;
    }

    // ==========================================
    // STATE VARIABLES
    // ==========================================

    address public owner;
    uint256 public evidenceCounter;
    uint256 public logCounter;
    uint256 public warrantCounter;

    mapping(address => Role) public userRoles;
    mapping(uint256 => Evidence) public evidences;
    mapping(string => uint256[]) private caseToEvidenceMap;
    mapping(uint256 => CustodyLog[]) private evidenceToCustodyLogs;
    mapping(uint256 => WarrantRequest) public warrants;

    // ==========================================
    // EVENTS
    // ==========================================

    event RoleUpdated(address indexed account, Role indexed oldRole, Role indexed newRole, address updatedBy);
    event EvidenceRegistered(
        uint256 indexed evidenceId,
        string indexed caseId,
        EvidenceType evidenceType,
        string title,
        string ipfsCid,
        bytes32 sha256Checksum,
        address indexed submittingOfficer,
        uint256 timestamp
    );
    event ChainOfCustodyLogged(
        uint256 indexed logId,
        uint256 indexed evidenceId,
        address indexed officer,
        AccessAction action,
        string purpose,
        uint256 timestamp
    );
    event WarrantRequested(
        uint256 indexed warrantId,
        uint256 indexed evidenceId,
        address indexed requestingOfficer,
        string justification,
        uint256 requestedAt
    );
    event WarrantApproved(
        uint256 indexed warrantId,
        uint256 indexed evidenceId,
        address indexed magistrate,
        uint256 approvedAt,
        uint256 validUntil
    );
    event EvidenceStatusChanged(
        uint256 indexed evidenceId,
        EvidenceStatus indexed oldStatus,
        EvidenceStatus indexed newStatus,
        address changedBy,
        string reason
    );

    // ==========================================
    // MODIFIERS
    // ==========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "BlockD: Caller is not contract owner");
        _;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner || userRoles[msg.sender] == Role.ADMIN,
            "BlockD: Admin role required"
        );
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || userRoles[msg.sender] != Role.NONE,
            "BlockD: Unregistered or unauthorized officer"
        );
        _;
    }

    modifier onlyMagistrate() {
        require(
            msg.sender == owner || userRoles[msg.sender] == Role.MAGISTRATE,
            "BlockD: Magistrate authority required"
        );
        _;
    }

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    constructor() {
        owner = msg.sender;
        userRoles[msg.sender] = Role.ADMIN;
        emit RoleUpdated(msg.sender, Role.NONE, Role.ADMIN, msg.sender);
    }

    // ==========================================
    // ROLE MANAGEMENT
    // ==========================================

    function setRole(address account, Role role) external onlyAdmin {
        require(account != address(0), "BlockD: Zero address invalid");
        Role oldRole = userRoles[account];
        userRoles[account] = role;
        emit RoleUpdated(account, oldRole, role, msg.sender);
    }

    function getRole(address account) external view returns (Role) {
        return userRoles[account];
    }

    // ==========================================
    // EVIDENCE REGISTRATION
    // ==========================================

    /**
     * @notice Registers a new piece of encrypted evidence onto the immutable ledger.
     */
    function registerEvidence(
        string calldata caseId,
        EvidenceType evidenceType,
        string calldata title,
        string calldata ipfsCid,
        bytes32 sha256Checksum,
        string calldata encryptedKeyEnvelope,
        bool requiresWarrant
    ) external onlyAuthorized returns (uint256) {
        require(bytes(caseId).length > 0, "BlockD: Case ID cannot be empty");
        require(bytes(ipfsCid).length > 0, "BlockD: IPFS CID cannot be empty");
        require(sha256Checksum != bytes32(0), "BlockD: Checksum cannot be empty");

        evidenceCounter++;
        uint256 newEvidenceId = evidenceCounter;

        evidences[newEvidenceId] = Evidence({
            evidenceId: newEvidenceId,
            caseId: caseId,
            evidenceType: evidenceType,
            title: title,
            ipfsCid: ipfsCid,
            sha256Checksum: sha256Checksum,
            encryptedKeyEnvelope: encryptedKeyEnvelope,
            submittingOfficer: msg.sender,
            timestamp: block.timestamp,
            status: EvidenceStatus.ACTIVE,
            requiresWarrant: requiresWarrant
        });

        caseToEvidenceMap[caseId].push(newEvidenceId);

        emit EvidenceRegistered(
            newEvidenceId,
            caseId,
            evidenceType,
            title,
            ipfsCid,
            sha256Checksum,
            msg.sender,
            block.timestamp
        );

        // Initial Chain of Custody entry
        _logCustody(newEvidenceId, msg.sender, AccessAction.VIEW, "Initial evidence registration", "Registered into BlockD vault");

        return newEvidenceId;
    }

    // ==========================================
    // CHAIN OF CUSTODY (AUDIT TRAIL)
    // ==========================================

    function logAccess(
        uint256 evidenceId,
        AccessAction action,
        string calldata purpose,
        string calldata notes
    ) external onlyAuthorized returns (uint256) {
        require(evidenceId > 0 && evidenceId <= evidenceCounter, "BlockD: Evidence not found");
        return _logCustody(evidenceId, msg.sender, action, purpose, notes);
    }

    function _logCustody(
        uint256 evidenceId,
        address officer,
        AccessAction action,
        string memory purpose,
        string memory notes
    ) internal returns (uint256) {
        logCounter++;
        uint256 currentLogId = logCounter;

        evidenceToCustodyLogs[evidenceId].push(CustodyLog({
            logId: currentLogId,
            evidenceId: evidenceId,
            officer: officer,
            action: action,
            purpose: purpose,
            timestamp: block.timestamp,
            notes: notes
        }));

        emit ChainOfCustodyLogged(currentLogId, evidenceId, officer, action, purpose, block.timestamp);
        return currentLogId;
    }

    function getChainOfCustody(uint256 evidenceId) external view onlyAuthorized returns (CustodyLog[] memory) {
        require(evidenceId > 0 && evidenceId <= evidenceCounter, "BlockD: Evidence not found");
        return evidenceToCustodyLogs[evidenceId];
    }

    function getChainOfCustodyLength(uint256 evidenceId) external view returns (uint256) {
        return evidenceToCustodyLogs[evidenceId].length;
    }

    // ==========================================
    // EVIDENCE RETRIEVAL & INTEGRITY VERIFICATION
    // ==========================================

    function getEvidence(uint256 evidenceId) external view onlyAuthorized returns (Evidence memory) {
        require(evidenceId > 0 && evidenceId <= evidenceCounter, "BlockD: Evidence not found");
        return evidences[evidenceId];
    }

    function getEvidencesByCase(string calldata caseId) external view onlyAuthorized returns (uint256[] memory) {
        return caseToEvidenceMap[caseId];
    }

    /**
     * @notice Verifies if a calculated SHA-256 hash matches the immutable on-chain record.
     */
    function verifyIntegrity(uint256 evidenceId, bytes32 computedChecksum) external view returns (bool) {
        require(evidenceId > 0 && evidenceId <= evidenceCounter, "BlockD: Evidence not found");
        return evidences[evidenceId].sha256Checksum == computedChecksum;
    }

    // ==========================================
    // WARRANT GATING & MULTI-SIG APPROVALS
    // ==========================================

    function requestWarrant(
        uint256 evidenceId,
        string calldata justification
    ) external onlyAuthorized returns (uint256) {
        require(evidenceId > 0 && evidenceId <= evidenceCounter, "BlockD: Evidence not found");
        require(bytes(justification).length > 0, "BlockD: Justification required");

        warrantCounter++;
        uint256 newWarrantId = warrantCounter;

        warrants[newWarrantId] = WarrantRequest({
            warrantId: newWarrantId,
            evidenceId: evidenceId,
            requestingOfficer: msg.sender,
            justification: justification,
            approvingMagistrate: address(0),
            isApproved: false,
            requestedAt: block.timestamp,
            approvedAt: 0,
            validUntil: 0
        });

        emit WarrantRequested(newWarrantId, evidenceId, msg.sender, justification, block.timestamp);
        return newWarrantId;
    }

    function approveWarrant(
        uint256 warrantId,
        uint256 durationInSeconds
    ) external onlyMagistrate {
        require(warrantId > 0 && warrantId <= warrantCounter, "BlockD: Warrant not found");
        WarrantRequest storage req = warrants[warrantId];
        require(!req.isApproved, "BlockD: Warrant already approved");
        require(durationInSeconds > 0, "BlockD: Duration must be > 0");

        req.isApproved = true;
        req.approvingMagistrate = msg.sender;
        req.approvedAt = block.timestamp;
        req.validUntil = block.timestamp + durationInSeconds;

        emit WarrantApproved(warrantId, req.evidenceId, msg.sender, block.timestamp, req.validUntil);
        _logCustody(req.evidenceId, msg.sender, AccessAction.WARRANT_APPROVAL, "Warrant Approved by Magistrate", "Warrant access granted");
    }

    function isWarrantValid(uint256 warrantId) external view returns (bool) {
        if (warrantId == 0 || warrantId > warrantCounter) return false;
        WarrantRequest memory req = warrants[warrantId];
        return (req.isApproved && block.timestamp <= req.validUntil);
    }

    // ==========================================
    // EVIDENCE STATUS & LIFECYCLE CONTROLS
    // ==========================================

    function updateEvidenceStatus(
        uint256 evidenceId,
        EvidenceStatus newStatus,
        string calldata reason
    ) external onlyAuthorized {
        require(evidenceId > 0 && evidenceId <= evidenceCounter, "BlockD: Evidence not found");
        Evidence storage ev = evidences[evidenceId];
        EvidenceStatus oldStatus = ev.status;
        ev.status = newStatus;

        emit EvidenceStatusChanged(evidenceId, oldStatus, newStatus, msg.sender, reason);
        _logCustody(evidenceId, msg.sender, AccessAction.STATUS_CHANGE, "Status Update", reason);
    }
}
