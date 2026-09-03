# BlockD: Real-World Data Ingestion & Scaling Guide

This guide explains how to transition **BlockD** from mock datasets to **real-world police data, open-source intelligence (OSINT), PDF documents, audio wiretaps, and CCTV OCR feeds**.

---

## 1. Where to Source Authentic Real-World Criminal & Forensic Data

To demonstrate real-world dot-connecting with actual public datasets, you can ingest the following publicly available real-world sources:

### A. Real-World Indian Police FIRs & Court Judgments
1. **Delhi Police & State Police Open FIR Portals**:
   - Many state police departments (e.g., Delhi Police, UP Police) provide public downloads of non-sensitive FIRs under Section 154 CrPC / Right to Information.
2. **eCourts & Indian Kanoon Open Judgments**:
   - URL: [https://indiankanoon.org/](https://indiankanoon.org/)
   - Contains thousands of full-text criminal prosecution appeals, gang chargesheets, and seizure memos detailing weapons, vehicle plates, and phone intercepts.
3. **Data.gov.in (National Crime Records Bureau - NCRB Open Data)**:
   - URL: [https://data.gov.in/](https://data.gov.in/)
   - Provides structured datasets on district crime statistics, vehicle thefts, and seizure records.

### B. Real-World Telecom CDR & Call Network Datasets
1. **Kaggle Mobile Telecom CDR Datasets**:
   - Search: *"Telecom CDR Data for Fraud / Crime Investigation"*
   - Contains real-world anonymized cellular call records with cell tower IDs, duration, IMSI, and IMEI numbers.
2. **Enron Communication Network Dataset (Stanford SNAP)**:
   - URL: [https://snap.stanford.edu/data/email-Enron.html](https://snap.stanford.edu/data/email-Enron.html)
   - The gold standard for real-world hierarchical organization and communication flow analysis.

### C. Real-World Financial Fraud & Hawala Datasets
1. **FinCEN Files Dataset (ICIJ - International Consortium of Investigative Journalists)**:
   - URL: [https://www.icij.org/investigations/fincen-files/](https://www.icij.org/investigations/fincen-files/)
   - Contains real-world suspicious activity reports (SARs), shell companies, bank transactions, and offshore beneficiary networks.
2. **PaySim Synthetic Financial Transactions**:
   - URL: [https://www.kaggle.com/datasets/ealaxi/paysim1](https://www.kaggle.com/datasets/ealaxi/paysim1)
   - Real-world scaled mobile money transfers designed to benchmark fraud and money laundering algorithms.

---

## 2. Multi-Modal Ingestion Pipeline (PDF, Audio Wiretaps & OCR)

BlockD now includes the **`MultiModalIngestor`** module ([`backend/ingestion/multiModalIngestor.js`](file:///c:/Users/SAMYAKK/Downloads/acutev2-main/acutev2-main/blockd/backend/ingestion/multiModalIngestor.js)) to process non-text inputs:

```
                  ┌─────────────────────────────────────────┐
                  │          REAL-WORLD DATA SOURCES        │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
 ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
 │ PDF FIR / Memos│             │ Audio Wiretap │             │ CCTV / ANPR   │
 │ (pdf-parse /  │             │ (OpenAI       │             │ (Tesseract.js │
 │  OCR scanner) │             │  Whisper STT) │             │  Plate OCR)   │
 └───────┬───────┘             └───────┬───────┘             └───────┬───────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       multiModalIngestor.js Engine      │
                  │   - OCR Pre-processing & Noise Cleanup  │
                  │   - Speech-to-Text Transcript Parsing   │
                  │   - Normalized Canonical JSON Generation│
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │   CriminalAiPipeline (NER + Relations)  │
                  │    - Automatic Suspect/Vehicle Mapping  │
                  │    - Real-Time Graph Topology Update    │
                  └─────────────────────────────────────────┘
```

---

## 3. Step-by-Step Multi-Modal Implementation

### 1. Ingesting Real Scanned PDF FIRs
Add `pdf-parse` or `tesseract.js` to extract text from multi-page scanned police PDFs:
```javascript
const { MultiModalIngestor } = require("./blockd/backend/ingestion/multiModalIngestor");

// Ingest a scanned PDF FIR
const result = await MultiModalIngestor.ingestPdf("./evidence/FIR_Delhi_SpecialCell_2025.pdf", {
  caseId: "FIR-2025-REAL-991",
  title: "Special Cell Armed Gang Intercept"
});

console.log(`Extracted ${result.entities.length} entities and ${result.relations.length} relations from PDF!`);
```

### 2. Ingesting Audio Call Recordings & Wiretaps
For intercepted telephone calls, the audio is transcribed via **OpenAI Whisper (open-source model)** or native Node STT, and piped directly into BlockD:
```javascript
// Ingest intercepted call audio transcript
const result = await MultiModalIngestor.ingestAudioRecording({
  caller: "+919811099881",
  receiver: "+919876543210",
  transcript: "Bhai, the white Scorpio with plate DL-01-AB-1234 is parked near Rohini. Deliver the cash to Tony at Karol Bagh."
}, {
  caseId: "WIRETAP_DELHI_01"
});

console.log("Audio transcript mapped into knowledge graph:", result.graph.nodes);
```

### 3. Ingesting CCTV / Camera OCR Plate Captures
For vehicle plate readers (ANPR) and handwritten seizure memos:
```javascript
// Ingest CCTV camera ANPR feed
const result = await MultiModalIngestor.ingestImageOcr("WHITE HYUNDAI CRETA DL-01-AB-1234 TIMECODE: 22:45:10", {
  camera_id: "ANPR_TOLL_PANIPAT_03",
  location: "GT Karnal Road Toll Checkpoint"
});
```

---

## 4. Upscaling Architecture for Enterprise Law Enforcement

When deploying at scale across a whole state police department:
1. **Streaming Queue (Apache Kafka / RabbitMQ)**: Ingest 10,000+ CDR rows/second from telecom providers.
2. **Dedicated Graph Database (Neo4j / Memgraph)**: For multi-million node graphs spanning decades of criminal records.
3. **Local Private LLM (Llama 3 / Mistral 7B via vLLM / Ollama)**: For zero-data-leakage on-premise police cloud extraction.
