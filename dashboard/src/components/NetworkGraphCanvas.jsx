import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "./ui";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network,
  PlusCircle,
  Play,
  Loader2,
  Maximize2,
  GitBranch,
  Layers,
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react";

export function NetworkGraphCanvas({
  graphData,
  onSelectNode,
  selectedNodeId,
  highlightedPath,
  onOpenIngestion,
  onLoadSample,
  isLoadingSample,
  timeline: propTimeline
}) {
  const containerRef = useRef(null);
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const storyline = graphData?.storyline || {};
  const timelineEvents = propTimeline || graphData?.timeline || storyline?.timeline || [];

  const rootNodeId = useMemo(() => {
    if (storyline?.rootNodeId) return storyline.rootNodeId;
    const firstSuspect = nodes.find((n) => n.data.type === "SUSPECT");
    if (firstSuspect) return firstSuspect.data.id;
    return nodes[0]?.data?.id || null;
  }, [storyline, nodes]);
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  const [isExpandedAll, setIsExpandedAll] = useState(false);
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(null);

  // Compute Visible Nodes: root + all expanded nodes + direct connections of expanded nodes
  const visibleNodeIds = useMemo(() => {
    if (isExpandedAll || !rootNodeId) {
      return new Set(nodes.map((n) => n.data.id));
    }

    const visible = new Set([rootNodeId]);
    expandedNodeIds.forEach((id) => visible.add(id));

    expandedNodeIds.forEach((parentId) => {
      edges.forEach((e) => {
        if (e.data.source === parentId) visible.add(e.data.target);
        if (e.data.target === parentId) visible.add(e.data.source);
      });
    });

    return visible;
  }, [nodes, edges, expandedNodeIds, isExpandedAll, rootNodeId]);

  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => visibleNodeIds.has(n.data.id));
  }, [nodes, visibleNodeIds]);

  const visibleEdges = useMemo(() => {
    return edges.filter(
      (e) => visibleNodeIds.has(e.data.source) && visibleNodeIds.has(e.data.target)
    );
  }, [edges, visibleNodeIds]);

  const unrevealedChildCounts = useMemo(() => {
    const counts = new Map();
    visibleNodes.forEach((node) => {
      const nodeId = node.data.id;
      let unrevealed = 0;
      edges.forEach((e) => {
        if (e.data.source === nodeId && !visibleNodeIds.has(e.data.target)) unrevealed++;
        if (e.data.target === nodeId && !visibleNodeIds.has(e.data.source)) unrevealed++;
      });
      if (unrevealed > 0) {
        counts.set(nodeId, unrevealed);
      }
    });
    return counts;
  }, [visibleNodes, edges, visibleNodeIds]);

  const [viewport, setViewport] = useState({ x: -280, y: -180, zoom: 0.65 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 });

  // Breathable Multi-Band Orbital Layout with generous spacing
  const layoutPositions = useMemo(() => {
    const positions = new Map();
    const cx = 2000;
    const cy = 1500;

    const suspects = nodes.filter((n) => n.data.type === "SUSPECT");
    const firs = nodes.filter((n) => n.data.type === "FIR_CASE" || n.data.type === "CRIME_SECTION");
    const orgs = nodes.filter((n) => n.data.type === "ORGANIZATION" || (n.data.label && n.data.label.startsWith("Precedent:")));
    const assets = nodes.filter((n) => ["BANK_ACCOUNT", "VEHICLE", "PHONE_NUMBER", "PHONE", "IMEI", "LOCATION", "WEAPON"].includes(n.data.type));
    const others = nodes.filter(
      (n) => !suspects.includes(n) && !firs.includes(n) && !orgs.includes(n) && !assets.includes(n)
    );

    // Orbit 1: Core Operatives & Kingpins (Radius 0 - 520px)
    suspects.forEach((node, idx) => {
      if (node.data.id === rootNodeId && suspects.length > 1) {
        positions.set(node.data.id, { x: cx, y: cy });
      } else if (suspects.length === 1) {
        positions.set(node.data.id, { x: cx, y: cy });
      } else {
        const angle = (idx / suspects.length) * 2 * Math.PI;
        positions.set(node.data.id, {
          x: cx + Math.cos(angle) * 520,
          y: cy + Math.sin(angle) * 420,
        });
      }
    });

    // Orbit 2: Financial Assets, Mule Accounts, Vehicles & Burners (Radius 980px - 1200px)
    assets.forEach((node, idx) => {
      const angle = (idx / Math.max(assets.length, 1)) * 2 * Math.PI + 0.45;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 1020,
        y: cy + Math.sin(angle) * 840,
      });
    });

    // Orbit 3: Judicial Precedents & External Organizations (Radius 1450px - 1700px)
    orgs.forEach((node, idx) => {
      const angle = (idx / Math.max(orgs.length, 1)) * 2 * Math.PI + 0.95;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 1480,
        y: cy + Math.sin(angle) * 1220,
      });
    });

    // Orbit 4: Statutory Penal Sections & FIR Records (Radius 1850px - 2100px)
    firs.forEach((node, idx) => {
      const angle = (idx / Math.max(firs.length, 1)) * 2 * Math.PI + 1.45;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 1880,
        y: cy + Math.sin(angle) * 1540,
      });
    });

    // Outer Orbit: Miscellaneous Discovered Intelligence Nodes
    others.forEach((node, idx) => {
      const angle = (idx / Math.max(others.length, 1)) * 2 * Math.PI + 2.1;
      positions.set(node.data.id, {
        x: cx + Math.cos(angle) * 2180,
        y: cy + Math.sin(angle) * 1750,
      });
    });

    return positions;
  }, [nodes, rootNodeId]);

  // Auto-Fit Bounding Box for Visible Nodes
  const fitGraphView = useCallback(() => {
    const el = containerRef.current;
    if (!el || visibleNodes.length === 0) return;

    const width = el.clientWidth || 900;
    const height = el.clientHeight || 700;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    visibleNodes.forEach((n) => {
      const pos = layoutPositions.get(n.data.id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
      }
    });

    if (minX === Infinity) {
      minX = 1600; maxX = 2400; minY = 1100; maxY = 1900;
    }

    const graphWidth = Math.max(maxX - minX + 420, 550);
    const graphHeight = Math.max(maxY - minY + 420, 480);
    const scaleX = width / graphWidth;
    const scaleY = height / graphHeight;
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.25);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setViewport({
      x: width / 2 - midX * zoom,
      y: height / 2 - midY * zoom,
      zoom,
    });
  }, [visibleNodes, layoutPositions]);

  const lastRootRef = useRef(null);
  const lastCaseKeyRef = useRef(null);

  // ONLY reset expanded state when a brand new case / different root node is loaded
  useEffect(() => {
    const currentCaseKey = graphData?.caseId || graphData?.caseRecord?.caseId || rootNodeId;
    if (rootNodeId && (lastRootRef.current !== rootNodeId || lastCaseKeyRef.current !== currentCaseKey)) {
      lastRootRef.current = rootNodeId;
      lastCaseKeyRef.current = currentCaseKey;
      setExpandedNodeIds(new Set([rootNodeId]));
      setIsExpandedAll(false);
      setSelectedTimelineIndex(null);
      setTimeout(() => fitGraphView(), 60);
    }
  }, [rootNodeId, graphData?.caseId, graphData?.caseRecord?.caseId, fitGraphView]);

  // Keep selected node expanded
  useEffect(() => {
    if (selectedNodeId) {
      setExpandedNodeIds((prev) => {
        if (prev.has(selectedNodeId)) return prev;
        const next = new Set(prev);
        next.add(selectedNodeId);
        return next;
      });
    }
  }, [selectedNodeId]);

  const handleMouseDown = (e) => {
    if (e.target.closest(".node-group") || e.target.closest(".timeline-card")) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setViewport((prev) => ({
      ...prev,
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support: 1-finger pan & 2-finger pinch zoom
  const touchRef = useRef({ dist: 0, startX: 0, startY: 0, originX: 0, originY: 0, isPinching: false });

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchRef.current = {
        dist: 0,
        startX: touch.clientX,
        startY: touch.clientY,
        originX: viewport.x,
        originY: viewport.y,
        isPinching: false,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = {
        dist: Math.hypot(dx, dy),
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        isPinching: true,
      };
    }
  };

  const handleTouchMove = (e) => {
    const el = containerRef.current;
    if (!el) return;
    if (e.touches.length === 1 && !touchRef.current.isPinching) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchRef.current.startX;
      const dy = touch.clientY - touchRef.current.startY;
      setViewport((prev) => ({
        ...prev,
        x: touchRef.current.originX + dx,
        y: touchRef.current.originY + dy,
      }));
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      if (touchRef.current.dist > 0 && currentDist > 0) {
        const factor = currentDist / touchRef.current.dist;
        const rect = el.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        setViewport((prev) => {
          const nextZoom = Math.min(Math.max(prev.zoom * factor, 0.1), 4.0);
          const ratio = nextZoom / prev.zoom;
          return {
            zoom: nextZoom,
            x: midX - (midX - prev.x) * ratio,
            y: midY - (midY - prev.y) * ratio,
          };
        });
      }
      touchRef.current.dist = currentDist;
    }
  };

  const handleTouchEnd = () => {
    touchRef.current.isPinching = false;
    touchRef.current.dist = 0;
  };

  // Smooth Cursor-Centered Mouse Wheel & Trackpad Pinch Zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.target.closest(".timeline-card") || e.target.closest(".scrollbar-thin")) return;

      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let zoomFactor;
      if (e.ctrlKey) {
        // Trackpad pinch zoom
        zoomFactor = Math.min(Math.max(1 - e.deltaY * 0.015, 0.7), 1.3);
      } else {
        // Standard mouse wheel
        zoomFactor = Math.min(Math.max(Math.exp(-e.deltaY * 0.0022), 0.7), 1.4);
      }

      setViewport((prev) => {
        const nextZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.1), 4.0);
        const ratio = nextZoom / prev.zoom;

        return {
          zoom: nextZoom,
          x: mouseX - (mouseX - prev.x) * ratio,
          y: mouseY - (mouseY - prev.y) * ratio,
        };
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [nodes.length]);

  // Centered Toolbar Zoom Controls
  const zoomByFactor = (factor) => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth || 900;
    const height = el.clientHeight || 700;
    const centerX = width / 2;
    const centerY = height / 2;

    setViewport((prev) => {
      const nextZoom = Math.min(Math.max(prev.zoom * factor, 0.1), 4.0);
      const ratio = nextZoom / prev.zoom;
      return {
        zoom: nextZoom,
        x: centerX - (centerX - prev.x) * ratio,
        y: centerY - (centerY - prev.y) * ratio,
      };
    });
  };

  const handleZoomIn = () => zoomByFactor(1.25);
  const handleZoomOut = () => zoomByFactor(0.8);
  const handleResetView = () => fitGraphView();

  const handleDoubleClick = (e) => {
    if (e.target.closest(".node-group") || e.target.closest(".timeline-card")) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setViewport((prev) => {
      const nextZoom = Math.min(prev.zoom * 1.35, 4.0);
      const ratio = nextZoom / prev.zoom;
      return {
        zoom: nextZoom,
        x: mouseX - (mouseX - prev.x) * ratio,
        y: mouseY - (mouseY - prev.y) * ratio,
      };
    });
  };

  // Recursive Downstream Descendants Finder
  const getDownstreamDescendants = useCallback((startId) => {
    const descendants = new Set();
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift();
      edges.forEach((e) => {
        if (e.data.source === curr && e.data.target !== rootNodeId && !descendants.has(e.data.target)) {
          descendants.add(e.data.target);
          queue.push(e.data.target);
        }
      });
    }
    return descendants;
  }, [edges, rootNodeId]);

  // Handle Progressive Node Click with Toggle Cutoff Behavior
  const handleNodeClick = (nodeData) => {
    const nodeId = nodeData.id;

    setExpandedNodeIds((prev) => {
      const next = new Set(prev);

      // If clicking root node
      if (nodeId === rootNodeId) {
        // If other branches are already open, collapse everything back to just root
        if (next.size > 1) {
          return new Set([rootNodeId]);
        } else {
          // If only root was expanded, keep root
          return next;
        }
      }

      // If non-root node is clicked
      if (next.has(nodeId)) {
        // Toggle Collapse: Cut off this node's branch and its descendants
        const descendants = getDownstreamDescendants(nodeId);
        next.delete(nodeId);
        descendants.forEach((d) => next.delete(d));
        return next;
      } else {
        // Expand: Unveil this node's branch
        next.add(nodeId);
        return next;
      }
    });

    if (onSelectNode) {
      onSelectNode(nodeData);
    }
  };

  const handleToggleExpandAll = () => {
    if (isExpandedAll) {
      setIsExpandedAll(false);
      if (rootNodeId) setExpandedNodeIds(new Set([rootNodeId]));
    } else {
      setIsExpandedAll(true);
      setExpandedNodeIds(new Set(nodes.map((n) => n.data.id)));
    }
  };

  const handleTimelineClick = (event, index) => {
    setSelectedTimelineIndex(index);
    const involved = event.entitiesInvolved || [];

    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      involved.forEach((id) => next.add(id));
      return next;
    });

    if (involved.length > 0) {
      const firstTarget = nodes.find((n) => n.data.id === involved[0] || n.data.label === involved[0]);
      if (firstTarget && onSelectNode) {
        onSelectNode(firstTarget.data);
      }
    }
  };

  const getNodeColor = (type) => {
    switch (type) {
      case "SUSPECT": return "#B8502E";
      case "BANK_ACCOUNT": return "#D97706";
      case "VEHICLE": case "WEAPON": return "#6B6751";
      case "PHONE_NUMBER": case "PHONE": case "IMEI": return "#28374A";
      case "LOCATION": return "#4E657D";
      case "FIR_CASE": case "CRIME_SECTION": return "#B8502E";
      case "ORGANIZATION": return "#28374A";
      default: return "#6B6751";
    }
  };

  const isPathEdge = (edge) => {
    if (!highlightedPath || highlightedPath.length < 2) return false;
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if ((edge.data.source === highlightedPath[i] && edge.data.target === highlightedPath[i + 1]) || (edge.data.source === highlightedPath[i + 1] && edge.data.target === highlightedPath[i])) return true;
    }
    return false;
  };

  if (nodes.length === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-[520px] sm:h-[640px] lg:h-[760px] bg-[#BEC6A5] rounded-2xl border border-[#A4AE8B] flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none space-y-4 shadow-xs">
        <div className="p-4 bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 text-[#28374A] shadow-lg">
          <Network className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse text-[#28374A]" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base sm:text-lg font-bold text-[#28374A] tracking-tight">Intelligence Canvas Standby</h3>
          <p className="text-xs sm:text-sm text-[#28374A]/90">Awaiting FIR records, audio intercepts, or Indian Kanoon citations to map associative criminal clusters.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button size="sm" onClick={onOpenIngestion} className="gap-2 text-xs shadow-md font-bold bg-[#B8502E] text-white hover:bg-[#9A3E20]">
            <PlusCircle className="w-4 h-4" />
            Ingest Evidence
          </Button>
          {onLoadSample && (
            <Button size="sm" variant="secondary" onClick={onLoadSample} disabled={isLoadingSample} className="gap-2 text-xs border border-[#28374A]/20 bg-white/80 text-[#28374A] hover:bg-white font-medium">
              {isLoadingSample ? <Loader2 className="w-4 h-4 animate-spin text-[#28374A]" /> : <Play className="w-4 h-4 text-[#28374A]" />}
              Load Sample Syndicate Demo
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-[520px] sm:h-[640px] lg:h-[760px] bg-[#BEC6A5] rounded-2xl border border-[#A4AE8B] overflow-hidden select-none shadow-xs flex flex-col justify-between">
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-[#D3C7AD] p-1 sm:p-1.5 rounded-full shadow-md text-[#28374A]">
        <Button size="icon" variant="ghost" onClick={handleZoomIn} title="Zoom In (+25%)" className="hover:bg-[#FAF7F2] text-[#28374A] h-7 w-7 sm:h-8 sm:w-8">
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28374A]" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleZoomOut} title="Zoom Out (-20%)" className="hover:bg-[#FAF7F2] text-[#28374A] h-7 w-7 sm:h-8 sm:w-8">
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28374A]" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleResetView} title="Reset View" className="hover:bg-[#FAF7F2] text-[#28374A] h-7 w-7 sm:h-8 sm:w-8">
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28374A]" />
        </Button>
        <div className="px-1.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-bold text-[#28374A] border-l border-[#D3C7AD]">
          {Math.round(viewport.zoom * 100)}%
        </div>
        <button type="button" onClick={handleToggleExpandAll} className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF7F2] border border-[#D3C7AD] hover:bg-[#F2ECE3] text-[#28374A] transition-all cursor-pointer" title={isExpandedAll ? "Collapse back to Root Convicted Kingpin" : "Expand all nodes at once"}>
          {isExpandedAll ? (
            <>
              <GitBranch className="w-3 h-3 text-[#B8502E]" />
              <span>Collapse</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-[#B8502E]" />
              <span>Expand All</span>
            </>
          )}
        </button>
      </div>

      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex flex-wrap max-w-[280px] sm:max-w-md lg:max-w-xl gap-1.5 sm:gap-2.5 bg-white/95 backdrop-blur-md border border-[#D3C7AD] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md text-[9px] sm:text-[10px] font-sans font-semibold text-[#28374A]">
        <div className="flex items-center gap-1.5"><span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#B8502E]"></span> Suspect / Kingpin</div>
        <div className="flex items-center gap-1.5"><span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#D97706]"></span> Hawala Account</div>
        <div className="flex items-center gap-1.5"><span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#6B6751]"></span> Vehicle / Asset</div>
        <div className="flex items-center gap-1.5"><span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#28374A]"></span> Telecom / Burner</div>
        <div className="flex items-center gap-1.5"><span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#4E657D]"></span> Court Precedent</div>
      </div>

      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          <marker id="arrow-navy" viewBox="0 0 10 10" refX="36" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#28374A" /></marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="38" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#B8502E" /></marker>
        </defs>
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          <rect x="-6000" y="-6000" width="16000" height="14000" fill="#bec6a5ff" />
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#8C947B" opacity="0.6" /></pattern>
          <rect x="-6000" y="-6000" width="16000" height="14000" fill="url(#grid)" />
          <circle cx="2000" cy="1500" r="440" fill="none" stroke="#A4AE8B" strokeWidth="1.2" strokeDasharray="5 7" opacity="0.7" />
          <circle cx="2000" cy="1500" r="880" fill="none" stroke="#A4AE8B" strokeWidth="1.2" strokeDasharray="6 8" opacity="0.6" />
          <circle cx="2000" cy="1500" r="1320" fill="none" stroke="#A4AE8B" strokeWidth="1.2" strokeDasharray="8 10" opacity="0.5" />
          <circle cx="2000" cy="1500" r="1750" fill="none" stroke="#A4AE8B" strokeWidth="1.2" strokeDasharray="8 12" opacity="0.4" />
          {visibleEdges.map((edge) => {
            const srcPos = layoutPositions.get(edge.data.source);
            const tgtPos = layoutPositions.get(edge.data.target);
            if (!srcPos || !tgtPos) return null;
            const isHigh = isPathEdge(edge);
            const isCrossCaseBridge = edge.data.relation === "INTER_STATE_HAWALA_LINK" || edge.data.relation === "COMMON_ACCUSED" || edge.data.confidence > 0.96;
            const midX = (srcPos.x + tgtPos.x) / 2;
            const midY = (srcPos.y + tgtPos.y) / 2;
            const label = edge.data.label || edge.data.relation || "CONNECTED_TO";
            const textWidth = Math.max(label.length * 7.2 + 24, 76);
            return (
              <g key={edge.data.id || `${edge.data.source}-${edge.data.target}`} className="animate-in fade-in duration-300">
                <line x1={srcPos.x} y1={srcPos.y} x2={tgtPos.x} y2={tgtPos.y} stroke={isHigh ? "#B8502E" : isCrossCaseBridge ? "#28374A" : "#28374A"} strokeWidth={isHigh ? 4 : isCrossCaseBridge ? 2.8 : 2.2} strokeDasharray={isHigh ? "6" : isCrossCaseBridge ? "4 4" : undefined} markerEnd={isHigh ? "url(#arrow-active)" : "url(#arrow-navy)"} className="transition-all duration-300" />
                <rect x={midX - textWidth / 2} y={midY - 12} width={textWidth} height="24" rx="6" fill="#FFFFFF" stroke={isHigh ? "#B8502E" : "#D3C7AD"} strokeWidth={isHigh ? "1.8" : "1"} className="shadow-sm pointer-events-none" />
                <text x={midX} y={midY + 4} fill={isHigh ? "#B8502E" : "#28374A"} fontSize="10.5" fontWeight="700" textAnchor="middle" className="font-sans pointer-events-none select-none tracking-tight">{label}</text>
              </g>
            );
          })}
          {visibleNodes.map((node) => {
            const pos = layoutPositions.get(node.data.id);
            if (!pos) return null;
            const isRoot = node.data.id === rootNodeId;
            const isSelected = selectedNodeId === node.data.id;
            const isPathNode = highlightedPath && highlightedPath.includes(node.data.id);
            const color = getNodeColor(node.data.type);
            const radius = isRoot ? 38 : node.data.type === "SUSPECT" ? 32 : node.data.type === "BANK_ACCOUNT" ? 28 : 24;
            const labelText = node.data.label || node.data.id;
            const pillWidth = Math.max(labelText.length * 8.2 + 30, 96);
            const unrevealedCount = unrevealedChildCounts.get(node.data.id) || 0;
            return (
              <g key={node.data.id} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => handleNodeClick(node.data)} className="cursor-pointer group node-group animate-in zoom-in-75 duration-300">
                {(isSelected || isPathNode || isRoot) && <circle r={radius + 22} fill={isRoot ? "rgba(184, 80, 46, 0.3)" : isPathNode ? "rgba(184, 80, 46, 0.4)" : "rgba(40, 55, 74, 0.25)"} className="animate-pulse" />}
                <circle r={radius} fill="#FFFFFF" stroke={color} strokeWidth={isRoot ? 6 : isSelected || isPathNode ? 5.5 : 4} className="transition-transform duration-200 group-hover:scale-115 shadow-md" />
                <circle r={radius - 9} fill={color} opacity="0.85" />
                {unrevealedCount > 0 && !isExpandedAll && (
                  <g transform={`translate(${radius - 4}, ${-radius + 4})`}>
                    <circle r="11" fill="#B8502E" stroke="#FFFFFF" strokeWidth="2" className="animate-bounce" />
                    <text textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800" y="3.5" className="font-sans pointer-events-none select-none">+{unrevealedCount}</text>
                  </g>
                )}
                <g transform={`translate(0, ${radius + 26})`}>
                  <rect x={-(pillWidth / 2)} y="-15" width={pillWidth} height="30" rx="9" fill="#FFFFFF" stroke={isSelected || isRoot ? "#B8502E" : "#D3C7AD"} strokeWidth={isSelected || isRoot ? "2.5" : "1.2"} className="shadow-md" />
                  <text textAnchor="middle" fill={isSelected || isRoot ? "#B8502E" : "#28374A"} fontSize="13" fontWeight={isSelected || isRoot ? "800" : "700"} className="pointer-events-none select-none font-sans" y="4.5">{labelText}</text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
      {timelineEvents.length > 0 && (
        <div className="z-10 bg-white/95 backdrop-blur-md border-t border-[#D3C7AD] p-2.5 sm:p-3 shadow-lg">
          <div className="flex items-center justify-between pb-1.5 px-1 text-[#28374A]">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-[#B8502E]" />
              <span>Investigation Chronology & Evidence Timeline</span>
            </div>
            <span className="text-[10px] text-[#6B6751] hidden sm:inline font-mono">Click timestamp to branch & spotlight related entities</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {timelineEvents.map((evt, idx) => {
              const isSelected = selectedTimelineIndex === idx;
              return (
                <div key={idx} onClick={() => handleTimelineClick(evt, idx)} className={`timeline-card shrink-0 flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer text-xs select-none max-w-[240px] sm:max-w-[280px] shadow-2xs ${isSelected ? "bg-[#FDF4EE] border-[#B8502E] shadow-sm" : "bg-[#FAF7F2] border-[#D3C7AD] hover:border-[#B8502E] hover:bg-white"}`} title={`${evt.title}: ${evt.description}`}>
                  <div className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#28374A] text-white shrink-0">{evt.time || `T-${idx + 1}`}</div>
                  <div className="overflow-hidden space-y-0.5">
                    <p className={`font-bold text-[11px] truncate ${isSelected ? "text-[#B8502E]" : "text-[#28374A]"}`}>{evt.title}</p>
                    <p className="text-[10px] text-[#6B6751] truncate">{evt.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
