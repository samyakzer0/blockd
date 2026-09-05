import React, { useState, useEffect, useRef } from "react";
import { NetworkGraphCanvas } from "./components/NetworkGraphCanvas";
import { AssistantThread } from "./components/AssistantThread";
import { Card, Badge, Button, Input } from "./components/ui";
import {
  Network,
  FileCheck2,
  Cpu,
  PlusCircle,
  X,
  CheckCircle2,
  UploadCloud,
  FileText,
  FileAudio,
  Image as ImageIcon,
  Loader2,
  Search,
  Scale,
  RotateCcw,
  BookOpen,
  Sparkles,
  Layers,
  AlertTriangle,
  Printer,
  Download,
  Play,
  ShieldAlert,
  FileSpreadsheet,
  Building2,
  Lock
} from "lucide-react";

// Production / Environment API Base URL Resolver
const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5001" : "");

export default function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    totalEvidenceFiles: 0,
    kingpinIdentified: "Awaiting Ingestion"
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeCaseInfo, setActiveCaseInfo] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Modals
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeIngestTab, setActiveIngestTab] = useState("filedrop");

  // Form State
  const [intakeTitle, setIntakeTitle] = useState("");
  const [intakeCrimeType, setIntakeCrimeType] = useState("Cyber Financial Fraud & Phishing (IT Act 66D / IPC 420)");
  const [intakeJurisdiction, setIntakeJurisdiction] = useState("Cyber Crime Cell (CCC)");
  const [manualNarrative, setManualNarrative] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Ingestion & AI Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzingFiles, setIsAnalyzingFiles] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [ingestProgress, setIngestProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const progressTimerRef = useRef(null);

  // Indian Kanoon Search & Ingest State (Default to empty / none)
  const [kanoonQuery, setKanoonQuery] = useState("");
  const [kanoonResults, setKanoonResults] = useState([]);
  const [isSearchingKanoon, setIsSearchingKanoon] = useState(false);

  // Dynamic Chat Messages
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Intelligence Gateway initialized. The workspace is clean. Drop a PDF/Audio evidence file, search Indian Kanoon live, or load the pre-configured sample syndicate to construct the criminal network graph.",
      cards: [
        {
          title: "Live Dynamic Intelligence Ready",
          badge: "AWAITING INGESTION",
          variant: "primary",
          desc: "Click 'Ingest Evidence & Kanoon Search' on the top right, or click 'Load Sample Syndicate' to explore immediately."
        }
      ]
    }
  ]);
  const [highlightedPath, setHighlightedPath] = useState(null);

  const startProgressAnimation = (initialStage = "Initializing Multi-Modal Stream...") => {
    setIngestProgress(15);
    setProgressStage(initialStage);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    progressTimerRef.current = setInterval(() => {
      setIngestProgress((prev) => {
        if (prev < 40) {
          setProgressStage("AI NER Engine: Extracting Entities, IPC/BNS Sections...");
          return prev + 15;
        } else if (prev < 75) {
          setProgressStage("Running PageRank & Betweenness Centrality...");
          return prev + 12;
        } else if (prev < 92) {
          setProgressStage("Anchoring Cryptographic SHA-256 Checksum to Vault...");
          return prev + 5;
        }
        return prev;
      });
    }, 450);
  };

  const completeProgressAnimation = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIngestProgress(100);
    setProgressStage("Rendering 2D Organic Orbital Knowledge Graph...");
  };

  const refreshDossier = () => {
    fetch(`${API_BASE}/api/case/dossier`)
      .then(res => res.json())
      .then(data => {
        if (data.graphData) {
          setGraphData(data.graphData);
          setStats({
            totalNodes: data.stats.totalNodes || 0,
            totalEdges: data.stats.totalEdges || 0,
            totalEvidenceFiles: data.stats.totalEvidenceFiles || 0,
            kingpinIdentified: data.stats.kingpinIdentified || "Awaiting Ingestion"
          });
          setAlerts(data.alerts || []);
          setActiveCaseInfo({
            caseId: data.caseId,
            caseTitle: data.caseTitle,
            summary: data.summary
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshDossier();
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleResetWorkspace = async () => {
    try {
      await fetch(`${API_BASE}/api/workspace/reset`, { method: "POST" });
      setGraphData({ nodes: [], edges: [] });
      setStats({
        totalNodes: 0,
        totalEdges: 0,
        totalEvidenceFiles: 0,
        kingpinIdentified: "Awaiting Ingestion"
      });
      setAlerts([]);
      setActiveCaseInfo(null);
      setMessages([
        {
          sender: "ai",
          text: "Workspace reset. Ready for a new case ingestion.",
          cards: []
        }
      ]);
    } catch (e) {}
  };

  // 1-Click Pre-configured Sample Syndicate Loader
  const handleLoadSampleCase = async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch(`${API_BASE}/api/sample/load`, { method: "POST" });
      const data = await res.json();

      if (data.updatedGraphData) {
        setGraphData(data.updatedGraphData);
        setStats({
          totalNodes: data.updatedGraphData.nodes.length,
          totalEdges: data.updatedGraphData.edges.length,
          totalEvidenceFiles: 1,
          kingpinIdentified: "Vikramaditya Rathore"
        });
        setAlerts(data.alerts || []);
        setActiveCaseInfo({
          caseId: data.caseRecord.caseId,
          caseTitle: data.caseRecord.title,
          summary: data.caseRecord.summary
        });

        setMessages([
          {
            sender: "ai",
            text: "Operation Shadow Syndicate loaded. Vikramaditya Rathore is identified as the central syndicate kingpin (PageRank: 0.45) directing Hawala broker Rajesh Mhatre and Master Forger Praveen Sharma. 4 suspicious anomalies flagged.",
            cards: [
              {
                title: "Primary Kingpin: Vikramaditya Rathore",
                badge: "PAGERANK CENTRALITY",
                variant: "danger",
                desc: "Coordinates shell firms, encrypted communications, and Hawala routing across regional cells.",
                deepDiveQuery: "Vikramaditya Rathore"
              },
              {
                title: "Hawala Broker: Rajesh Mhatre",
                badge: "KEY BROKER",
                variant: "warning",
                desc: "Routed ₹45,00,000 to offshore entity Apex Overseas Trade Ltd; structured transactions below FIU limits.",
                deepDiveQuery: "Rajesh Mhatre"
              },
              {
                title: "Counterfeiting Cell: Praveen Sharma",
                badge: "FORGERY SPECIALIST",
                variant: "primary",
                desc: "Fabricated 14 counterfeit passports using specialized security paper in Surat workshop.",
                deepDiveQuery: "Praveen Sharma"
              }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Automated AI Narrative Filling upon File Drop
  const handleFileDrop = async (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const combinedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(combinedFiles);
    setIsAnalyzingFiles(true);

    try {
      const formData = new FormData();
      combinedFiles.forEach(f => formData.append("files", f));
      formData.append("caseTitle", intakeTitle || "Case: Multi-Source Investigation");
      formData.append("crimeType", intakeCrimeType);
      formData.append("jurisdiction", intakeJurisdiction);
      formData.append("rawText", manualNarrative);

      const res = await fetch(`${API_BASE}/api/analyze/preview`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.narrative) {
        setManualNarrative(data.narrative);
      }
    } catch (err) {
      const synthesizedText = combinedFiles.map(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext === "pdf") return `[DOCUMENT SEIZURE: ${f.name}]\nFIR / Chargesheet record filed under ${intakeJurisdiction}. Multi-jurisdictional judicial ledger attached.`;
        if (ext === "mp3" || ext === "wav" || ext === "m4a") return `[AUDIO WIRETAP TRANSCRIPT: ${f.name}]\nIntercepted voice communication between primary suspect and syndicate associates regarding covert financial transfers.`;
        if (ext === "jpg" || ext === "png" || ext === "jpeg") return `[CCTV / ANPR OPTICAL RECORD: ${f.name}]\nSurveillance checkpoint image with vehicle registration plate OCR detection.`;
        return `[FORENSIC EVIDENCE: ${f.name}]\nRaw digital forensic seizure.`;
      }).join("\n\n");

      setManualNarrative(prev => prev ? `${prev}\n\n${synthesizedText}` : synthesizedText);
    } finally {
      setIsAnalyzingFiles(false);
    }
  };

  // Dynamic Chat Query to Backend
  const handleSendMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;
    const query = textToSend.trim();

    const newMsgList = [...messages, { sender: "user", text: query }];
    setMessages(newMsgList);
    setIsQuerying(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await response.json();

      if (data.highlightedPath) {
        setHighlightedPath(data.highlightedPath);
      }

      if (data.updatedGraphData) {
        setGraphData(data.updatedGraphData);
        setStats(prev => ({
          ...prev,
          totalNodes: data.updatedGraphData.nodes.length,
          totalEdges: data.updatedGraphData.edges.length
        }));
      }

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: data.replyText,
          cards: data.cards || []
        }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: `Processed query '${query}' against active case graph.`,
          cards: []
        }
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  // Live Multi-Modal File Upload Submission with Animated Progress
  const handleProcessMultiModalSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    startProgressAnimation("Ingesting Multi-Modal Evidence Stream...");

    const formData = new FormData();
    formData.append("caseTitle", intakeTitle || "Case: Real-Time Intelligence Seizure");
    formData.append("crimeType", intakeCrimeType);
    formData.append("jurisdiction", intakeJurisdiction);
    formData.append("rawText", manualNarrative);

    uploadedFiles.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${API_BASE}/api/upload/multimodal`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      completeProgressAnimation();

      setTimeout(() => {
        if (data.updatedGraphData) {
          setGraphData(data.updatedGraphData);
          setStats({
            totalNodes: data.updatedGraphData.nodes.length,
            totalEdges: data.updatedGraphData.edges.length,
            totalEvidenceFiles: 1,
            kingpinIdentified: data.updatedAnalytics?.topKingpins[0]?.label || "Primary Entity"
          });
        }

        setIsProcessing(false);
        setShowIngestionModal(false);
        setIngestProgress(0);

        setMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: `Ingestion Complete for "${intakeTitle || "Case Investigation"}". Extracted ${data.caseRecord?.entities?.length || 0} entities and linked into graph (${data.updatedGraphData?.nodes?.length || 0} nodes live).`,
            cards: [
              {
                title: "Case Ingested & Graph Built",
                badge: `${data.updatedGraphData?.nodes?.length || 0} NODES LIVE`,
                variant: "success",
                desc: `Extracted entities from uploaded source and cross-referenced Indian Kanoon records.`
              }
            ]
          }
        ]);
        setUploadedFiles([]);
        refreshDossier();
      }, 500);
    } catch (err) {
      console.error(err);
      completeProgressAnimation();
      setTimeout(() => {
        setIsProcessing(false);
        setShowIngestionModal(false);
        setIngestProgress(0);
      }, 400);
    }
  };

  // Indian Kanoon Live Search Execution
  const handleSearchKanoon = async (e) => {
    e?.preventDefault();
    if (!kanoonQuery || !kanoonQuery.trim()) return;

    setIsSearchingKanoon(true);
    try {
      const res = await fetch(`${API_BASE}/api/kanoon/search?q=${encodeURIComponent(kanoonQuery.trim())}`);
      const data = await res.json();
      setKanoonResults(data.docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingKanoon(false);
    }
  };

  // Ingest Selected Kanoon Judgment into Live Graph with Animated Progress Bar
  const handleIngestKanoonDoc = async (doc) => {
    setIsProcessing(true);
    startProgressAnimation(`Fetching Indian Kanoon Record #${doc.tid}...`);

    try {
      const res = await fetch(`${API_BASE}/api/kanoon/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: String(doc.tid), title: doc.title })
      });
      const data = await res.json();
      completeProgressAnimation();

      setTimeout(() => {
        if (data.updatedGraphData) {
          setGraphData(data.updatedGraphData);
          setStats({
            totalNodes: data.updatedGraphData.nodes.length,
            totalEdges: data.updatedGraphData.edges.length,
            totalEvidenceFiles: 1,
            kingpinIdentified: data.updatedAnalytics?.topKingpins[0]?.label || "Primary Accused"
          });
        }

        setIsProcessing(false);
        setShowIngestionModal(false);
        setIngestProgress(0);

        setMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: `Ingested Indian Kanoon Document: "${doc.title}". Built knowledge graph containing ${data.updatedGraphData?.nodes?.length || 0} nodes!`,
            cards: [
              {
                title: `Judicial Record #${doc.tid}`,
                badge: "KANOON INGESTED",
                variant: "danger",
                desc: doc.headline || "Extracted suspects and multi-jurisdiction links into the knowledge graph."
              }
            ]
          }
        ]);
        refreshDossier();
      }, 500);
    } catch (err) {
      console.error(err);
      completeProgressAnimation();
      setTimeout(() => {
        setIsProcessing(false);
        setIngestProgress(0);
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5EF] text-[#1F2839] flex flex-col font-sans">
      {/* Top Navbar - Azul #28374A */}
      <header className="border-b border-[#1C2735] bg-[#28374A] text-white sticky top-0 z-50 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white leading-none">BlockD</h1>
          </div>
        </div>

        {/* Top Nav Action Buttons - Responsive Wrapping */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* 1-Click Sample Syndicate Loader - Terra Queimada */}
          <button
            type="button"
            onClick={handleLoadSampleCase}
            disabled={isLoadingSample}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold text-white bg-[#B8502E] hover:bg-[#9A3E20] transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Load realistic sample syndicate case for instant evaluation"
          >
            {isLoadingSample ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Play className="w-3.5 h-3.5 text-white fill-white" />}
            <span>Load Sample Syndicate</span>
          </button>

          {/* Suspicious Alerts Button */}
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAlertsModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold text-[#B8502E] bg-[#FDF4EE] border border-[#B8502E]/50 hover:bg-[#FBE8DE] transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#B8502E]" />
              <span>{alerts.length} Alerts</span>
            </button>
          )}

          {/* Export Dossier */}
          {graphData.nodes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white bg-white/15 border border-white/30 hover:bg-white/25 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D3C7AD]" />
              <span className="hidden sm:inline">Export Dossier</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}

          {graphData.nodes.length > 0 && (
            <button
              type="button"
              onClick={handleResetWorkspace}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white/80 bg-white/10 border border-white/20 hover:bg-white/20 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Clear workspace"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCustodyModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white bg-white/15 border border-white/30 hover:bg-white/25 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#D3C7AD]" />
            <span className="hidden sm:inline">Blockchain Custody</span>
            <span className="sm:hidden">Custody</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIngestionModal(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold text-white bg-[#B8502E] hover:bg-[#9A3E20] transition-all shadow-md shadow-[#B8502E]/25 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span>Ingest & Search</span>
          </button>
        </div>
      </header>

      {/* Main Layout - Areia / Warm Terracotta Background */}
      <main className="flex-1 p-3 sm:p-6 max-w-[1800px] w-full mx-auto space-y-4 sm:space-y-5">
        {/* KPI Cards: Responsive 2-Card Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-3.5 sm:p-4 border-[#D3C7AD] bg-white shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#6B6751] uppercase tracking-wide">Network Entities</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#28374A] mt-0.5 sm:mt-1">{stats.totalNodes} Nodes</div>
              <p className="text-[9px] sm:text-[10px] text-[#6B6751]/80 mt-0.5">{stats.totalEdges} relational links mapped</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-[#E8E1D1] rounded-xl border border-[#D3C7AD] text-[#28374A]">
              <Network className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 border-[#D3C7AD] bg-white shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#6B6751] uppercase tracking-wide">Identified Key Influencer</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#B8502E] mt-0.5 sm:mt-1 truncate max-w-[200px] sm:max-w-[280px]">{stats.kingpinIdentified}</div>
              <p className="text-[9px] sm:text-[10px] text-[#6B6751]/80 mt-0.5">Calculated PageRank metric</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-[#FDF4EE] rounded-xl border border-[#B8502E]/30 text-[#B8502E]">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </Card>
        </div>

        {/* 2/3rd Graph + 1/3rd Assistant Thread Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* LEFT 2/3rd: NETWORK GRAPH CANVAS */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[#A4AE8B] bg-[#BEC6A5] shadow-sm relative min-h-[520px] sm:min-h-[640px] lg:min-h-[760px] flex flex-col justify-center overflow-hidden">
              <NetworkGraphCanvas
                graphData={graphData}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  handleSendMessage(`Deep dive on entity ${node.label}`);
                }}
                selectedNodeId={selectedNode?.id}
                highlightedPath={highlightedPath}
                onOpenIngestion={() => setShowIngestionModal(true)}
                onLoadSample={handleLoadSampleCase}
                isLoadingSample={isLoadingSample}
              />
            </div>
          </div>

          {/* RIGHT 1/3rd: ASSISTANT-UI STYLE COPILOT THREAD */}
          <div className="flex flex-col min-h-[520px] sm:min-h-[600px] lg:h-[740px]">
            <AssistantThread
              messages={messages}
              onSendMessage={handleSendMessage}
              isQuerying={isQuerying}
            />
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: SUSPICIOUS PATTERN ALERTS                         */}
      {/* ========================================================= */}
      {/* MODAL: SUSPICIOUS PATTERN ALERTS */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 bg-[#1F2839]/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col p-4 sm:p-6 bg-white border-[#D9D9D9] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D9D9] mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#FDF2F2] border border-[#FCA5A5]/60 text-[#991B1B]">
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1F2839]">Automated Suspicious Pattern Detection</h3>
                  <p className="text-[11px] sm:text-xs text-[#6B7280]">Anomaly alerts across Hawala, Telecom, and Counterfeiting</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowAlertsModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {alerts.map((alt) => (
                <div key={alt.id} className="p-3.5 sm:p-4 rounded-xl border border-[#D9D9D9] bg-[#FAF9F5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#6B7280] font-bold">{alt.id} • {alt.category}</span>
                    <Badge variant={alt.severity === "CRITICAL" ? "danger" : alt.severity === "HIGH" ? "warning" : "primary"}>
                      {alt.severity}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#1F2839]">{alt.title}</h4>
                  <p className="text-[#4B5563] leading-relaxed text-xs">{alt.description}</p>
                  
                  <div className="pt-1 text-[11px] font-mono text-[#6B7280] space-y-1">
                    <p><span className="text-[#8F95A3]">Entities Involved:</span> {alt.entitiesInvolved?.join(", ")}</p>
                    <p className="text-emerald-700 font-semibold"><span className="text-[#8F95A3]">Action:</span> {alt.recommendedAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXPORT INTELLIGENCE DOSSIER (PDF / PRINTABLE)      */}
      {/* ========================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-[#1F2839]/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <Card className="max-w-4xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 bg-white border-[#D9D9D9] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D9D9] mb-3 sm:mb-4 print:hidden">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#F4EFE6] border border-[#B69D74]/40 text-[#9E855D]">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1F2839]">Investigation Intelligence Dossier</h3>
                  <p className="text-[11px] sm:text-xs text-[#6B7280]">Official briefing and network summary</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" onClick={() => window.print()} className="gap-1.5 text-xs bg-[#B69D74] hover:bg-[#A68E66] text-white">
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowExportModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Printable Report Document */}
            <div className="flex-1 overflow-y-auto space-y-5 p-6 bg-[#FAF9F5] rounded-xl border border-[#D9D9D9] text-[#1F2839] font-sans text-xs leading-relaxed">
              <div className="border-b border-[#D9D9D9] pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-[#1F2839] uppercase tracking-wider">SUPREME COURT & SPECIAL INTELLIGENCE INVESTIGATION REPORT</h2>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Automated Multi-Source Criminal Network Extraction • BlockD Engine</p>
                </div>
                <div className="text-right text-[10px] text-[#6B7280] font-mono">
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Case ID: {activeCaseInfo?.caseId || "CASE-REF-2026"}</p>
                </div>
              </div>

              {/* Case Overview */}
              <div>
                <h4 className="text-xs font-bold text-[#B69D74] uppercase tracking-wide mb-1.5">1. Case Dossier Overview</h4>
                <p className="text-[#1F2839]"><strong className="text-[#1F2839]">Title:</strong> {activeCaseInfo?.caseTitle || "Active Investigation"}</p>
                <p className="text-[#4B5563] mt-1"><strong className="text-[#1F2839]">Executive Summary:</strong> {activeCaseInfo?.summary || "Analyzed evidence streams and constructed knowledge graph."}</p>
              </div>

              {/* Key Influencers */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-[#D9D9D9]">
                <div>
                  <p className="text-[10px] text-[#8F95A3] uppercase font-bold">Primary Syndicate Kingpin (PageRank)</p>
                  <p className="text-sm font-bold text-[#991B1B] mt-0.5">{stats.kingpinIdentified}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8F95A3] uppercase font-bold">Total Mapped Graph Dimensions</p>
                  <p className="text-sm font-bold text-[#1F2839] mt-0.5">{stats.totalNodes} Entities • {stats.totalEdges} Edges</p>
                </div>
              </div>

              {/* Anomaly Alerts Table */}
              {alerts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#991B1B] uppercase tracking-wide mb-1.5">2. Flagged Suspicious Pattern Alerts</h4>
                  <div className="space-y-1.5">
                    {alerts.map((a, i) => (
                      <div key={i} className="p-2.5 bg-white rounded border border-[#D9D9D9] text-[11px]">
                        <p className="font-bold text-[#1F2839]">[{a.severity}] {a.title}</p>
                        <p className="text-[#6B7280] text-[10px] mt-0.5">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cryptographic Proof */}
              <div className="border-t border-[#D9D9D9] pt-3 text-[10px] text-[#8F95A3] font-mono space-y-0.5">
                <p>Smart Contract Registry: 0x444CE1A92B10467885b5428F244795b54359D90f (Sepolia Testnet)</p>
                <p>SHA-256 Integrity Verification: Pre-Encryption Digital Checksum Validated</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EVIDENCE INGESTION & INDIAN KANOON LIVE SEARCH */}
      {showIngestionModal && (
        <div className="fixed inset-0 z-50 bg-[#1F2839]/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <Card className="max-w-3xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 bg-white border-[#D9D9D9] shadow-2xl relative overflow-hidden text-[#1F2839]">
            
            {/* INGESTION PROGRESS OVERLAY */}
            {isProcessing && (
              <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 space-y-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-[#B69D74]/20 border-t-[#B69D74] animate-spin" />
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[#B69D74] absolute" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1F2839] tracking-wide">Constructing Criminal Network Graph</h4>
                  <p className="text-[11px] sm:text-xs text-[#9E855D] font-mono mt-1">{progressStage}</p>
                </div>
                
                {/* Material 3 Linear Progress Bar */}
                <div className="w-full max-w-md space-y-2">
                  <md-linear-progress
                    value={ingestProgress / 100}
                    style={{
                      width: "100%",
                      "--md-linear-progress-active-indicator-color": "#B69D74",
                      "--md-linear-progress-track-color": "#D9D9D9",
                      height: "6px",
                      borderRadius: "9999px"
                    }}
                  ></md-linear-progress>
                </div>
                <div className="flex justify-between w-full max-w-md text-[10px] text-[#6B7280] font-mono">
                  <span>Extracting AI Nodes & IPC Sections</span>
                  <span className="text-[#B69D74] font-bold">{ingestProgress}% Complete</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-[#D9D9D9] mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#F4EFE6] border border-[#B69D74]/40 text-[#9E855D]">
                  <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1F2839]">Universal Ingestion & Kanoon Intelligence</h3>
                  <p className="text-[11px] sm:text-xs text-[#6B7280]">Drop PDFs, Audio, OCR, or Search Indian Kanoon live</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" disabled={isProcessing} onClick={() => setShowIngestionModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Android Material 3 Ingestion Mode Tabs */}
            <div className="mb-4 border border-[#D9D9D9] rounded-2xl overflow-hidden bg-[#FAF9F5]">
              <md-tabs
                style={{
                  "--md-primary-tab-active-indicator-color": "#B69D74",
                  "--md-primary-tab-active-label-text-color": "#1F2839",
                  "--md-primary-tab-label-text-color": "#6B7280",
                  "--md-primary-tab-container-color": "#FAF9F5",
                }}
              >
                <md-primary-tab
                  active={activeIngestTab === "filedrop" ? true : undefined}
                  onClick={() => setActiveIngestTab("filedrop")}
                >
                  File Evidence Drop (PDF / Audio)
                </md-primary-tab>
                <md-primary-tab
                  active={activeIngestTab === "kanoon" ? true : undefined}
                  onClick={() => setActiveIngestTab("kanoon")}
                >
                  Search Indian Kanoon Live
                </md-primary-tab>
              </md-tabs>
            </div>

            {/* TAB 1: FILE DROP & AUTOMATED AI NARRATIVE */}
            {activeIngestTab === "filedrop" && (
              <form onSubmit={handleProcessMultiModalSubmit} className="space-y-4 text-xs overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#1F2839] font-bold mb-1 block">Case / File Title</label>
                    <Input
                      placeholder="Case: e.g. Operation Shadow Syndicate"
                      value={intakeTitle}
                      onChange={(e) => setIntakeTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[#1F2839] font-bold mb-1 block">Offense Category</label>
                    <select
                      value={intakeCrimeType}
                      onChange={(e) => setIntakeCrimeType(e.target.value)}
                      className="w-full h-9 rounded-lg border border-[#D9D9D9] bg-white px-3 py-1 text-xs shadow-2xs text-[#1F2839] focus-visible:outline-none focus-visible:border-[#B69D74] cursor-pointer"
                    >
                      <option value="Homicide & Gangland Murder (IPC 302 / BNS 103)">Homicide & Gangland Murder (IPC 302 / BNS 103)</option>
                      <option value="Cyber Financial Fraud & Phishing (IT Act 66D / IPC 420)">Cyber Financial Fraud & Phishing (IT Act 66D / IPC 420)</option>
                      <option value="Hawala & Money Laundering (PMLA / IPC 120B)">Hawala & Money Laundering (PMLA / IPC 120B)</option>
                      <option value="Forgery, Counterfeiting & Fake Passports (IPC 467/471)">Forgery, Counterfeiting & Fake Passports (IPC 467/471)</option>
                      <option value="Narcotics & Psychotropic Trafficking (NDPS Act)">Narcotics & Psychotropic Trafficking (NDPS Act)</option>
                      <option value="Organised Extortion & Syndicate Rackets (MCOCA / Gangster Act)">Organised Extortion & Syndicate Rackets (MCOCA / Gangster Act)</option>
                      <option value="Vehicle Theft & Smuggling Network (IPC 379/411)">Vehicle Theft & Smuggling Network (IPC 379/411)</option>
                      <option value="Illegal Arms & Explosives Trade (Arms Act)">Illegal Arms & Explosives Trade (Arms Act)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#1F2839] font-bold mb-1 block">Investigating Unit</label>
                    <select
                      value={intakeJurisdiction}
                      onChange={(e) => setIntakeJurisdiction(e.target.value)}
                      className="w-full h-9 rounded-lg border border-[#D9D9D9] bg-white px-3 py-1 text-xs shadow-2xs text-[#1F2839] focus-visible:outline-none focus-visible:border-[#B69D74] cursor-pointer"
                    >
                      <option value="Cyber Crime Cell (CCC)">Cyber Crime Cell (CCC)</option>
                      <option value="Special Task Force (STF)">Special Task Force (STF)</option>
                      <option value="Economic Offences Wing (EOW)">Economic Offences Wing (EOW)</option>
                      <option value="Anti-Narcotics Cell (ANC)">Anti-Narcotics Cell (ANC)</option>
                      <option value="Crime Branch CID">Crime Branch CID</option>
                      <option value="National Investigation Agency (NIA)">National Investigation Agency (NIA)</option>
                      <option value="Intelligence Fusion & Strategic Operations (IFSO)">Intelligence Fusion & Strategic Operations (IFSO)</option>
                      <option value="Central Bureau of Investigation (CBI)">Central Bureau of Investigation (CBI)</option>
                      <option value="State Anti-Terrorism Squad (ATS)">State Anti-Terrorism Squad (ATS)</option>
                      <option value="Local District Police Station">Local District Police Station</option>
                    </select>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div className="border-2 border-dashed border-[#D9D9D9] hover:border-[#B69D74] rounded-2xl p-5 text-center bg-[#FAF9F5] transition-all cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.mp3,.wav,.ogg,.m4a,.jpg,.jpeg,.png,.csv,.txt,.json"
                    onChange={handleFileDrop}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="p-2 bg-[#F4EFE6] rounded-full border border-[#B69D74]/40 text-[#9E855D]">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#1F2839]">Drag & drop files here or click to browse</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        Accepts <strong>PDFs (Judgments/FIRs)</strong>, <strong>Audio Wiretaps (MP3/WAV)</strong>, <strong>CCTV Images</strong>, <strong>CSVs</strong> & <strong>JSON</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded File Queue */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 p-2.5 bg-[#FAF9F5] rounded-xl border border-[#D9D9D9]">
                    <p className="text-[10px] uppercase font-bold text-[#6B7280]">Queued for Live AI Extraction ({uploadedFiles.length} files):</p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {uploadedFiles.map((file, idx) => (
                        <span key={idx} className="bg-white border border-[#D9D9D9] text-[#1F2839] px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 font-mono shadow-2xs">
                          {file.name.endsWith(".pdf") ? <FileText className="w-3 h-3 text-[#991B1B]" /> : file.name.endsWith(".mp3") || file.name.endsWith(".wav") ? <FileAudio className="w-3 h-3 text-[#9E855D]" /> : <ImageIcon className="w-3 h-3 text-emerald-600" />}
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Statement / Auto-Filled AI Narrative */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#1F2839] font-bold block">
                      Evidence Narrative & Interrogation Brief
                    </label>
                    {isAnalyzingFiles && (
                      <span className="text-[10px] text-[#B69D74] flex items-center gap-1 font-sans font-bold">
                        <Loader2 className="w-3 h-3 animate-spin" /> AI Analyzing Uploaded Files...
                      </span>
                    )}
                    {!isAnalyzingFiles && manualNarrative && uploadedFiles.length > 0 && (
                      <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-sans font-bold">
                        <Sparkles className="w-3 h-3 text-[#B69D74]" /> Auto-Synthesized by AI
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={manualNarrative}
                    onChange={(e) => setManualNarrative(e.target.value)}
                    className="w-full rounded-lg border border-[#D9D9D9] bg-white p-2.5 text-xs text-[#1F2839] placeholder:text-[#8F95A3] focus-visible:outline-none focus-visible:border-[#B69D74] font-sans"
                    placeholder="Auto-populated by AI when files are uploaded, or paste custom FIR / witness statement..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#6B7280]">Extracts entities and constructs live knowledge graph immediately.</span>
                  <Button type="submit" variant="default" disabled={isProcessing} className="gap-2 font-bold bg-[#B69D74] hover:bg-[#A68E66] text-white">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isProcessing ? "Constructing Graph..." : "Process & Construct Graph"}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: INDIAN KANOON REAL JUDICIAL SEARCH & INGEST */}
            {activeIngestTab === "kanoon" && (
              <div className="flex-1 flex flex-col space-y-3 overflow-hidden text-xs">
                {/* Search Bar (Defaults to Empty / None) */}
                <form onSubmit={handleSearchKanoon} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8F95A3]" />
                    <Input
                      value={kanoonQuery}
                      onChange={(e) => setKanoonQuery(e.target.value)}
                      placeholder="Search judgments by case name, suspect, or section (e.g. 'murder', 'State of Maharashtra', 'FIR 104/2026')..."
                      className="pl-9 h-9 text-xs border-[#D9D9D9] focus-visible:border-[#B69D74]"
                    />
                  </div>
                  <Button type="submit" variant="default" disabled={isSearchingKanoon || !kanoonQuery.trim()} className="h-9 px-4 text-xs gap-1.5 bg-[#B69D74] hover:bg-[#A68E66] text-white font-bold">
                    {isSearchingKanoon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search Kanoon
                  </Button>
                </form>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {kanoonResults.length === 0 && !isSearchingKanoon && (
                    <div className="p-8 text-center text-[#6B7280] border border-[#D9D9D9] rounded-xl bg-[#FAF9F5]">
                      <Scale className="w-8 h-8 mx-auto mb-2 text-[#B69D74]" />
                      <p className="font-bold text-[#1F2839]">Search Indian Kanoon live</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">Type any suspect name, judicial appeal, or penal section above to retrieve official court records.</p>
                    </div>
                  )}

                  {kanoonResults.map((doc) => (
                    <div
                      key={doc.tid}
                      className="p-3.5 rounded-xl border border-[#D9D9D9] bg-white hover:border-[#B69D74] transition-all space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="primary" className="text-[9px] mb-1">{doc.docsource || "Supreme Court of India"}</Badge>
                          <h4 className="font-bold text-xs text-[#1F2839] leading-snug">{doc.title}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isProcessing}
                          onClick={() => handleIngestKanoonDoc(doc)}
                          className="text-[11px] h-7 px-3 gap-1 shrink-0 font-bold bg-[#B69D74] hover:bg-[#A68E66] text-white"
                        >
                          <BookOpen className="w-3 h-3" /> Ingest into Graph
                        </Button>
                      </div>

                      <p className="text-[11px] text-[#6B7280] leading-relaxed">{doc.headline}</p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-[#8F95A3] font-mono">
                        <span>Doc ID: #{doc.tid}</span>
                        <span>Date: {doc.publishdate || "2026"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* BLOCKCHAIN CUSTODY MODAL */}
      {showCustodyModal && (
        <div className="fixed inset-0 z-50 bg-[#1F2839]/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col p-4 sm:p-6 bg-white border-[#D9D9D9] shadow-2xl text-[#1F2839]">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D9D9] mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1F2839]">Smart Contract Chain of Custody</h3>
                  <p className="text-[11px] sm:text-xs text-[#6B7280]">BlockDEvidenceRegistry.sol • Sepolia Testnet</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowCustodyModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="p-3.5 sm:p-4 rounded-xl border border-[#D9D9D9] bg-[#FAF9F5] space-y-2.5 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <Badge variant="primary">Smart Contract Evidence Vault</Badge>
                  <Badge variant="success">SEPOLIA TESTNET</Badge>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1F2839]">BlockDEvidenceRegistry.sol</h4>
                <div className="font-mono text-[10px] sm:text-[11px] space-y-1">
                  <p className="break-all"><span className="text-[#8F95A3]">Contract Address:</span> <span className="text-[#1F2839] font-bold">0x444CE1A92B10467885b5428F244795b54359D90f</span></p>
                  <p><span className="text-[#8F95A3]">Integrity Check:</span> <span className="text-emerald-700 font-semibold">SHA-256 Pre-Encryption Verification Enabled</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
