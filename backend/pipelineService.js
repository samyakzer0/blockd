/**
 * BlockD Full Pipeline Service (JavaScript / Node.js)
 * End-to-end bridge that connects all 5 modules:
 * Module 1 (Crypto & Blockchain Custody) +
 * Module 2 (Multi-Source Ingestion & Normalization) +
 * Module 3 (Criminal AI / NER & Relation Extraction) +
 * Module 4 (Entity Resolution & MPI) +
 * Module 5 (Knowledge Graph & Graph Analytics).
 *
 * Provides pre-computed live case data and an ingestion runner for the React Dashboard.
 */

const { IngestionEngine, SourceType } = require("./ingestion/ingestionEngine");
const { CriminalAiPipeline } = require("./ai/criminalAiPipeline");
const { EntityResolver } = require("./ai/entityResolver");
const { KnowledgeGraphEngine } = require("./graph/knowledgeGraphEngine");
const { EvidenceService, EvidenceType } = require("./evidenceService");
const { MockContractEngine, Role } = require("./web3Client");
const { IPFSClient } = require("./storage/ipfsClient");

class BlockDPipelineService {
  /**
   * Generates a fully processed, authentic criminal case intelligence bundle for the Dashboard.
   * Case: "DELHI-HAWALA-ARMS-SYNDICATE-2025"
   */
  static getFullCaseDossier() {
    const admin = "0xAdmin00000000000000000000000000000000001";
    const officer = "0xOfficerSharma_DelhiSpecialCell_000000002";

    const contract = new MockContractEngine(admin);
    contract.setRole(admin, officer, Role.OFFICER);
    const evidenceService = new EvidenceService({
      contractEngine: contract,
      ipfsClient: new IPFSClient({ useMockStore: true })
    });

    const caseId = "DELHI-HAWALA-2025";

    // 1. Raw Multi-Source Evidence (Module 2)
    const firContent = `
      FIRST INFORMATION REPORT #892/2025
      Police Station: Crime Branch Special Cell, Lodhi Colony
      U/S 120B, 420 IPC and Section 25 Arms Act
      
      Narrative: Suspect Vikram Sharma alias 'Tony' was observed driving vehicle DL-01-AB-1234 near Connaught Place.
      A country-made pistol was seized from the vehicle. Accused was communicating using phone +919811099881.
      Co-conspirator Shooter Samir was intercepted carrying illegal munitions.
    `;

    const cdrContent = `calling_number, called_number, timestamp, duration_seconds, imei, imsi, cell_tower_id
9811099881, 9876543210, 2025-08-15T19:22:00Z, 310, 864201041234567, 404450111222333, TOWER_CP_01
9876543210, 9911002233, 2025-08-15T19:35:00Z, 45, 864201041234567, 404450111222333, TOWER_CP_01
9911002233, 9811099881, 2025-08-15T20:10:00Z, 185, 352099009876543, 404450999888777, TOWER_KAROL_BAGH_04`;

    const financeContent = `sender_account, receiver_account, amount, currency, timestamp, sender_name, receiver_name, ifsc_code
HDFC-991283, ICIC-441029, 6500000, INR, 2025-08-15T14:10:00Z, Vikram Sharma, Royal Trade Impex Ltd, HDFC0001234
ICIC-441029, OFFSHORE-8801, 5000000, INR, 2025-08-15T16:20:00Z, Royal Trade Impex Ltd, Offshore Shell Holdings, HDFC0001234
OFFSHORE-8801, CHIEF-001, 4500000, INR, 2025-08-15T18:00:00Z, Offshore Shell Holdings, Kingpin Chief, SWIFT009988`;

    const firDoc = IngestionEngine.ingest({ caseId, sourceType: SourceType.FIR, title: "Crime Branch FIR #892/2025", content: firContent });
    const cdrDoc = IngestionEngine.ingest({ caseId, sourceType: SourceType.CDR, title: "Intercepted Telecom CDRs", content: cdrContent });
    const finDoc = IngestionEngine.ingest({ caseId, sourceType: SourceType.FINANCIAL, title: "Hawala Bank Ledger", content: financeContent });

    // 2. Blockchain Ingestion (Module 1)
    const ev1 = contract.registerEvidence(officer, caseId, EvidenceType.FIR, firDoc.title, "QmXPJiKWdMAVJcMXdgcVVyosbuUXpoAvu2RVohHVkgyUhL", "0e9a4d87a69d3d88c5d9db61e7f3e7a79a104a3d8e68fc5e470658c6bdfe04b2", "key_fir");
    const ev2 = contract.registerEvidence(officer, caseId, EvidenceType.CDR, cdrDoc.title, "QmCDR99281928312039120391209312093102931209", "112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00", "key_cdr");
    const ev3 = contract.registerEvidence(officer, caseId, EvidenceType.FINANCIAL, finDoc.title, "QmFIN7766554433221100ffeeddccbbaa99887766554", "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899", "key_fin");

    contract.logAccess(officer, ev1, 3, "AI Graph Intelligence Processing", "Extracted 8 entities & 3 relations");
    contract.logAccess(officer, ev2, 3, "AI Graph Intelligence Processing", "Mapped 3 telecom caller nodes");
    contract.logAccess(officer, ev3, 3, "AI Graph Intelligence Processing", "Detected 65 Lakh high-value transfer");

    // 3. AI Extraction (Module 3)
    const firResult = CriminalAiPipeline.processDocument(firDoc);
    const cdrResult = CriminalAiPipeline.processDocument(cdrDoc);
    const finResult = CriminalAiPipeline.processDocument(finDoc);

    // 4. Entity Resolution & Master Person Index (Module 4)
    const resolver = new EntityResolver();
    const p1 = resolver.resolveEntity({ type: "SUSPECT", value: "Vikram Sharma", confidence: 0.95 }, { caseId });
    resolver._attachIdentifier(p1, "VEHICLE", "DL-01-AB-1234");
    resolver._attachIdentifier(p1, "PHONE", "+919811099881");
    resolver._attachIdentifier(p1, "IMEI", "864201041234567");
    resolver._attachIdentifier(p1, "BANK_ACCOUNT", "HDFC-991283");

    const p2 = resolver.resolveEntity({ type: "ALIAS", value: "Tony", confidence: 0.92 }, {
      associatedIdentifiers: [{ type: "SUSPECT", value: "Vikram Sharma" }]
    });

    const p3 = resolver.resolveEntity({ type: "SUSPECT", value: "Ramesh Bhai", confidence: 0.92 }, { caseId });
    resolver._attachIdentifier(p3, "PHONE", "+919876543210");

    const p4 = resolver.resolveEntity({ type: "SUSPECT", value: "Shooter Samir", confidence: 0.90 }, { caseId });
    resolver._attachIdentifier(p4, "PHONE", "+919911002233");

    const p5 = resolver.resolveEntity({ type: "SUSPECT", value: "Kingpin Chief", confidence: 0.96 }, { caseId });
    resolver._attachIdentifier(p5, "BANK_ACCOUNT", "CHIEF-001");

    // 5. Knowledge Graph & Analytics (Module 5)
    const kg = new KnowledgeGraphEngine();
    kg.ingestPipelineGraph(firResult.graph);
    kg.ingestPipelineGraph(cdrResult.graph);
    kg.ingestPipelineGraph(finResult.graph);

    // Cross-domain links
    kg.addEdge({ source: "Shooter Samir", target: "Tony", relation: "OPERATES_UNDER", confidence: 0.92 });
    kg.addEdge({ source: "Tony", target: "Kingpin Chief", relation: "REPORTS_TO", confidence: 0.95 });
    kg.addEdge({ source: "Offshore Shell Holdings", target: "Kingpin Chief", relation: "FINANCIAL_BENEFICIARY", confidence: 0.98 });

    const analytics = kg.runNetworkAnalytics();
    const visualizerData = kg.exportVisualizerGraph();

    return {
      caseId,
      caseTitle: "Delhi NCR Hawala & Arms Syndicate",
      summary: "Inter-state syndicate coordinating arms shipments, illicit hawala banking, and multi-tier telephone communications.",
      stats: {
        totalNodes: visualizerData.nodes.length,
        totalEdges: visualizerData.edges.length,
        totalEvidenceFiles: 3,
        totalMasterProfiles: resolver.getAllMasterProfiles().length,
        kingpinIdentified: analytics.topKingpins[0]?.label || "Kingpin Chief",
        topBroker: analytics.topBrokers[0]?.label || "Tony"
      },
      graphData: visualizerData,
      analytics,
      masterProfiles: resolver.getAllMasterProfiles(),
      evidenceLedger: [
        {
          id: ev1,
          caseId,
          type: "FIR",
          title: firDoc.title,
          cid: "QmXPJiKWdMAVJcMXdgcVVyosbuUXpoAvu2RVohHVkgyUhL",
          checksum: "0e9a4d87a69d3d88c5d9db61e7f3e7a79a104a3d8e68fc5e470658c6bdfe04b2",
          officer,
          status: "ACTIVE",
          chainOfCustody: contract.getChainOfCustody(ev1)
        },
        {
          id: ev2,
          caseId,
          type: "CDR",
          title: cdrDoc.title,
          cid: "QmCDR99281928312039120391209312093102931209",
          checksum: "112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
          officer,
          status: "ACTIVE",
          chainOfCustody: contract.getChainOfCustody(ev2)
        },
        {
          id: ev3,
          caseId,
          type: "FINANCIAL",
          title: finDoc.title,
          cid: "QmFIN7766554433221100ffeeddccbbaa99887766554",
          checksum: "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
          officer,
          status: "ACTIVE",
          chainOfCustody: contract.getChainOfCustody(ev3)
        }
      ]
    };
  }
}

module.exports = { BlockDPipelineService };
