/**
 * BlockD Criminal AI Pipeline
 * Orchestrates entity recognition and relation extraction over canonical case documents.
 * Produces structured Network Graphs (Nodes & Edges) ready for Module 4 (Entity Resolution)
 * and Module 5 (Graph Analytics / Neo4j).
 */

const { NerEngine } = require("./nerEngine");
const { RelationExtractor } = require("./relationExtractor");

class CriminalAiPipeline {
  /**
   * Processes a canonical case document through the complete AI/NER/RE extraction pipeline.
   * @param {Object} canonicalDoc
   * @returns {Object} { caseId, documentId, entities, relations, graphSummary }
   */
  static processDocument(canonicalDoc) {
    if (!canonicalDoc) throw new Error("CriminalAiPipeline: canonicalDoc is required");

    // 1. Named Entity Recognition
    const entities = NerEngine.extractEntities(canonicalDoc.rawText);

    // 2. Relation Extraction
    const relations = RelationExtractor.extractRelations(entities, canonicalDoc);

    // 3. Assemble Graph Nodes & Directed Edges
    const nodes = entities.map(e => ({
      id: e.id,
      label: e.value,
      type: e.type,
      confidence: e.confidence
    }));

    const edges = relations.map((r, idx) => ({
      id: `EDGE_${idx + 1}`,
      source: r.sourceValue,
      target: r.targetValue,
      relation: r.relation,
      confidence: r.confidence,
      evidence: r.evidence
    }));

    return {
      caseId: canonicalDoc.caseId,
      documentId: canonicalDoc.documentId,
      sourceType: canonicalDoc.sourceType,
      title: canonicalDoc.title,
      entities,
      relations,
      graph: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodes,
        edges
      },
      processedAt: new Date().toISOString()
    };
  }
}

module.exports = { CriminalAiPipeline };
