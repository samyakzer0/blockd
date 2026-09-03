/**
 * BlockD Criminal Knowledge Graph Engine
 * Builds and maintains in-memory and Neo4j-compatible property graphs of criminal entities,
 * resolved master person profiles, phone interactions, and financial flows.
 * Executes centrality metrics, community segmentation, and link predictions.
 */

const { GraphAlgorithms } = require("./graphAlgorithms");

class KnowledgeGraphEngine {
  constructor() {
    this.nodes = new Map(); // id -> Node { id, label, type, properties }
    this.edges = [];        // Array of Edge { id, source, target, relation, confidence, evidence }
    this.adjacency = new Map(); // id -> Set<id>
  }

  /**
   * Adds an entity node to the knowledge graph.
   */
  addNode(node) {
    const id = String(node.id || node.label);
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        label: node.label || id,
        type: node.type || "UNKNOWN",
        properties: node.properties || {}
      });
      this.adjacency.set(id, new Set());
    }
    return this.nodes.get(id);
  }

  /**
   * Adds a directed relational edge to the knowledge graph.
   */
  addEdge(edge) {
    const sourceId = String(edge.source);
    const targetId = String(edge.target);

    // Ensure both nodes exist
    this.addNode({ id: sourceId, label: sourceId, type: edge.sourceType || "ENTITY" });
    this.addNode({ id: targetId, label: targetId, type: edge.targetType || "ENTITY" });

    const edgeId = edge.id || `EDGE_${this.edges.length + 1}`;
    const newEdge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      relation: edge.relation || "RELATED_TO",
      confidence: edge.confidence || 0.9,
      evidence: edge.evidence || ""
    };

    this.edges.push(newEdge);

    // Populate adjacency (undirected for connectivity and centrality)
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
   * PageRank (Kingpin), Betweenness Centrality (Broker), and Community Detection (Sub-gang).
   */
  runNetworkAnalytics() {
    const pageRankScores = GraphAlgorithms.pageRank(this.adjacency);
    const betweennessScores = GraphAlgorithms.betweennessCentrality(this.adjacency);
    const communities = GraphAlgorithms.communityDetection(this.adjacency);

    // Annotate nodes with metrics
    for (const [id, node] of this.nodes.entries()) {
      node.metrics = {
        degree: (this.adjacency.get(id) || new Set()).size,
        pageRank: pageRankScores.get(id) || 0,
        betweenness: betweennessScores.get(id) || 0,
        communityId: communities.get(id) || 1
      };
    }

    // Rank top influencers and brokers
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

  /**
   * Finds the shortest path connecting any two suspect entities.
   */
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
   * Exports full graph ready for Cytoscape.js / React 2D/3D Force Graph visualizers.
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
          label: e.relation,
          confidence: e.confidence,
          evidence: e.evidence
        }
      }))
    };
  }
}

module.exports = { KnowledgeGraphEngine };
