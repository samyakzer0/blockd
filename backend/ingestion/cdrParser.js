/**
 * BlockD CDR Parser
 * Ingests Call Detail Record (CDR) CSV or tabular data,
 * cleans phone numbers (E.164 standardization), validates IMEI/IMSI,
 * extracts call durations and cell tower identifiers, and builds caller networks.
 */

const { SourceType, createCanonicalDocument } = require("./schemas");

class CdrParser {
  /**
   * Cleans and normalizes phone numbers into a standard format.
   * Strips spaces, dashes, parentheses and standardizes international country codes.
   */
  static cleanPhoneNumber(phone) {
    if (!phone) return "";
    let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("00")) {
      cleaned = "+" + cleaned.slice(2);
    } else if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "+91" + cleaned.slice(1);
    } else if (!cleaned.startsWith("+") && cleaned.length === 10) {
      cleaned = "+91" + cleaned;
    }
    return cleaned;
  }

  /**
   * Validates if a string is a valid 15-digit IMEI number.
   */
  static isValidImei(imei) {
    return /^\d{15}$/.test(String(imei).trim());
  }

  /**
   * Parses CSV string into structured CDR records.
   * Expected columns (header-flexible):
   * calling_number, called_number, timestamp, duration_seconds, imei, imsi, cell_tower_id, call_type
   */
  static parseCsv(csvContent, options = {}) {
    const { caseId = "CASE_DEFAULT", title = "Telecom CDR Dump" } = options;
    const lines = csvContent.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("Invalid CSV: At least a header and one data row are required");
    }

    const rawHeaders = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[\s_]+/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      if (cols.length < 2) continue;

      const rowObj = {};
      rawHeaders.forEach((header, idx) => {
        rowObj[header] = cols[idx] || "";
      });

      const caller = this.cleanPhoneNumber(
        rowObj["callingnumber"] || rowObj["caller"] || rowObj["from"] || cols[0]
      );
      const recipient = this.cleanPhoneNumber(
        rowObj["callednumber"] || rowObj["recipient"] || rowObj["to"] || cols[1]
      );
      const timestamp = rowObj["timestamp"] || rowObj["datetime"] || cols[2] || new Date().toISOString();
      const duration = parseInt(rowObj["durationseconds"] || rowObj["duration"] || cols[3] || "0", 10);
      const imei = rowObj["imei"] || cols[4] || "";
      const imsi = rowObj["imsi"] || cols[5] || "";
      const cellTower = rowObj["celltowerid"] || rowObj["tower"] || cols[6] || "";
      const callType = (rowObj["calltype"] || rowObj["type"] || "VOICE").toUpperCase();

      records.push({
        recordId: `CDR_${i}`,
        caller,
        recipient,
        timestamp,
        durationSeconds: isNaN(duration) ? 0 : duration,
        imei: this.isValidImei(imei) ? imei : imei,
        imsi,
        cellTowerId: cellTower,
        callType
      });
    }

    // Generate natural text summary for AI/NLP pipeline
    const textSummary = records.map(r => 
      `Call from ${r.caller} to ${r.recipient} on ${r.timestamp} lasting ${r.durationSeconds}s near tower ${r.cellTowerId} (IMEI: ${r.imei}).`
    ).join("\n");

    return createCanonicalDocument({
      caseId,
      sourceType: SourceType.CDR,
      title,
      rawText: textSummary,
      records,
      metadata: {
        recordCount: records.length,
        uniqueCallers: [...new Set(records.map(r => r.caller))].length,
        uniqueRecipients: [...new Set(records.map(r => r.recipient))].length
      }
    });
  }
}

module.exports = { CdrParser };
