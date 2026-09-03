/**
 * BlockD Canonical Data Schemas (JavaScript / Node.js)
 * Defines the standard data structure for normalized evidence across all sources
 * (FIR narratives, CDR telecom records, Financial transactions).
 */

const SourceType = {
  FIR: "FIR",
  CDR: "CDR",
  FINANCIAL: "FINANCIAL",
  INTERROGATION: "INTERROGATION"
};

/**
 * Creates a Canonical Document object ready for downstream AI/NER processing.
 */
function createCanonicalDocument({
  caseId,
  sourceType,
  documentId,
  title,
  rawText,
  records = [],
  metadata = {}
}) {
  return {
    caseId,
    sourceType,
    documentId: documentId || `DOC_${Date.now()}`,
    title,
    rawText: rawText || "",
    records,
    metadata: {
      ingestedAt: new Date().toISOString(),
      ...metadata
    }
  };
}

module.exports = {
  SourceType,
  createCanonicalDocument
};
