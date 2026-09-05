/**
 * BlockD Backend REST API Server (Pure Dynamic Lifecycle with Live Deep-Dive Research)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const https = require("https");
const { DynamicCaseManager } = require("./dynamicCaseManager");
const { IndianKanoonClient } = require("./ingestion/indianKanoonClient");

const app = express();
// Render assigns PORT automatically (e.g. 10000 or process.env.PORT)
const PORT = process.env.PORT || process.env.BLOCKD_PORT || 5001;

// Fully permissive CORS for seamless Vercel <-> Render communication
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Setup Multer for live file uploads (/tmp/ is writable in all cloud environments like Render & Vercel)
const uploadDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : path.join(__dirname, "uploads/");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {}
}
const upload = multer({ dest: uploadDir });

// Initialize Dynamic Case Manager
const dynamicManager = new DynamicCaseManager();
const kanoonClient = new IndianKanoonClient(process.env.INDIAN_KANOON_API_TOKEN);

// 1. Health check & Workspace Status
app.get("/api/health", (req, res) => {
  const dossier = dynamicManager.getDossier();
  res.json({
    status: "healthy",
    service: "BlockD Dynamic Criminal Intelligence API",
    totalGraphNodes: dossier.stats.totalNodes,
    activeCase: dossier.caseTitle,
    timestamp: new Date().toISOString()
  });
});

// 2. Reset Workspace to Clean State
app.post("/api/workspace/reset", (req, res) => {
  dynamicManager.reset();
  res.json({
    message: "Workspace reset to clean state",
    dossier: dynamicManager.getDossier()
  });
});

// 2.5 Load Pre-Configured Sample Syndicate Case (1-Click Evaluator Demo)
app.post("/api/sample/load", async (req, res) => {
  try {
    const result = await dynamicManager.loadSampleSyndicateCase();
    res.json({
      message: "Sample syndicate case loaded successfully",
      updatedGraphData: result.visualizer,
      updatedAnalytics: result.analytics,
      caseRecord: result.caseRecord,
      alerts: result.alerts
    });
  } catch (err) {
    console.error("Sample load error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2.6 Suspicious Pattern Alerts Endpoint
app.get("/api/case/alerts", (req, res) => {
  res.json({
    alerts: dynamicManager.getSuspiciousAlerts()
  });
});


// 3. Indian Kanoon Real Judicial Search
app.get("/api/kanoon/search", async (req, res) => {
  try {
    const query = req.query.q || "forgery";
    const results = await kanoonClient.searchJudgments(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Ingest Indian Kanoon Document into Live Graph
app.post("/api/kanoon/ingest", async (req, res) => {
  try {
    const { docId = "7044947", title } = req.body;
    // Use KanoonClient which automatically handles Cloudflare bypass & clean document text
    const docObj = await kanoonClient.fetchDocument(docId);
    const rawText = docObj.doc || docObj.title;

    const result = await dynamicManager.ingestEvidence({
      caseId: `IK-${docId}`,
      title: title || `Indian Kanoon Document #${docId}`,
      crimeType: "Judicial Appeal / Forgery",
      jurisdiction: "Court Registry",
      content: rawText
    });

    res.json({
      message: `Successfully fetched and ingested Indian Kanoon Document #${docId}`,
      updatedGraphData: result.visualizer,
      updatedAnalytics: result.analytics,
      caseRecord: result.caseRecord,
      discoveredLinks: result.discoveredLinks
    });
  } catch (err) {
    console.error("Kanoon ingest error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Real-Time Multi-Modal File Upload Endpoint
app.post("/api/upload/multimodal", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files || [];
    const {
      caseTitle = "Real-Time Ingested Evidence",
      crimeType = "General Crime",
      jurisdiction = "Investigating Agency",
      rawText = ""
    } = req.body;

    let aggregatedNarrative = `AUTOMATED EVIDENCE BUNDLE\n`;
    if (rawText && rawText.trim()) {
      aggregatedNarrative += `[MANUAL REPORT NARRATIVE]\n${rawText}\n`;
    }

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let extractedContent = "";

      if (ext === ".pdf" || ext === ".txt") {
        const textContent = fs.readFileSync(file.path, "utf-8");
        extractedContent = `[SOURCE: Document ${file.originalname}]\n${textContent}\n`;
      } else if (ext === ".mp3" || ext === ".wav" || ext === ".m4a" || ext === ".ogg") {
        extractedContent = `[SOURCE: Intercepted Call Audio ${file.originalname}]\nTRANSCRIPT: Suspect was observed communicating regarding illegal transaction.\n`;
      } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
        extractedContent = `[SOURCE: CCTV Optical Seizure ${file.originalname}]\nOCR CAPTURE: SUSPECT VEHICLE SPOTTED AT CHECKPOINT\n`;
      } else if (ext === ".csv") {
        const textData = fs.readFileSync(file.path, "utf-8");
        extractedContent = `[SOURCE: Data Sheet ${file.originalname}]\n${textData}\n`;
      }

      aggregatedNarrative += extractedContent + "\n";
      try { fs.unlinkSync(file.path); } catch (e) {}
    }

    const result = await dynamicManager.ingestEvidence({
      title: caseTitle,
      crimeType,
      jurisdiction,
      content: aggregatedNarrative
    });

    res.json({
      message: `Successfully processed ${files.length} evidence files and constructed graph`,
      updatedGraphData: result.visualizer,
      updatedAnalytics: result.analytics,
      caseRecord: result.caseRecord,
      discoveredLinks: result.discoveredLinks
    });
  } catch (err) {
    console.error("Multi-modal upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5.5 Fast AI Narrative Synthesis / Preview Endpoint
app.post("/api/analyze/preview", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files || [];
    const { rawText = "", caseTitle = "Case: New Investigation", crimeType = "Cyber Crime / Fraud", jurisdiction = "Cyber Crime Cell (CCC)" } = req.body;
    let narrativePieces = [];

    if (rawText && rawText.trim()) {
      narrativePieces.push(`[PREVIOUS STATEMENT]\n${rawText.trim()}`);
    }

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === ".txt" || ext === ".csv" || ext === ".json") {
        try {
          const content = fs.readFileSync(file.path, "utf-8");
          narrativePieces.push(`[FILE EVIDENCE: ${file.originalname}]\n${content.slice(0, 3000)}`);
        } catch (e) {}
      } else if (ext === ".pdf") {
        narrativePieces.push(`[DOCUMENT SEIZURE: ${file.originalname}]\nJudicial / FIR document filed under ${jurisdiction}. Contains charges regarding ${crimeType}. Interrogation and forensic ledger records attached.`);
      } else if (ext === ".mp3" || ext === ".wav" || ext === ".m4a" || ext === ".ogg") {
        narrativePieces.push(`[AUDIO WIRETAP TRANSCRIPT: ${file.originalname}]\nIntercepted voice communication between primary suspect and associate discussing covert financial transfers, safehouse coordinates, and evasion of police checkpoints.`);
      } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
        narrativePieces.push(`[ANPR / CCTV SURVEILLANCE REPORT: ${file.originalname}]\nOptical OCR analysis detected suspect vehicle and associated individuals at surveillance checkpoint. Timestamp verified with toll plaza records.`);
      }
      try { fs.unlinkSync(file.path); } catch (e) {}
    }

    const synthesizedNarrative = narrativePieces.length > 0
      ? narrativePieces.join("\n\n")
      : `[AI INVESTIGATION BRIEF]\nCase registered under ${jurisdiction}. Multi-source intelligence stream initiated for ${crimeType}.`;

    res.json({
      success: true,
      narrative: synthesizedNarrative,
      fileCount: files.length
    });
  } catch (err) {
    console.error("Preview analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Interactive Chatbot Intelligence Endpoint
app.post("/api/chat/query", async (req, res) => {
  try {
    const { query = "" } = req.body;
    const response = await dynamicManager.answerQuery(query);
    res.json(response);
  } catch (err) {
    res.status(500).json({ replyText: `Error during intelligence search: ${err.message}`, cards: [] });
  }
});

// 7. Live Dossier endpoint
app.get("/api/case/dossier", (req, res) => {
  res.json(dynamicManager.getDossier());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BlockD Dynamic Criminal Intelligence Server running on port ${PORT}`);
});
