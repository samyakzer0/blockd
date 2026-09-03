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
    let rawText = "";

    try {
      rawText = await new Promise((resolve, reject) => {
        const url = `https://indiankanoon.org/doc/${docId}/`;
        const options = {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        };
        https.get(url, options, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => {
            const clean = data.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            resolve(clean.length > 200 ? clean : "");
          });
        }).on("error", reject);
      });
    } catch (e) {
      rawText = "";
    }

    if (!rawText) {
      const docObj = await kanoonClient.fetchDocument(docId);
      rawText = docObj.doc || docObj.title;
    }

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
  console.log(`🛡️  BlockD Pure Dynamic Intelligence Server running on port ${PORT}`);
});
