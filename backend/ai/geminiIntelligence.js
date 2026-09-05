/**
 * BlockD Gemini Cognitive Criminal Intelligence & Deep-Dive Engine
 * Connects directly to Google Gemini API for:
 * 1. Deep Entity & Multi-Hop Relationship Extraction from Legal/Multi-Modal Text
 * 2. Recursive Background Checks & Network Expansion using Indian Kanoon Data
 * 3. Asset Tracing, Co-Accused Identification, and Criminal Dossier Synthesis
 */

class GeminiIntelligenceEngine {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    this.models = [
      { name: "gemini-1.5-flash", version: "v1beta" },
      { name: "gemini-2.0-flash", version: "v1beta" },
      { name: "gemini-1.5-pro", version: "v1beta" },
      { name: "gemini-1.5-flash", version: "v1" },
      { name: "gemini-pro", version: "v1beta" }
    ];
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  hasKey() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  /**
   * Internal helper to make raw HTTPS request to Gemini API
   */
  async _callGemini(prompt, systemInstruction = "", jsonMode = true) {
    if (!this.hasKey()) {
      return null;
    }

    for (const m of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/${m.version}/models/${m.name}:generateContent?key=${encodeURIComponent(this.apiKey.trim())}`;
        
        const bodyPayload = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        };

        if (systemInstruction) {
          bodyPayload.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        if (jsonMode && m.version === "v1beta") {
          bodyPayload.generationConfig.responseMimeType = "application/json";
        }

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        let candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          if (jsonMode) {
            candidate = candidate.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
            return JSON.parse(candidate);
          }
          return candidate;
        }
      } catch (err) {
        // try next model
      }
    }

    return null;
  }

  /**
   * Extract comprehensive entities, relationships, and dossier from raw text
   */
  async extractGraphFromText(rawText, metadata = {}) {
    const systemPrompt = `You are the lead intelligence analyst at BlockD, a cyber-crime and criminal network intelligence system.
Your task is to analyze judicial records, FIRs, police charge-sheets, intercepted transcripts, and bank records to construct an exhaustive, high-precision knowledge graph.

CRITICAL RULES:
1. Strict objectivity and zero hallucination. Extract real names, aliases, vehicles, bank accounts, organizations, penal sections, and locations mentioned.
2. Form meaningful directional relationships between entities (e.g. CONTROLS, TRANSFERRED_FUNDS, COMMUNICATED_WITH, CO_ACCUSED, REGISTERED_VEHICLE, HARBORED_AT, ISSUED_PASSPORT, ACCUSED_IN_CASE).
3. Do NOT include any emojis anywhere in your output.
4. Output MUST be valid JSON conforming to the requested schema.`;

    const userPrompt = `Analyze the following case document and return a detailed intelligence graph.

METADATA:
- Case Title: ${metadata.title || "Unknown"}
- Crime Type: ${metadata.crimeType || "General Crime"}
- Jurisdiction: ${metadata.jurisdiction || "Investigating Agency"}

DOCUMENT TEXT:
"""
${rawText.slice(0, 30000)}
"""

JSON SCHEMA TO RETURN:
{
  "summary": "Executive analytical brief of the criminal operation (strictly no emojis, professional tone)",
  "primaryKingpin": "Full name of primary syndicate orchestrator or main accused",
  "keyBrokers": ["Name or entity of key financial/logistical intermediary"],
  "entities": [
    {
      "id": "Standardized unique name or identifier",
      "label": "Display name",
      "type": "SUSPECT | ORGANIZATION | BANK_ACCOUNT | VEHICLE | LOCATION | CRIME_SECTION | PHONE_NUMBER | WEAPON",
      "role": "e.g. Mastermind, Mule, Hawala Operator, Shell Company, Forged Passport, Seized Vehicle",
      "confidence": 0.98,
      "riskLevel": "CRITICAL | HIGH | MEDIUM | LOW",
      "details": {
        "aliases": ["string"],
        "knownAddresses": ["string"],
        "penalSections": ["string"],
        "financialAmounts": ["string"]
      }
    }
  ],
  "relationships": [
    {
      "source": "Exact id from entities list",
      "target": "Exact id from entities list",
      "relation": "CONTROLS | TRANSFERRED_FUNDS | COMMUNICATED_WITH | CO_ACCUSED | REGISTERED_TO | HARBORED_AT | USED_IN_CRIME | CHARGED_UNDER",
      "label": "Readable relationship label (e.g. Transferred ₹12,50,000)",
      "description": "Specific forensic context from the evidence",
      "confidence": 0.95
    }
  ],
  "investigativeLeads": [
    {
      "title": "Short title of lead",
      "target": "Entity name or focus",
      "rationale": "Why this lead should be pursued immediately",
      "action": "Specific investigative step"
    }
  ]
}`;

    const result = await this._callGemini(userPrompt, systemPrompt, true);
    return result;
  }

  /**
   * Deep-dive an entity: Connects Kanoon data + Case context to unearth associates, assets, and previous FIRs
   */
  async deepDiveEntity({ entityName, caseContext, kanoonDocuments = [] }) {
    const systemPrompt = `You are BlockD's deep-dive criminal analyst.
Your objective is to perform recursive background expansion on an entity by cross-referencing active case intelligence with Indian Kanoon judicial court records.
Unearth the entity's network: co-accused mates, shell companies, financial assets, vehicles, and historical FIRs.
DO NOT use any emojis in your response. Professional judicial intelligence tone only.`;

    let kanoonText = "";
    if (kanoonDocuments && kanoonDocuments.length > 0) {
      kanoonText = kanoonDocuments.map((doc, idx) => `
--- KANOON RECORD [${idx + 1}] ---
Title: ${doc.title}
Doc ID: #${doc.tid}
Source: ${doc.docsource || "Judicial Court"}
Excerpt: ${doc.headline || ""}
Full Text Snippet: ${(doc.doc || doc.content || "").slice(0, 4000)}
`).join("\n");
    }

    const userPrompt = `Perform an atomic deep-dive on target entity: "${entityName}".

ACTIVE CASE CONTEXT:
${caseContext ? caseContext.slice(0, 4000) : "No prior case summary."}

RETRIEVED INDIAN KANOON JUDICIAL COURT RECORDS FOR "${entityName}":
${kanoonText || "No prior court records found on Indian Kanoon."}

JSON SCHEMA TO RETURN:
{
  "entityName": "${entityName}",
  "profileSummary": "Detailed background, modus operandi, and syndicate standing of ${entityName}",
  "threatLevel": "CRITICAL | HIGH | ELEVATED | MODERATE",
  "matesAndAssociates": [
    {
      "name": "Full name of associate / co-accused",
      "role": "e.g. Logistical Enabler, Hawala Mule, Co-Conspirator, Muscle",
      "connectionDetails": "How they are linked to ${entityName}"
    }
  ],
  "tracedAssetsAndAccounts": [
    {
      "asset": "e.g. Account at HDFC Bank / Luxury Villa in Alibaug / Shell Company / Vehicle DL-8C-XX",
      "type": "BANK_ACCOUNT | REAL_ESTATE | SHELL_COMPANY | VEHICLE | LUXURY_GOODS",
      "status": "FROZEN | UNDER_SURVEILLANCE | SUSPECTED_LAUNDERING | UNACCOUNTED"
    }
  ],
  "priorCasesAndFIRs": [
    {
      "caseTitle": "Title of previous case or FIR",
      "courtOrStation": "Court or Police Station",
      "yearOrDate": "Year / Date",
      "charges": "IPC / BNS / PMLA Sections"
    }
  ],
  "newGraphNodes": [
    {
      "id": "Unique node id",
      "label": "Display label",
      "type": "SUSPECT | BANK_ACCOUNT | VEHICLE | ORGANIZATION | LOCATION"
    }
  ],
  "newGraphEdges": [
    {
      "source": "${entityName}",
      "target": "Target node id",
      "relation": "CO_ACCUSED | TRANSFERRED_FUNDS | OWNS_ASSET | FREQUENTS",
      "label": "Relationship summary"
    }
  ],
  "interactiveCards": [
    {
      "title": "Short title for copilot card",
      "badge": "BADGE_TEXT",
      "variant": "primary | danger | warning | success",
      "desc": "Actionable insight or detail for the investigator"
    }
  ]
}`;

    const result = await this._callGemini(userPrompt, systemPrompt, true);
    return result;
  }
  /**
   * Cross-Case Intelligence Deep Dive:
   * Analyzes target case or entity, cross-references with all existing graph nodes,
   * detects shared co-accused, mule accounts, burner devices, and establishes cross-case bridge edges.
   */
  async crossCaseDeepDive({ target, existingGraphNodes = [], activeCaseContext = "", kanoonDocuments = [] }) {
    const systemPrompt = `You are BlockD's lead cross-case intelligence and link-analysis engine.
Your mission is to perform forensic cross-case correlation: analyze a target case, judgment, or suspect, and automatically discover and establish high-confidence bridging relationships with entities present in the investigator's active knowledge graph.
CRITICAL RULES:
1. Strict objectivity, judicial intelligence tone, and strictly ZERO emojis anywhere.
2. Find exact or probabilistic matches between the target case and EXISTING GRAPH NODES (e.g. shared kingpins, co-accused, hawala accounts, fake passport printing facilities, getaway vehicles).
3. Return newGraphNodes for new operatives/assets discovered in this case.
4. Return crossCaseBridgeEdges linking new entities to the matching EXISTING GRAPH NODES.`;

    const existingEntitiesList = existingGraphNodes.map(n => `- [${n.type || "ENTITY"}] ${n.label || n.id} (Role: ${n.properties?.role || "Active Node"})`).join("\n");

    let kanoonText = "";
    if (kanoonDocuments && kanoonDocuments.length > 0) {
      kanoonText = kanoonDocuments.map((doc, idx) => `
--- KANOON RECORD [${idx + 1}] ---
Title: ${doc.title}
Doc ID: #${doc.tid}
Source: ${doc.docsource || "Judicial Court"}
Excerpt: ${doc.headline || ""}
Snippet: ${(doc.doc || doc.content || "").slice(0, 5000)}
`).join("\n");
    }

    const userPrompt = `Perform cross-case intelligence analysis on: "${target}".

INVESTIGATOR'S ACTIVE GRAPH NODES:
${existingEntitiesList || "No existing nodes in graph."}

ACTIVE CASE CONTEXT:
${activeCaseContext ? activeCaseContext.slice(0, 4000) : "No prior case summary."}

TARGET CASE / KANOON JUDICIAL RECORDS:
${kanoonText || "Target case details to be analyzed."}

JSON SCHEMA TO RETURN:
{
  "targetTitle": "${target}",
  "crossCaseSummary": "Analytical overview of the cross-case nexus and shared syndicate infrastructure",
  "sharedEntitiesCount": 2,
  "sharedEntities": [
    {
      "existingNodeId": "Exact name from active graph nodes list",
      "roleInTargetCase": "Role in this target case",
      "connectionStrength": "CRITICAL | HIGH | MEDIUM",
      "rationale": "Forensic evidence linking this entity across both cases"
    }
  ],
  "newGraphNodes": [
    {
      "id": "Standardized entity name",
      "label": "Display label",
      "type": "SUSPECT | BANK_ACCOUNT | VEHICLE | ORGANIZATION | LOCATION | CRIME_SECTION | PHONE_NUMBER",
      "role": "Role in target case",
      "riskLevel": "CRITICAL | HIGH | MEDIUM"
    }
  ],
  "crossCaseBridgeEdges": [
    {
      "source": "Entity ID (can be an existing node or new node)",
      "target": "Entity ID (can be an existing node or new node)",
      "relation": "COMMON_ACCUSED | INTER_STATE_HAWALA_LINK | SUPPLIED_PRINTING_DIES | SHELL_AFFILIATE | OPERATES_ACCOUNT | CROSS_CASE_SYNDICATE_LINK",
      "label": "Human readable link description (e.g. Routed ₹1.2 Cr Mumbai-Surat Channel)",
      "confidence": 0.96
    }
  ],
  "interactiveCards": [
    {
      "title": "Card Title (e.g. Cross-Case Nexus: 3 Shared Operatives)",
      "badge": "BADGE_TEXT",
      "variant": "danger | warning | primary | success",
      "desc": "Key analytical finding for the investigator",
      "deepDiveQuery": "Entity or case name to trigger recursive multi-hop deep dive on click"
    }
  ]
}`;

    const result = await this._callGemini(userPrompt, systemPrompt, true);
    return result;
  }
}

module.exports = { GeminiIntelligenceEngine };
