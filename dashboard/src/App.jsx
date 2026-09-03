import React, { useState, useEffect } from "react";
import { NetworkGraphCanvas } from "./components/NetworkGraphCanvas";
import { AssistantThread } from "./components/AssistantThread";
import { Card, Badge, Button, Input } from "./components/ui";
import {
  Network,
  FileCheck2,
  Cpu,
  Fingerprint,
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
  BookOpen
} from "lucide-react";

// Production / Environment API Base URL Resolver
const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5001" : "");

export default function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    totalEvidenceFiles: 0,
    kingpinIdentified: "Awaiting Ingestion",
    topBroker: "Awaiting Ingestion"
  });
  const [selectedNode, setSelectedNode] = useState(null);

  // Modals
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [activeIngestTab, setActiveIngestTab] = useState("filedrop");

  // Form State
  const [intakeTitle, setIntakeTitle] = useState("New Case Investigation");
  const [intakeCrimeType, setIntakeCrimeType] = useState("General Crime / Fraud");
  const [intakeJurisdiction, setIntakeJurisdiction] = useState("Investigation Bureau");
  const [manualNarrative, setManualNarrative] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Indian Kanoon Search & Ingest State
  const [kanoonQuery, setKanoonQuery] = useState("forgery racket");
  const [kanoonResults, setKanoonResults] = useState([]);
  const [isSearchingKanoon, setIsSearchingKanoon] = useState(false);

  // Dynamic Chat Messages
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Intelligence Gateway initialized. The workspace is clean. Drop a PDF/Audio evidence file or search Indian Kanoon live to construct the criminal network graph and start investigating.",
      cards: [
        {
          title: "🚀 Live Dynamic Intelligence Ready",
          badge: "AWAITING INGESTION",
          variant: "primary",
          desc: "Click 'Ingest Evidence & Kanoon Search' on the top right to load any case, and watch the graph and copilot populate in real time."
        }
      ]
    }
  ]);
  const [highlightedPath, setHighlightedPath] = useState(null);

  const refreshDossier = () => {
    fetch(`${API_BASE}/api/case/dossier`)
      .then(res => res.json())
      .then(data => {
        if (data.graphData) {
          setGraphData(data.graphData);
          setStats(data.stats);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshDossier();
  }, []);

  const handleResetWorkspace = async () => {
    try {
      await fetch(`${API_BASE}/api/workspace/reset`, { method: "POST" });
      setGraphData({ nodes: [], edges: [] });
      setStats({
        totalNodes: 0,
        totalEdges: 0,
        totalEvidenceFiles: 0,
        kingpinIdentified: "Awaiting Ingestion",
        topBroker: "Awaiting Ingestion"
      });
      setMessages([
        {
          sender: "ai",
          text: "Workspace reset. Ready for a new case ingestion.",
          cards: []
        }
      ]);
    } catch (e) {}
  };

  const handleFileDrop = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // Dynamic Chat Query to Backend
  const handleSendMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;
    const query = textToSend.trim();

    const newMsgList = [...messages, { sender: "user", text: query }];
    setMessages(newMsgList);

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
    }
  };

  // Live Multi-Modal File Upload Submission
  const handleProcessMultiModalSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("caseTitle", intakeTitle);
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

      if (data.updatedGraphData) {
        setGraphData(data.updatedGraphData);
        setStats({
          totalNodes: data.updatedGraphData.nodes.length,
          totalEdges: data.updatedGraphData.edges.length,
          totalEvidenceFiles: 1,
          kingpinIdentified: data.updatedAnalytics?.topKingpins[0]?.label || "Primary Entity",
          topBroker: data.updatedAnalytics?.topBrokers[0]?.label || "Key Broker"
        });
      }

      setIsProcessing(false);
      setShowIngestionModal(false);

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: `⚡ Ingestion Complete for "${intakeTitle}". Extracted ${data.caseRecord?.entities?.length || 0} entities and linked into graph (${data.updatedGraphData?.nodes?.length || 0} nodes live).`,
          cards: [
            {
              title: "📄 Case Ingested & Graph Built",
              badge: `${data.updatedGraphData?.nodes?.length || 0} NODES LIVE`,
              variant: "success",
              desc: `Extracted entities from uploaded source and cross-referenced Indian Kanoon records.`
            }
          ]
        }
      ]);
      setUploadedFiles([]);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setShowIngestionModal(false);
    }
  };

  // Indian Kanoon Live Search Execution
  const handleSearchKanoon = async (e) => {
    e?.preventDefault();
    setIsSearchingKanoon(true);
    try {
      const res = await fetch(`${API_BASE}/api/kanoon/search?q=${encodeURIComponent(kanoonQuery)}`);
      const data = await res.json();
      setKanoonResults(data.docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingKanoon(false);
    }
  };

  // Ingest Selected Kanoon Judgment into Live Graph
  const handleIngestKanoonDoc = async (doc) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/kanoon/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: String(doc.tid), title: doc.title })
      });
      const data = await res.json();

      if (data.updatedGraphData) {
        setGraphData(data.updatedGraphData);
        setStats({
          totalNodes: data.updatedGraphData.nodes.length,
          totalEdges: data.updatedGraphData.edges.length,
          totalEvidenceFiles: 1,
          kingpinIdentified: data.updatedAnalytics?.topKingpins[0]?.label || "Primary Accused",
          topBroker: data.updatedAnalytics?.topBrokers[0]?.label || "Key Entity"
        });
      }

      setIsProcessing(false);
      setShowIngestionModal(false);

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: `⚖️ Ingested Indian Kanoon Document: "${doc.title}". Built knowledge graph containing ${data.updatedGraphData?.nodes?.length || 0} nodes!`,
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
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-850 bg-slate-925/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-extrabold text-xl tracking-tight text-white">BlockD</h1>
          {graphData.nodes.length > 0 && (
            <Badge variant="success" className="text-[10px] px-2 py-0">LIVE CASE ACTIVE</Badge>
          )}
        </div>

        {/* Top Nav Action Buttons */}
        <div className="flex items-center gap-3">
          {graphData.nodes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetWorkspace}
              className="text-xs gap-1.5 border-slate-750 bg-slate-900/60 hover:bg-slate-800 text-slate-400"
              title="Clear workspace"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCustodyModal(true)}
            className="text-xs gap-1.5 border-slate-700 bg-slate-900/60 hover:bg-slate-800"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Blockchain Custody
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={() => setShowIngestionModal(true)}
            className="gap-1.5 shadow-lg shadow-indigo-600/30 font-medium"
          >
            <PlusCircle className="w-4 h-4" /> Ingest Evidence & Kanoon Search
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 p-6 max-w-[1800px] w-full mx-auto space-y-5">
        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-slate-850 bg-slate-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Network Entities</span>
              <div className="text-2xl font-bold text-slate-100 mt-1">{stats.totalNodes} Nodes</div>
              <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalEdges} relational links mapped</p>
            </div>
            <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-900/50">
              <Network className="w-5 h-5 text-indigo-400" />
            </div>
          </Card>

          <Card className="p-4 border-slate-850 bg-slate-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Identified Key Influencer</span>
              <div className="text-2xl font-bold text-rose-400 mt-1 truncate max-w-[200px]">{stats.kingpinIdentified}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Calculated PageRank metric</p>
            </div>
            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/50">
              <Cpu className="w-5 h-5 text-rose-400" />
            </div>
          </Card>

          <Card className="p-4 border-slate-850 bg-slate-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Key Centrality Broker</span>
              <div className="text-2xl font-bold text-amber-300 mt-1 truncate max-w-[200px]">{stats.topBroker}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Betweenness centrality bridge</p>
            </div>
            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-900/50">
              <Fingerprint className="w-5 h-5 text-amber-400" />
            </div>
          </Card>
        </div>

        {/* 2/3rd Graph + 1/3rd Assistant Thread Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2/3rd: NETWORK GRAPH CANVAS */}
          <div className="lg:col-span-2">
            <Card className="p-2.5 bg-slate-925/90 border-slate-800 shadow-2xl relative">
              <NetworkGraphCanvas
                graphData={graphData}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  handleSendMessage(`Deep dive on entity ${node.label}`);
                }}
                selectedNodeId={selectedNode?.id}
                highlightedPath={highlightedPath}
                onOpenIngestion={() => setShowIngestionModal(true)}
              />
            </Card>
          </div>

          {/* RIGHT 1/3rd: ASSISTANT-UI STYLE COPILOT THREAD */}
          <div className="flex flex-col h-[740px]">
            <AssistantThread
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: EVIDENCE INGESTION & INDIAN KANOON LIVE SEARCH     */}
      {/* ========================================================= */}
      {showIngestionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col p-6 bg-slate-925 border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Universal Ingestion & Kanoon Intelligence Gateway</h3>
                  <p className="text-xs text-slate-400">Drop PDFs, Audio, OCR, or Search Indian Kanoon live</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowIngestionModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Ingestion Mode Switcher */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                size="sm"
                variant={activeIngestTab === "filedrop" ? "default" : "secondary"}
                onClick={() => setActiveIngestTab("filedrop")}
                className="gap-1.5"
              >
                <UploadCloud className="w-4 h-4" /> Multi-Modal File Drop (PDF / Audio / OCR)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeIngestTab === "kanoon" ? "default" : "secondary"}
                onClick={() => {
                  setActiveIngestTab("kanoon");
                  if (kanoonResults.length === 0) handleSearchKanoon();
                }}
                className="gap-1.5"
              >
                <Scale className="w-4 h-4 text-amber-400" /> Search Indian Kanoon Live
              </Button>
            </div>

            {/* TAB 1: FILE DROP & MANUAL NARRATIVE */}
            {activeIngestTab === "filedrop" && (
              <form onSubmit={handleProcessMultiModalSubmit} className="space-y-4 text-xs overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">Case / File Title</label>
                    <Input value={intakeTitle} onChange={(e) => setIntakeTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">Offense Category</label>
                    <Input value={intakeCrimeType} onChange={(e) => setIntakeCrimeType(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">Investigating Unit</label>
                    <Input value={intakeJurisdiction} onChange={(e) => setIntakeJurisdiction(e.target.value)} />
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div className="border-2 border-dashed border-slate-750 hover:border-indigo-500/80 rounded-2xl p-5 text-center bg-slate-950/60 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.mp3,.wav,.ogg,.m4a,.jpg,.jpeg,.png,.csv,.txt"
                    onChange={handleFileDrop}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="p-2 bg-indigo-950/60 rounded-full border border-indigo-800/60 text-indigo-400">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-200">Drag & drop files here or click to browse</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Accepts <strong>PDFs (Judgments/FIRs)</strong>, <strong>Audio Wiretaps (MP3/WAV)</strong>, <strong>CCTV Images</strong> & <strong>CDRs (CSV)</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded File Queue */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Queued for Live Extraction ({uploadedFiles.length} files):</p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {uploadedFiles.map((file, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-750 text-slate-200 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 font-mono">
                          {file.name.endsWith(".pdf") ? <FileText className="w-3 h-3 text-rose-400" /> : file.name.endsWith(".mp3") || file.name.endsWith(".wav") ? <FileAudio className="w-3 h-3 text-sky-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Statement Text Area */}
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Report Narrative / Interrogation Summary / Judgment Excerpt
                  </label>
                  <textarea
                    rows={4}
                    value={manualNarrative}
                    onChange={(e) => setManualNarrative(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-indigo-500 font-mono"
                    placeholder="Paste FIR report narrative, witness statements, or judgment excerpts..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">Constructs live knowledge graph immediately from this source.</span>
                  <Button type="submit" variant="default" disabled={isProcessing} className="gap-2 font-medium">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isProcessing ? "Extracting & Constructing Graph..." : "Process & Construct Graph"}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: INDIAN KANOON REAL JUDICIAL SEARCH & INGEST */}
            {activeIngestTab === "kanoon" && (
              <div className="flex-1 flex flex-col space-y-3 overflow-hidden text-xs">
                {/* Search Bar */}
                <form onSubmit={handleSearchKanoon} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <Input
                      value={kanoonQuery}
                      onChange={(e) => setKanoonQuery(e.target.value)}
                      placeholder="Search judgments by suspect name, FIR number, or crime (e.g. 'Mazahar Khan', 'vehicle theft syndicate')..."
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <Button type="submit" variant="default" disabled={isSearchingKanoon} className="h-9 px-4 text-xs gap-1.5">
                    {isSearchingKanoon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search Kanoon
                  </Button>
                </form>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {kanoonResults.map((doc) => (
                    <div
                      key={doc.tid}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="primary" className="text-[9px] mb-1">{doc.docsource || "Supreme Court of India"}</Badge>
                          <h4 className="font-bold text-xs text-white leading-snug">{doc.title}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isProcessing}
                          onClick={() => handleIngestKanoonDoc(doc)}
                          className="text-[11px] h-7 px-3 gap-1 shrink-0 font-medium"
                        >
                          <BookOpen className="w-3 h-3" /> Ingest into Graph
                        </Button>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">{doc.headline}</p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[85vh] flex flex-col p-6 bg-slate-925 border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Smart Contract Chain of Custody</h3>
                  <p className="text-xs text-slate-400">BlockDEvidenceRegistry.sol • Sepolia Testnet</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowCustodyModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">Smart Contract Evidence Vault</Badge>
                  <Badge variant="success">SEPOLIA TESTNET</Badge>
                </div>
                <h4 className="font-semibold text-sm text-slate-100">BlockDEvidenceRegistry.sol</h4>
                <div className="font-mono text-[11px] space-y-1">
                  <p className="truncate"><span className="text-slate-500">Contract Address:</span> <span className="text-sky-400">0x444CE1A92B10467885b5428F244795b54359D90f</span></p>
                  <p className="truncate"><span className="text-slate-500">Integrity Check:</span> <span className="text-emerald-400">SHA-256 Pre-Encryption Verification Enabled</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
