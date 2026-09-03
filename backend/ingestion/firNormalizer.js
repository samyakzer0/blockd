/**
 * BlockD OCR & Police FIR Normalizer
 * Ingests unstructured scanned police FIR narratives, interrogation transcripts,
 * and case reports. Normalizes formatting, cleans police jargon/typos,
 * and prepares structured text payloads for downstream NLP extraction.
 */

const { SourceType, createCanonicalDocument } = require("./schemas");

class FirNormalizer {
  /**
   * Cleans OCR noise, removes redundant spacing, normalizes punctuation,
   * and highlights common Indian police report header fields (IPC sections, Complainant, Accused).
   */
  static cleanText(rawText) {
    if (!rawText) return "";
    return rawText
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Extracts top-level key metadata fields commonly found in FIR templates.
   */
  static extractKeyFields(text) {
    const fields = {};

    // Match FIR number: e.g. FIR No. 402/2025 or FIR #781
    const firMatch = text.match(/FIR\s*(?:No\.?|#)\s*([A-Za-z0-9\/\-_]+)/i);
    if (firMatch) fields.firNumber = firMatch[1];

    // Match Police Station: e.g. P.S. Connaught Place or Police Station: Special Cell
    const psMatch = text.match(/(?:Police\s*Station|P\.S\.)\s*[:\-]?\s*([A-Za-z0-9\s]+?)(?:,|\n|$)/i);
    if (psMatch) fields.policeStation = psMatch[1].trim();

    // Match IPC or Legal Acts / Sections: e.g. U/S 379, 411 IPC or Section 302/34
    const sectionMatch = text.match(/(?:U\/S|Section|Sec\.?)\s*([0-9\s,\/\+]+(?:IPC|NDPS|Arms\s*Act)?)/i);
    if (sectionMatch) fields.sections = sectionMatch[1].trim();

    // Match Date / Timestamp of Occurrence or Filing
    const dateMatch = text.match(/(?:Date|Dated|Incident\s*Date)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    if (dateMatch) fields.filingDate = dateMatch[1];

    return fields;
  }

  /**
   * Processes a raw FIR / Police narrative into a Canonical Document.
   */
  static process(rawText, options = {}) {
    const { caseId = "CASE_DEFAULT", title = "First Information Report (FIR)" } = options;
    const cleaned = this.cleanText(rawText);
    const extractedFields = this.extractKeyFields(cleaned);

    return createCanonicalDocument({
      caseId,
      sourceType: SourceType.FIR,
      title,
      rawText: cleaned,
      records: [
        {
          recordId: extractedFields.firNumber ? `FIR_${extractedFields.firNumber}` : "FIR_MAIN",
          ...extractedFields
        }
      ],
      metadata: {
        charCount: cleaned.length,
        wordCount: cleaned.split(/\s+/).filter(Boolean).length,
        ...extractedFields
      }
    });
  }
}

module.exports = { FirNormalizer };
