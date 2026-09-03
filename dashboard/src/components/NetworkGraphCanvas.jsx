import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "./ui";
import { ZoomIn, ZoomOut, RotateCcw, Sparkles } from "lucide-react";

export function NetworkGraphCanvas({ graphData, onSelectNode, selectedNodeId, highlightedPath, onOpenIngestion }) {
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 80, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Enhanced organic force-radial layout with large breathing room (800px - 1400px diameter)
  const layoutPositions = useMemo(() => {
    const positions = new Map();
    const cx = 1200;
    const cy = 900;
    const count = nodes.length;

    // Group nodes by type for distinct orbital bands
    const suspects = nodes.filter((n) => n.data.type === "SUSPECT");
    const firs = nodes.filter((n) => n.data.type === "FIR_CASE");
    const orgs = nodes.filter((n) => n.data.type === "ORGANIZATION");
    const others = nodes.filter(
      (n) => !["SUSPECT", "FIR_CASE", "ORGANIZATION"].includes(n.data.type)
    );

    // Band 1: Central Suspects (Radius 0 to 320px)
    suspects.forEach((node, idx) => {
      if (suspects.length === 1) {
        positions.set(node.data.id, { x: cx, y: cy });
      } else {
        const angle = (idx / suspects.length) * 2 * Math.PI;
        positions.set(node.data.id, {
          x: cx + Math.cos(angle) * 320,
          y: cy + Math.sin(angle) * 260,
        });
      }
    });

    // Band 2: FIR & Judicial Cases (Radius 560px - 640px)
    firs.forEach((node, idx) => {
      const angle = (idx / Math.max(firs.length, 1)) * 2 * Math.PI + 0.3;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 580,
        y: cy + Math.sin(angle) * 480,
      });
    });

    // Band 3: Institutions & Courts (Radius 820px - 900px)
    orgs.forEach((node, idx) => {
      const angle = (idx / Math.max(orgs.length, 1)) * 2 * Math.PI + 0.7;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 850,
        y: cy + Math.sin(angle) * 700,
      });
    });

    // Band 4: Identifiers, Vehicles, Weapons (Radius 1050px - 1150px)
    others.forEach((node, idx) => {
      const angle = (idx / Math.max(others.length, 1)) * 2 * Math.PI + 1.1;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 1100,
        y: cy + Math.sin(angle) * 920,
      });
    });

    // Fallback for any unpositioned node
    nodes.forEach((node, idx) => {
      if (!positions.has(node.data.id)) {
        const angle = (idx / Math.max(count, 1)) * 2 * Math.PI;
        positions.set(node.data.id, {
          x: cx + Math.cos(angle) * 600,
          y: cy + Math.sin(angle) * 500,
        });
      }
    });

    return positions;
  }, [nodes]);

  // Attach non-passive wheel listener directly to container DOM element
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNonPassive = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((z) => Math.min(Math.max(z * zoomFactor, 0.2), 3.0));
    };

    el.addEventListener("wheel", handleWheelNonPassive, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNonPassive);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.tagName === "circle" || e.target.tagName === "text") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getNodeColor = (type) => {
    switch (type) {
      case "SUSPECT":
        return "#f43f5e";
      case "FIR_CASE":
        return "#fb923c";
      case "ORGANIZATION":
        return "#38bdf8";
      case "PHONE":
        return "#34d399";
      case "IMEI":
        return "#818cf8";
      case "VEHICLE":
        return "#c084fc";
      case "WEAPON":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const isPathEdge = (edge) => {
    if (!highlightedPath || highlightedPath.length < 2) return false;
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if (
        (edge.data.source === highlightedPath[i] && edge.data.target === highlightedPath[i + 1]) ||
        (edge.data.source === highlightedPath[i + 1] && edge.data.target === highlightedPath[i])
      ) {
        return true;
      }
    }
    return false;
  };

  if (nodes.length === 0) {
    return (
      <div className="relative w-full h-[720px] bg-slate-950/95 rounded-xl border border-slate-850 flex flex-col items-center justify-center p-8 text-center select-none space-y-4">
        <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-900/50 text-indigo-400 animate-pulse">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-base font-bold text-slate-100">Knowledge Graph Awaiting Case Ingestion</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Drop a scanned PDF (FIR/chargesheet), audio wiretap, or search <strong>Indian Kanoon</strong> live to dynamically construct the criminal network graph.
          </p>
        </div>
        <Button size="sm" variant="default" onClick={onOpenIngestion} className="gap-2 shadow-lg shadow-indigo-600/30">
          Open Ingestion Gateway
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[720px] bg-slate-950/95 rounded-xl border border-slate-850 overflow-hidden select-none"
    >
      {/* Canvas Controls Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-lg shadow-xl">
        <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(z + 0.15, 3.0))} title="Zoom In">
          <ZoomIn className="w-4 h-4 text-slate-300" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(z - 0.15, 0.2))} title="Zoom Out">
          <ZoomOut className="w-4 h-4 text-slate-300" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => { setZoom(0.75); setPan({ x: 80, y: 50 }); }} title="Reset View">
          <RotateCcw className="w-4 h-4 text-slate-300" />
        </Button>
      </div>

      {/* Spacious Legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap max-w-md gap-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg shadow-xl text-[11px]">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Accused / Suspect</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> FIR / Court Case</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Organization / Court</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Phone</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Vehicle / Asset</div>
      </div>

      {/* SVG Infinite Space Graph */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#1e293b" />
          </pattern>
          <rect x="-2000" y="-2000" width="6000" height="5000" fill="url(#grid)" />

          {/* Edges with Relationship Badges */}
          {edges.map((edge) => {
            const srcPos = layoutPositions.get(edge.data.source);
            const tgtPos = layoutPositions.get(edge.data.target);
            if (!srcPos || !tgtPos) return null;

            const isHigh = isPathEdge(edge);
            const midX = (srcPos.x + tgtPos.x) / 2;
            const midY = (srcPos.y + tgtPos.y) / 2;
            const label = edge.data.label || edge.data.relation || "CONNECTED_TO";
            const textWidth = Math.max(label.length * 6.5 + 18, 65);

            return (
              <g key={edge.data.id || `${edge.data.source}-${edge.data.target}`}>
                <line
                  x1={srcPos.x}
                  y1={srcPos.y}
                  x2={tgtPos.x}
                  y2={tgtPos.y}
                  stroke={isHigh ? "#f43f5e" : "#475569"}
                  strokeWidth={isHigh ? 3.5 : 2}
                  strokeDasharray={isHigh ? "6" : undefined}
                  markerEnd={isHigh ? "url(#arrow-active)" : "url(#arrow)"}
                  className="transition-all duration-300"
                />

                <rect
                  x={midX - textWidth / 2}
                  y={midY - 10}
                  width={textWidth}
                  height="20"
                  rx="6"
                  fill="#090d16"
                  stroke={isHigh ? "#f43f5e" : "#334155"}
                  strokeWidth="1.2"
                  className="shadow-md pointer-events-none"
                />

                <text
                  x={midX}
                  y={midY + 4}
                  fill={isHigh ? "#fda4af" : "#cbd5e1"}
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  className="font-mono pointer-events-none select-none tracking-tight"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = layoutPositions.get(node.data.id);
            if (!pos) return null;

            const isSelected = selectedNodeId === node.data.id;
            const isPathNode = highlightedPath && highlightedPath.includes(node.data.id);
            const color = getNodeColor(node.data.type);
            const radius = node.data.type === "SUSPECT" ? 24 : node.data.type === "FIR_CASE" ? 20 : 17;
            const labelText = node.data.label || node.data.id;

            return (
              <g
                key={node.data.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(node.data)}
                className="cursor-pointer group"
              >
                {(isSelected || isPathNode) && (
                  <circle r={radius + 14} fill={isPathNode ? "rgba(244, 63, 94, 0.25)" : "rgba(99, 102, 241, 0.3)"} className="animate-pulse" />
                )}

                <circle
                  r={radius}
                  fill="#080d1a"
                  stroke={color}
                  strokeWidth={isSelected || isPathNode ? 4 : 2.5}
                  className="transition-transform duration-200 group-hover:scale-115"
                />

                <circle r={radius - 6} fill={color} opacity="0.4" />

                {/* Node Label Pill */}
                <g transform={`translate(0, ${radius + 18})`}>
                  <rect
                    x={-((labelText.length * 6.5 + 20) / 2)}
                    y="-12"
                    width={labelText.length * 6.5 + 20}
                    height="22"
                    rx="6"
                    fill="#040711"
                    stroke={isSelected ? color : "#1e293b"}
                    strokeWidth="1.2"
                    opacity="0.95"
                    className="shadow-lg"
                  />
                  <text
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#f1f5f9"}
                    fontSize="11"
                    fontWeight={isSelected ? "700" : "600"}
                    className="pointer-events-none select-none"
                    y="3"
                  >
                    {labelText}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
