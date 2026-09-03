/**
 * BlockD Criminal Network Analytics Algorithms
 * Implements core graph analytics:
 * 1. Degree Centrality (Most directly connected nodes)
 * 2. PageRank (Kingpin / Influencer detection through hierarchical proxy chains)
 * 3. Betweenness Centrality (Middlemen, Couriers, and Hawala Brokers bridging disconnected criminal cells)
 * 4. Community Detection (Sub-gang / Cartel cell clustering via modularity label propagation)
 * 5. Shortest Path Discovery (Uncovering indirect connections between two unacquainted suspects)
 */

class GraphAlgorithms {
  /**
   * Computes PageRank for all nodes in the network.
   * Higher score indicates a high-influence leader/kingpin who receives indirect flows through subordinates.
   * @param {Map<string, Set<string>>} adjacency - node -> Set of neighbor nodes
   * @param {number} [damping=0.85]
   * @param {number} [iterations=20]
   * @returns {Map<string, number>} node -> PageRank score (normalized)
   */
  static pageRank(adjacency, damping = 0.85, iterations = 20) {
    const nodes = Array.from(adjacency.keys());
    const N = nodes.length;
    if (N === 0) return new Map();

    let scores = new Map();
    const initialScore = 1 / N;
    nodes.forEach(n => scores.set(n, initialScore));

    for (let it = 0; it < iterations; it++) {
      const nextScores = new Map();
      nodes.forEach(n => nextScores.set(n, (1 - damping) / N));

      for (const node of nodes) {
        const neighbors = Array.from(adjacency.get(node) || []);
        if (neighbors.length === 0) continue;
        const outboundShare = (damping * scores.get(node)) / neighbors.length;
        for (const neighbor of neighbors) {
          nextScores.set(neighbor, (nextScores.get(neighbor) || 0) + outboundShare);
        }
      }
      scores = nextScores;
    }

    // Round to 4 decimal places
    const rounded = new Map();
    for (const [k, v] of scores.entries()) {
      rounded.set(k, parseFloat(v.toFixed(4)));
    }
    return rounded;
  }

  /**
   * Computes Betweenness Centrality using Brandes' algorithm.
   * Identifies "Bridge" nodes (e.g. brokers, couriers, or middleman phones) that lie on the shortest
   * communication paths between otherwise disconnected criminal cliques.
   * @param {Map<string, Set<string>>} adjacency
   * @returns {Map<string, number>} node -> Betweenness score
   */
  static betweennessCentrality(adjacency) {
    const nodes = Array.from(adjacency.keys());
    const CB = new Map();
    nodes.forEach(v => CB.set(v, 0));

    for (const s of nodes) {
      const S = [];
      const P = new Map();
      nodes.forEach(w => P.set(w, []));

      const sigma = new Map();
      nodes.forEach(t => sigma.set(t, 0));
      sigma.set(s, 1);

      const d = new Map();
      nodes.forEach(t => d.set(t, -1));
      d.set(s, 0);

      const Q = [s];
      while (Q.length > 0) {
        const v = Q.shift();
        S.push(v);
        const neighbors = Array.from(adjacency.get(v) || []);

        for (const w of neighbors) {
          if (d.get(w) < 0) {
            d.set(w, d.get(v) + 1);
            Q.push(w);
          }
          if (d.get(w) === d.get(v) + 1) {
            sigma.set(w, sigma.get(w) + sigma.get(v));
            P.get(w).push(v);
          }
        }
      }

      const delta = new Map();
      nodes.forEach(v => delta.set(v, 0));

      while (S.length > 0) {
        const w = S.pop();
        for (const v of P.get(w)) {
          const c = (sigma.get(v) / (sigma.get(w) || 1)) * (1 + delta.get(w));
          delta.set(v, delta.get(v) + c);
        }
        if (w !== s) {
          CB.set(w, CB.get(w) + delta.get(w));
        }
      }
    }

    // Undirected normalization (divide by 2)
    const normalized = new Map();
    for (const [k, v] of CB.entries()) {
      normalized.set(k, parseFloat((v / 2).toFixed(4)));
    }
    return normalized;
  }

  /**
   * Community Detection using Label Propagation.
   * Automatically groups suspects into distinct criminal gangs/sub-cells.
   * @param {Map<string, Set<string>>} adjacency
   * @param {number} [maxIterations=15]
   * @returns {Map<string, number>} node -> communityId
   */
  static communityDetection(adjacency, maxIterations = 15) {
    const nodes = Array.from(adjacency.keys());
    const labels = new Map();
    nodes.forEach((n, idx) => labels.set(n, idx + 1));

    for (let it = 0; it < maxIterations; it++) {
      let changed = false;
      for (const node of nodes) {
        const neighbors = Array.from(adjacency.get(node) || []);
        if (neighbors.length === 0) continue;

        const freq = new Map();
        for (const nb of neighbors) {
          const l = labels.get(nb);
          freq.set(l, (freq.get(l) || 0) + 1);
        }

        let maxCount = -1;
        let dominantLabel = labels.get(node);
        for (const [l, count] of freq.entries()) {
          if (count > maxCount) {
            maxCount = count;
            dominantLabel = l;
          }
        }

        if (dominantLabel !== labels.get(node)) {
          labels.set(node, dominantLabel);
          changed = true;
        }
      }
      if (!changed) break;
    }

    return labels;
  }

  /**
   * Discovers the shortest communication / transaction path between two suspects using BFS.
   * @param {Map<string, Set<string>>} adjacency
   * @param {string} startNode
   * @param {string} endNode
   * @returns {Array<string>|null} Shortest path array or null if disconnected
   */
  static findShortestPath(adjacency, startNode, endNode) {
    if (!adjacency.has(startNode) || !adjacency.has(endNode)) return null;
    if (startNode === endNode) return [startNode];

    const queue = [[startNode]];
    const visited = new Set([startNode]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      const neighbors = Array.from(adjacency.get(current) || []);
      for (const nb of neighbors) {
        if (nb === endNode) {
          return [...path, nb];
        }
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push([...path, nb]);
        }
      }
    }

    return null;
  }
}

module.exports = { GraphAlgorithms };
