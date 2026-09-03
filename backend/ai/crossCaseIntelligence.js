/**
 * BlockD Cross-Case Criminal Intelligence & Recidivism Engine
 * Connects the dots across all past police records regardless of crime type:
 * 1. Matches suspects & aliases appearing across multiple distinct FIRs.
 * 2. Matches weapons (ballistic links), vehicles, and phones across crimes.
 * 3. Builds a criminal rap sheet with severity escalation (Theft -> Extortion -> Murder).
 * 4. Flags repeat offenders & network co-accused ties.
 */

const { StringMatcher } = require("./stringMatcher");

class CrossCaseIntelligence {
  /**
   * Scans a target case against the entire historical case database to discover all hidden connections.
   * @param {Object} targetCase - The newly filed or active case
   * @param {Array<Object>} allCases - List of all historical district cases
   * @returns {Object} Comprehensive cross-case intelligence analysis
   */
  static analyzeConnections(targetCase, allCases) {
    const historicalCases = allCases.filter(c => c.caseId !== targetCase.caseId);

    const matches = [];
    const entityFrequency = new Map(); // entityVal -> { count, entity, cases: Set }
    const suspectRapSheets = new Map(); // suspectName -> { cases: [], offenses: [], aliases: Set, associates: Set }

    // Aggregate frequencies across all district cases
    allCases.forEach(c => {
      c.entities.forEach(e => {
        const val = e.value.trim().toLowerCase();
        if (!entityFrequency.has(val)) {
          entityFrequency.set(val, {
            value: e.value.trim(),
            type: e.type,
            count: 0,
            cases: new Set(),
            crimeTypes: new Set()
          });
        }
        const record = entityFrequency.get(val);
        record.count++;
        record.cases.add(c.caseId);
        record.crimeTypes.add(c.crimeType);

        // Build rap sheets for individuals
        if (e.type === "SUSPECT" || e.type === "ALIAS") {
          const normName = e.value.trim();
          if (!suspectRapSheets.has(normName)) {
            suspectRapSheets.set(normName, {
              name: normName,
              type: e.type,
              caseCount: 0,
              cases: [],
              crimeTypes: new Set(),
              coAccused: new Set(),
              vehicles: new Set(),
              phones: new Set(),
              weapons: new Set()
            });
          }
          const sheet = suspectRapSheets.get(normName);
          sheet.caseCount++;
          sheet.cases.push({
            caseId: c.caseId,
            title: c.title,
            crimeType: c.crimeType,
            filingDate: c.filingDate
          });
          sheet.crimeTypes.add(c.crimeType);

          // Add co-accused from the same case
          c.entities.filter(x => (x.type === "SUSPECT" || x.type === "ALIAS") && x.value.trim() !== normName)
            .forEach(x => sheet.coAccused.add(x.value.trim()));

          c.entities.filter(x => x.type === "VEHICLE").forEach(v => sheet.vehicles.add(v.value.trim()));
          c.entities.filter(x => x.type === "PHONE").forEach(p => sheet.phones.add(p.value.trim()));
          c.entities.filter(x => x.type === "WEAPON").forEach(w => sheet.weapons.add(w.value.trim()));
        }
      });
    });

    // Cross-reference targetCase entities against historical cases
    targetCase.entities.forEach(targetEnt => {
      const targetVal = targetEnt.value.trim();

      historicalCases.forEach(histCase => {
        histCase.entities.forEach(histEnt => {
          let isMatch = false;
          let matchType = "EXACT";
          let confidence = 0.95;

          // Check exact match
          if (targetEnt.type === histEnt.type && targetVal.toLowerCase() === histEnt.value.trim().toLowerCase()) {
            isMatch = true;
          }
          // Check phonetic / similarity match for suspects & aliases
          else if (
            (targetEnt.type === "SUSPECT" || targetEnt.type === "ALIAS") &&
            (histEnt.type === "SUSPECT" || histEnt.type === "ALIAS")
          ) {
            if (StringMatcher.stringSimilarity(targetVal, histEnt.value) >= 0.75 || StringMatcher.isPhoneticMatch(targetVal, histEnt.value)) {
              isMatch = true;
              matchType = "FUZZY_ALIAS";
              confidence = 0.88;
            }
          }

          if (isMatch) {
            matches.push({
              entityValue: targetVal,
              entityType: targetEnt.type,
              matchType,
              confidence,
              matchedCaseId: histCase.caseId,
              matchedCaseTitle: histCase.title,
              matchedCrimeType: histCase.crimeType,
              filingDate: histCase.filingDate,
              details: `Entity '${targetVal}' also appeared in FIR #${histCase.caseId} (${histCase.crimeType})`
            });
          }
        });
      });
    });

    // Repeat offenders flagged (appearing in > 1 case)
    const repeatOffenders = Array.from(entityFrequency.values())
      .filter(ef => (ef.type === "SUSPECT" || ef.type === "ALIAS") && ef.cases.size > 1)
      .sort((a, b) => b.cases.size - a.cases.size)
      .map(ro => ({
        name: ro.value,
        type: ro.type,
        totalCasesInvolved: ro.cases.size,
        casesList: Array.from(ro.cases),
        crimeTypes: Array.from(ro.crimeTypes),
        riskLevel: ro.cases.size >= 3 ? "HIGH_ALERT_RECIDIVIST" : "REPEAT_OFFENDER"
      }));

    return {
      targetCaseId: targetCase.caseId,
      totalCrossCaseLinks: matches.length,
      crossCaseMatches: matches,
      repeatOffenders,
      suspectRapSheets: Array.from(suspectRapSheets.values()).map(s => ({
        name: s.name,
        caseCount: s.cases.length,
        cases: s.cases,
        crimeTypes: Array.from(s.crimeTypes),
        coAccused: Array.from(s.coAccused),
        vehicles: Array.from(s.vehicles),
        phones: Array.from(s.phones),
        weapons: Array.from(s.weapons)
      }))
    };
  }
}

module.exports = { CrossCaseIntelligence };
