/**
 * BlockD Universal Crime Database & Multi-Case Store
 * Manages all active and historical district police records spanning diverse crime types:
 * Homicide, Armed Robbery, Vehicle Theft, Extortion/Threats, Narcotics, and Cyber Harassment.
 */

const { IngestionEngine, SourceType } = require("./ingestion/ingestionEngine");
const { CriminalAiPipeline } = require("./ai/criminalAiPipeline");

class CaseStore {
  constructor() {
    this.cases = new Map();
    this.initHistoricalDistrictRecords();
  }

  initHistoricalDistrictRecords() {
    // 1. Historical Case 1: Homicide / Shootout (IPC 302 / Arms Act)
    this.createCase({
      caseId: "FIR-2024-DELHI-102",
      crimeType: "Homicide / Gang Shootout",
      ipcSections: "302, 120B IPC, Sec 25 Arms Act",
      title: "Karol Bagh Gangland Shootout",
      filingDate: "2024-03-12",
      policeStation: "Karol Bagh Police Station",
      narrative: `
        FIR No. 102/2024. Date: 12/03/2024. P.S. Karol Bagh.
        Victim Harish Grover shot dead near Metro Station by two assailants driving a black Scorpio.
        Shooter identified as Shooter Samir operating on instructions of Vikram Sharma alias 'Tony'.
        Recovered a 9mm country-made pistol from crime scene. Contact phone intercepted: +919811099881.
      `
    });

    // 2. Historical Case 2: Vehicle Theft & Interstate Ring (IPC 379 / 411)
    this.createCase({
      caseId: "FIR-2024-DELHI-440",
      crimeType: "Automobile Theft Ring",
      ipcSections: "379, 411, 420 IPC",
      title: "Interstate Luxury Vehicle Theft Syndicate",
      filingDate: "2024-07-19",
      policeStation: "Special Cell, Lodhi Colony",
      narrative: `
        FIR No. 440/2024. Date: 19/07/2024. P.S. Special Cell.
        Multiple luxury SUVs stolen from South Delhi. Vehicle DL-01-AB-1234 intercepted at toll checkpoint.
        Accused Vikram Sharma and Ramesh Bhai arrested for running vehicle smuggling racket.
        Accused utilized phone +919811099881 and handset IMEI 864201041234567.
      `
    });

    // 3. Historical Case 3: Extortion & Threat Calls (IPC 384 / 506)
    this.createCase({
      caseId: "FIR-2024-DELHI-682",
      crimeType: "Extortion & Threat Calls",
      ipcSections: "384, 506 IPC",
      title: "Businessman Extortion & Protection Money Demand",
      filingDate: "2024-11-05",
      policeStation: "Connaught Place Police Station",
      narrative: `
        FIR No. 682/2024. Date: 05/11/2024. P.S. Connaught Place.
        Local jeweler reported threatening extortion calls demanding 50 Lakhs protection money.
        Call originated from phone +919876543210. Caller identified himself as alias 'Tony'.
        Financial accounts flagged at HDFC Bank (A/C: HDFC-991283) associated with Royal Trade Impex Ltd.
      `
    });

    // 4. Historical Case 4: Narcotics & Arms Smuggling (NDPS / Arms Act)
    this.createCase({
      caseId: "FIR-2025-DELHI-019",
      crimeType: "Narcotics Trafficking & Illegal Firearms",
      ipcSections: "Sec 21 NDPS Act, Sec 25/27 Arms Act",
      title: "Contraband & Illegal Weapon Seizure Raid",
      filingDate: "2025-01-20",
      policeStation: "Crime Branch",
      narrative: `
        FIR No. 019/2025. Date: 20/01/2025. P.S. Crime Branch.
        Raid conducted at warehouse in Outer Delhi. Seized 1.5kg heroin and 3 country-made firearms.
        Operatives detained: Ramesh Bhai and associate courier. Mastermind reported as Kingpin Chief.
      `
    });
  }

  createCase({ caseId, crimeType, ipcSections, title, filingDate, policeStation, narrative }) {
    const canonicalDoc = IngestionEngine.ingest({
      caseId,
      sourceType: SourceType.FIR,
      title,
      content: narrative
    });

    const aiResult = CriminalAiPipeline.processDocument(canonicalDoc);

    const caseRecord = {
      caseId,
      crimeType: crimeType || "General Crime",
      ipcSections: ipcSections || "IPC General",
      title,
      filingDate: filingDate || new Date().toISOString().split("T")[0],
      policeStation: policeStation || "District Central PS",
      rawNarrative: narrative.trim(),
      entities: aiResult.entities,
      relations: aiResult.relations,
      graph: aiResult.graph,
      status: "UNDER_INVESTIGATION",
      createdAt: new Date().toISOString()
    };

    this.cases.set(caseId, caseRecord);
    return caseRecord;
  }

  getCase(caseId) {
    return this.cases.get(caseId);
  }

  getAllCases() {
    return Array.from(this.cases.values());
  }
}

module.exports = { CaseStore };
