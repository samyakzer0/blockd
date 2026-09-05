/**
 * BlockD Criminal Knowledge Graph Engine
 * Builds and maintains in-memory property graphs of criminal entities,
 * resolved master person profiles, phone interactions, and financial flows.
 * Executes centrality metrics (PageRank, Betweenness) with strict node/edge deduplication.
 */

const { GraphAlgorithms } = require("./graphAlgorithms");

class KnowledgeGraphEngine {
  constructor() {
    this.nodes = new Map();       // canonicalId -> Node { id, label, type, properties }
    this.edges = [];              // Array of Edge { id, source, target, relation, confidence, evidence }
    this.adjacency = new Map();   // canonicalId -> Set<canonicalId>
    this.labelIndex = new Map();  // lowerCaseCleanLabel -> canonicalId
  }

  _cleanLabel(str) {
    if (!str) return "";
    return String(str).trim().toLowerCase().replace(/^precedent:\s*/i, "").replace(/[^a-z0-9]/g, "");
  }

  /**
   * Adds an entity node with strict canonical deduplication.
   */
  addNode(node) {
    if (!node || (!node.id && !node.label)) return null;

    const rawLabel = String(node.label || node.id).trim();
    const cleanKey = this._cleanLabel(rawLabel);

    // If a node with identical or highly similar clean label already exists, update and return it
    if (this.labelIndex.has(cleanKey)) {
      const existingId = this.labelIndex.get(cleanKey);
      const existingNode = this.nodes.get(existingId);
      if (existingNode) {
        if (node.type && node.type !== "UNKNOWN" && existingNode.type === "UNKNOWN") {
          existingNode.type = node.type;
        }
        if (node.properties) {
          existingNode.properties = { ...existingNode.properties, ...node.properties };
        }
        return existingNode;
      }
    }

    const canonicalId = String(node.id || node.label).trim();
    const newNode = {
      id: canonicalId,
      label: rawLabel,
      type: node.type || "SUSPECT",
      properties: node.properties || {}
    };

    this.nodes.set(canonicalId, newNode);
    this.labelIndex.set(cleanKey, canonicalId);
    if (!this.adjacency.has(canonicalId)) {
      this.adjacency.set(canonicalId, new Set());
    }

    return newNode;
  }

  /**
   * Adds a directed relational edge with strict deduplication.
   */
  addEdge(edge) {
    if (!edge || !edge.source || !edge.target) return null;

    // Resolve canonical node IDs
    const sourceNode = this.addNode({ id: edge.source, label: edge.source, type: edge.sourceType || "SUSPECT" });
    const targetNode = this.addNode({ id: edge.target, label: edge.target, type: edge.targetType || "ORGANIZATION" });

    if (!sourceNode || !targetNode) return null;
    const sourceId = sourceNode.id;
    const targetId = targetNode.id;

    if (sourceId === targetId) return null; // Avoid self-loops

    const relation = String(edge.relation || edge.label || "ASSOCIATED_WITH").trim();

    // Check if duplicate edge already exists between source and target
    const existing = this.edges.find(e => 
      (e.source === sourceId && e.target === targetId && e.relation === relation) ||
      (e.source === targetId && e.target === sourceId && e.relation === relation)
    );

    if (existing) {
      if (edge.confidence && edge.confidence > existing.confidence) {
        existing.confidence = edge.confidence;
      }
      return existing;
    }

    const edgeId = edge.id || `EDGE_${this.edges.length + 1}`;
    const newEdge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      relation,
      label: edge.label || relation,
      confidence: edge.confidence || 0.92,
      evidence: edge.evidence || ""
    };

    this.edges.push(newEdge);

    // Populate adjacency
    if (!this.adjacency.has(sourceId)) this.adjacency.set(sourceId, new Set());
    if (!this.adjacency.has(targetId)) this.adjacency.set(targetId, new Set());
    this.adjacency.get(sourceId).add(targetId);
    this.adjacency.get(targetId).add(sourceId);

    return newEdge;
  }

  /**
   * Ingests an extracted graph bundle from Module 3's CriminalAiPipeline.
   */
  ingestPipelineGraph(pipelineGraph) {
    if (pipelineGraph && Array.isArray(pipelineGraph.nodes)) {
      pipelineGraph.nodes.forEach(n => this.addNode(n));
    }
    if (pipelineGraph && Array.isArray(pipelineGraph.edges)) {
      pipelineGraph.edges.forEach(e => this.addEdge(e));
    }
  }

  /**
   * Runs the complete analytical suite:
   * PageRank (Kingpin), Betweenness Centrality (Broker), and Community Detection.
   */
  runNetworkAnalytics() {
    const pageRankScores = GraphAlgorithms.pageRank(this.adjacency);
    const betweennessScores = GraphAlgorithms.betweennessCentrality(this.adjacency);
    const communities = GraphAlgorithms.communityDetection(this.adjacency);

    for (const [id, node] of this.nodes.entries()) {
      node.metrics = {
        degree: (this.adjacency.get(id) || new Set()).size,
        pageRank: pageRankScores.get(id) || 0,
        betweenness: betweennessScores.get(id) || 0,
        communityId: communities.get(id) || 1
      };
    }

    const sortedByPageRank = Array.from(this.nodes.values())
      .sort((a, b) => (b.metrics?.pageRank || 0) - (a.metrics?.pageRank || 0));

    const sortedByBetweenness = Array.from(this.nodes.values())
      .sort((a, b) => (b.metrics?.betweenness || 0) - (a.metrics?.betweenness || 0));

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      topKingpins: sortedByPageRank.slice(0, 5).map(n => ({ id: n.id, label: n.label, type: n.type, pageRank: n.metrics.pageRank })),
      topBrokers: sortedByBetweenness.slice(0, 5).map(n => ({ id: n.id, label: n.label, type: n.type, betweenness: n.metrics.betweenness })),
      communityClusters: this._groupCommunities(communities)
    };
  }

  findConnection(source, target) {
    return GraphAlgorithms.findShortestPath(this.adjacency, source, target);
  }

  _groupCommunities(communitiesMap) {
    const groups = {};
    for (const [nodeId, commId] of communitiesMap.entries()) {
      if (!groups[commId]) groups[commId] = [];
      groups[commId].push(nodeId);
    }
    return groups;
  }

  /**
   * Exports full graph ready for canvas rendering.
   */
  exportVisualizerGraph() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          ...n.metrics
        }
      })),
      edges: this.edges.map(e => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || e.relation,
          confidence: e.confidence,
          evidence: e.evidence
        }
      }))
    };
  }
}

module.exports = { KnowledgeGraphEngine };
