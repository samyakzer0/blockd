/**
 * Universal Ingestion & NER Stress Test across Diverse Indian Legal & Police Formats:
 * 1. North-East Arms/Extortion Case (Gauhati High Court)
 * 2. Western India Narcotics & Hawala FIR (Bandra Crime Branch)
 * 3. Southern India Cyber / Financial Syndicate (Bengaluru City Police)
 * 4. Northern India Armed Carjacking & Inter-State Auto Theft (Delhi Special Cell)
 * 5. Supreme Court Criminal Appeal (Fake Degree & Impersonation)
 */

const { NerEngine } = require("./ai/nerEngine");

const testCases = [
  {
    name: "Case 1: Gauhati HC (S L Mangcha vs State of Assam)",
    text: "IN THE HIGH COURT OF GAUHATI. S L Mangcha vs The State Of Assam on 11 August, 2025. Accused S L Mangcha was detained by Crime Branch u/s 120B IPC and Sec 25 Arms Act. Seized pistol and getaway vehicle AS-01-CD-1234. Respondent State submitted that the accused communicated with associate Paresh Baruah on phone +919864011223."
  },
  {
    name: "Case 2: Mumbai Crime Branch (NDPS & Hawala Seizure)",
    text: "FIR No. 992/2025 registered at P.S. Bandra Crime Branch. Accused Tariq Sheikh alias 'Tiger' arrested with 2.2kg contraband and vehicle MH-02-CD-9988. Co-conspirator Vikram Sharma coordinated transaction using bank account IFSC HDFC0001234 and phone +919820011223."
  },
  {
    name: "Case 3: Bengaluru City Police (Cyber Racket)",
    text: "P.S. Thilaknagar, Bengaluru. FIR No. 8/2025 u/s 420, 465 IPC. Accused Ramesh Gowda created shell entity Sarvodaya Holdings. The petitioner Ramesh Gowda transferred funds from SBIN0004567 using handset IMEI 864201099887766."
  },
  {
    name: "Case 4: Delhi Special Cell (Vehicle Syndicate)",
    text: "Delhi High Court Appeal. State of NCT of Delhi vs Vikram Sharma. Recovered luxury SUV DL-01-AB-1234. History-sheeter Vikram Sharma was intercepted with country-made revolver and ammunition."
  },
  {
    name: "Case 5: Supreme Court (Mazahar Khan Appeal)",
    text: "SUPREME COURT OF INDIA (2026 INSC 144). Zeba Khan vs State of U.P. Respondent No. 2 Mazahar Khan operated fake degree racket. Veer Bahadur Singh Purvanchal University clarified that Sarvodaya Group of Institutions was never affiliated."
  }
];

console.log("================================================================================");
console.log(" 🧪 RUNNING UNIVERSAL NER & LEGAL PARSER STRESS TEST ACROSS 5 CASES");
console.log("================================================================================\n");

testCases.forEach((tc, idx) => {
  console.log(`[${idx + 1}] Testing: ${tc.name}`);
  const entities = NerEngine.extractEntities(tc.text);
  
  const suspects = entities.filter(e => e.type === "SUSPECT").map(e => e.value);
  const vehicles = entities.filter(e => e.type === "VEHICLE").map(e => e.value);
  const phones = entities.filter(e => e.type === "PHONE").map(e => e.value);
  const firs = entities.filter(e => e.type === "FIR_CASE").map(e => e.value);
  const orgs = entities.filter(e => e.type === "ORGANIZATION").map(e => e.value);

  console.log(`    👤 Clean Suspects : [ ${suspects.join(", ") || "None"} ]`);
  if (vehicles.length) console.log(`    🚗 Vehicles        : [ ${vehicles.join(", ")} ]`);
  if (phones.length)   console.log(`    📞 Phones          : [ ${phones.join(", ")} ]`);
  if (firs.length)     console.log(`    📄 FIR Cases       : [ ${firs.join(", ")} ]`);
  if (orgs.length)     console.log(`    🏛️  Organizations   : [ ${orgs.join(", ")} ]`);
  console.log("    ----------------------------------------------------------------------------");
});
