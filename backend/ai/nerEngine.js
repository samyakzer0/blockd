/**
 * BlockD Criminal Named Entity Recognition (NER) Engine
 * Comprehensive Multi-Domain Extractor for Indian Judicial Judgments & Police FIRs
 */

const { EntityType } = require("./entityTypes");

class NerEngine {
  static isInvalidName(name) {
    if (!name || name.length < 3 || name.length > 40) return true;
    const lower = name.toLowerCase().trim();

    const stopWords = new Set([
      "the", "and", "with", "from", "for", "in", "of", "to", "on", "at", "by", "an", "a",
      "he", "she", "they", "them", "his", "her", "their", "him", "who", "whom", "whose",
      "police", "station", "supreme", "court", "high", "learned", "counsel", "advocate",
      "state", "union", "india", "section", "sections", "indian", "penal", "code", "bns",
      "judgment", "order", "appeal", "petitioner", "appellant", "respondent", "applicant",
      "submitted", "having", "concerned", "released", "bail", "under", "perusal", "matter",
      "bench", "justice", "author", "skip", "content", "navigation", "search", "engine",
      "person", "persons", "individual", "accused", "suspect", "criminal", "case", "cases",
      "was", "were", "is", "are", "been", "being", "detained", "arrested", "interrogated",
      "crime branch", "special cell", "delhi police", "mumbai police", "coram", "dated", "oral",
      "page", "downloaded", "neutral", "citation"
    ]);

    const words = lower.split(/\s+/);
    if (words.every(w => stopWords.has(w))) return true;
    if (stopWords.has(words[0]) && words.length <= 2) return true;
    if (words.some(w => ["court", "branch", "police", "state", "station"].includes(w))) return true;

    return false;
  }

  static extractEntities(text) {
    if (!text || typeof text !== "string") return [];

    const entities = [];
    const seen = new Set();

    function addEntity(type, value, confidence, span = null) {
      const cleanVal = String(value).trim();
      if (!cleanVal) return;

      if (type === EntityType.SUSPECT && NerEngine.isInvalidName(cleanVal)) {
        return;
      }

      const key = `${type}::${cleanVal.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        entities.push({
          id: `ENT_${entities.length + 1}`,
          type,
          value: cleanVal,
          confidence: parseFloat(confidence.toFixed(2)),
          span
        });
      }
    }

    // 1. Phone Numbers (+91 or 10 digits)
    const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}/g;
    let match;
    while ((match = phoneRegex.exec(text)) !== null) {
      let cleanedPhone = match[0].replace(/[\s\-]/g, "");
      if (!cleanedPhone.startsWith("+91")) cleanedPhone = "+91" + cleanedPhone;
      addEntity(EntityType.PHONE, cleanedPhone, 0.98, [match.index, match.index + match[0].length]);
    }

    // 2. 15-Digit Cellular IMEIs
    const imeiRegex = /\b\d{15}\b/g;
    while ((match = imeiRegex.exec(text)) !== null) {
      addEntity(EntityType.IMEI, match[0], 0.99, [match.index, match.index + match[0].length]);
    }

    // 3. Indian Vehicle License Plates (e.g. DL-01-AB-1234, GJ-05-CD-9988, MH-02-CD-9988)
    const vehicleRegex = /\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b/g;
    while ((match = vehicleRegex.exec(text)) !== null) {
      const standardPlate = match[0].toUpperCase().replace(/\s+/g, "-");
      addEntity(EntityType.VEHICLE, standardPlate, 0.95, [match.index, match.index + match[0].length]);
    }

    // 4. Financial Amounts & Proceeds of Crime (e.g. Rs. 1,45,00,000/-)
    const amountRegex = /(?:Rs\.?\s*|INR\s*)([0-9,]+(?:\/\-)?)|(\b\d+\s*(?:Lakhs|Crores|Lakh|Crore)\b)/gi;
    while ((match = amountRegex.exec(text)) !== null) {
      const amtStr = match[0].trim();
      if (amtStr.length >= 4 && amtStr !== "Rs. 0" && !amtStr.includes("4 crore judgments")) {
        addEntity(EntityType.BANK_ACCOUNT, `Defrauded: ${amtStr}`, 0.92, [match.index, match.index + match[0].length]);
      }
    }

    // 5. Case Title Petitioner / Accused (e.g., "VINAY VISHNU JADHAV Versus STATE OF GUJARAT")
    const caseTitleRegex = /(?:^|[.\n\r;=])\s*([A-Z][A-Za-z0-9\.\s]{1,30}?)\s+(?:v(?:s|ersus|\.)|Versus)\s+([A-Za-z\.\s]{3,35}?)(?=\s+(?:on|in|\d{4}|Appeal|Petition|Court|\n|=|$))/gi;
    while ((match = caseTitleRegex.exec(text)) !== null) {
      const p1 = match[1].trim().replace(/^(?:IN\s+THE|BEFORE\s+THE|MR\s+)/i, "");
      const p2 = match[2].trim();
      if (!NerEngine.isInvalidName(p1) && !p1.toLowerCase().includes("court")) {
        addEntity(EntityType.SUSPECT, p1, 0.96, [match.index, match.index + p1.length]);
      }
      if (p2 && !NerEngine.isInvalidName(p2) && !p2.toLowerCase().includes("state") && !p2.toLowerCase().includes("court")) {
        addEntity(EntityType.SUSPECT, p2, 0.92, [match.index, match.index + match[0].length]);
      }
    }

    // 6. Accused & Named Individuals
    const strictSuspectPatterns = [
      /(?:[Aa]ccused|[Ss]uspect|[Hh]istory[-\s]sheeter|[Cc]o-conspirator|[Pp]erpetrator|[Aa]ssailant|[Aa]ssociate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g,
      /(?:Respondent\s*No\.?\s*\d+[,:\s]+|[Aa]ppellant\s+|[Pp]etitioner\s+|[Aa]pplicant\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g,
      /(?:[Aa]rrested|[Dd]etained|[Ii]nterrogated)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g,
      /(?:Mr\.|Shri|Smt\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g,
      /\b([A-Z]\.?\s+[A-Z]\.?\s+[A-Z][a-z]+)\b/g
    ];

    for (const pattern of strictSuspectPatterns) {
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (!NerEngine.isInvalidName(name)) {
          addEntity(EntityType.SUSPECT, name, 0.94, [match.index, match.index + match[0].length]);
        }
      }
    }

    // 7. FIR, C.R. No. (Crime Register) & Criminal Cases
    const firPattern = /(?:FIR\s*No\.?|C\.R\.NO\.?|C\.R\.\s*No\.?|Crime\s+Register\s*No\.?)\s*([A-Za-z0-9\/\.\s\-]{3,35}?(?:of\s+\d{4}|\/\d{2,4}|\d{4}))/gi;
    while ((match = firPattern.exec(text)) !== null) {
      const firNum = `FIR ${match[0].replace(/\s+/g, " ").trim()}`;
      if (firNum.length < 50) {
        addEntity("FIR_CASE", firNum, 0.98, [match.index, match.index + match[0].length]);
      }
    }

    // 8. Police Stations & Investigation Wings (e.g., D.C.B. Police Station, Surat, Bandra Crime Branch)
    const psPattern = /\b([A-Za-z0-9\.\s]{2,25}?\s+(?:Police\s+Station|Crime\s+Branch|Special\s+Cell|CID|CBI))\b/gi;
    while ((match = psPattern.exec(text)) !== null) {
      const psName = match[1].trim();
      if (psName.length >= 6 && psName.length <= 40 && !NerEngine.isInvalidName(psName)) {
        addEntity(EntityType.ORGANIZATION, psName, 0.95, [match.index, match.index + match[0].length]);
      }
    }

    // 9. Government Agencies, Housing Authorities & Universities
    const agencyPattern = /\b([A-Z][A-Za-z0-9\s&]{3,50}?\s+(?:Authority|Housing|Development|Board|Corporation|University|College|Institutions|High\s+Court|Supreme\s+Court))\b/g;
    while ((match = agencyPattern.exec(text)) !== null) {
      const orgName = match[1].trim();
      if (orgName.length > 5 && orgName.length < 65 && !NerEngine.isInvalidName(orgName)) {
        addEntity(EntityType.ORGANIZATION, orgName, 0.93, [match.index, match.index + match[0].length]);
      }
    }

    // 10. Weapons
    const weaponRegex = /\b(?:(?:country-made|improvised|semi-automatic|automatic)?\s*(?:pistol|firearm|revolver|rifle|ak-47|glock|knife|ammunition|cartridge(?:s)?|rounds))\b/gi;
    while ((match = weaponRegex.exec(text)) !== null) {
      addEntity(EntityType.WEAPON, match[0].toLowerCase(), 0.90, [match.index, match.index + match[0].length]);
    }

    return entities;
  }
}

module.exports = { NerEngine };
