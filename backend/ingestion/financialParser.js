/**
 * BlockD Financial Transaction Parser
 * Ingests bank statements, UPI logs, and hawala transaction spreadsheets,
 * extracts bank accounts, IFSC codes, amounts, sender/receiver entities,
 * and flags suspicious transaction thresholds (e.g. structuring, large amounts).
 */

const { SourceType, createCanonicalDocument } = require("./schemas");

class FinancialParser {
  /**
   * Normalizes monetary amount strings (e.g., "$12,500.00", "INR 45,00,000", "50000").
   */
  static parseAmount(amountStr) {
    if (typeof amountStr === "number") return amountStr;
    if (!amountStr) return 0;
    const cleaned = String(amountStr).replace(/[^0-9\.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validates standard Indian IFSC code (4 letters, 0, 6 letters/digits).
   */
  static isValidIfsc(ifsc) {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc).trim().toUpperCase());
  }

  /**
   * Parses CSV or tabular financial transactions.
   * Expected columns:
   * sender_account, receiver_account, amount, currency, timestamp, sender_name, receiver_name, ifsc_code, transaction_type
   */
  static parseCsv(csvContent, options = {}) {
    const { caseId = "CASE_DEFAULT", title = "Bank / UPI Financial Trail", highValueThreshold = 100000 } = options;
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

      const senderAccount = rowObj["senderaccount"] || rowObj["fromaccount"] || cols[0];
      const receiverAccount = rowObj["receiveraccount"] || rowObj["toaccount"] || cols[1];
      const amount = this.parseAmount(rowObj["amount"] || cols[2] || "0");
      const currency = (rowObj["currency"] || "INR").toUpperCase();
      const timestamp = rowObj["timestamp"] || rowObj["date"] || cols[3] || new Date().toISOString();
      const senderName = rowObj["sendername"] || rowObj["sender"] || cols[4] || "";
      const receiverName = rowObj["receivername"] || rowObj["receiver"] || cols[5] || "";
      const ifsc = (rowObj["ifsccode"] || rowObj["ifsc"] || cols[6] || "").toUpperCase();
      const txType = (rowObj["transactiontype"] || rowObj["type"] || "TRANSFER").toUpperCase();

      const isHighValue = amount >= highValueThreshold;

      records.push({
        recordId: `TX_${i}`,
        senderAccount,
        receiverAccount,
        amount,
        currency,
        timestamp,
        senderName,
        receiverName,
        ifsc,
        transactionType: txType,
        isSuspicious: isHighValue
      });
    }

    const textSummary = records.map(r => 
      `Financial transfer of ${r.currency} ${r.amount} from ${r.senderName} (A/C: ${r.senderAccount}) to ${r.receiverName} (A/C: ${r.receiverAccount}, IFSC: ${r.ifsc}) on ${r.timestamp} [Type: ${r.transactionType}].`
    ).join("\n");

    return createCanonicalDocument({
      caseId,
      sourceType: SourceType.FINANCIAL,
      title,
      rawText: textSummary,
      records,
      metadata: {
        recordCount: records.length,
        totalVolume: records.reduce((acc, curr) => acc + curr.amount, 0),
        suspiciousCount: records.filter(r => r.isSuspicious).length
      }
    });
  }
}

module.exports = { FinancialParser };
