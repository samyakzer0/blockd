/**
 * BlockD Multi-Source Ingestion Engine
 * Acts as the unified gateway across all data types:
 * routes FIR narratives, telecom CDR dumps, and banking CSV sheets,
 * normalizes them into Canonical Documents, and cryptographically signs & packages them.
 */

const { SourceType } = require("./schemas");
const { CdrParser } = require("./cdrParser");
const { FinancialParser } = require("./financialParser");
const { FirNormalizer } = require("./firNormalizer");

class IngestionEngine {
  /**
   * Ingests a raw data payload according to its declared or auto-detected source type.
   * @param {Object} input
   * @param {string} input.caseId
   * @param {string} input.sourceType - "FIR", "CDR", "FINANCIAL"
   * @param {string} input.title
   * @param {string|Buffer} input.content
   * @param {Object} [input.options]
   * @returns {Object} Canonical Document
   */
  static ingest({ caseId, sourceType, title, content, options = {} }) {
    if (!caseId) throw new Error("IngestionEngine: caseId is required");
    if (!content) throw new Error("IngestionEngine: content cannot be empty");

    const textContent = Buffer.isBuffer(content) ? content.toString("utf-8") : String(content);

    // Auto-detect sourceType if not specified
    let detectedType = (sourceType || "").toUpperCase();
    if (!detectedType) {
      if (/calling.*number|caller|called.*number|imei/i.test(textContent)) {
        detectedType = SourceType.CDR;
      } else if (/account|ifsc|amount|currency|transfer/i.test(textContent)) {
        detectedType = SourceType.FINANCIAL;
      } else {
        detectedType = SourceType.FIR;
      }
    }

    switch (detectedType) {
      case SourceType.CDR:
        return CdrParser.parseCsv(textContent, { caseId, title, ...options });

      case SourceType.FINANCIAL:
        return FinancialParser.parseCsv(textContent, { caseId, title, ...options });

      case SourceType.FIR:
      case SourceType.INTERROGATION:
      default:
        return FirNormalizer.process(textContent, { caseId, title, ...options });
    }
  }
}

module.exports = { IngestionEngine, SourceType };
