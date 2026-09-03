# Tech Stack: AI-Powered Criminal Network Analysis System (`BlockD`)

This document outlines the proposed technology stack adapting the **Acute architectural pattern** (Client-side Zero-Knowledge Encryption, IPFS decentralized/immutable evidence storage, Blockchain audit trails & Chain of Custody, and Secure Microservices) with an **AI/NLP & Graph Intelligence engine** for Law Enforcement & Intelligence Agencies.

---

## 1. High-Level Architectural Mapping (Acute $\rightarrow$ BlockD)

| Acute Architecture Layer | Acute (PhotoZApp) | BlockD (Criminal Network Analysis) |
| :--- | :--- | :--- |
| **Client / Ingestion Layer** | Browser AES-256 Encryption (`crypto-js`) | **Zero-Knowledge Evidence Ingestion**: Client-side encrypted upload of sensitive FIRs, CDRs, CCTV clips, bank records. |
| **Decentralized Storage** | IPFS (Pinata Pinning + Multi-gateway) | **Immutable Evidence Storage**: IPFS/Filecoin for tamper-proof, decentralized raw evidence archiving with CID verification. |
| **Integrity & Access Control** | Ethereum Smart Contract (`PhotoTransfer.sol`) | **Evidence Chain-of-Custody & RBAC**: Smart contracts recording cryptographic evidence hashes, officer access logs, and warrant-gated multi-sig approvals. |
| **Backend & Orchestration** | Node.js/Express + Redis OTP Store | **Node.js / Express + ethers.js + Redis**: Native JavaScript orchestration with `ethers.js`, `crypto-js`, and streaming async pipelines. |
| **Intelligence Engine (New)** | N/A | **Entity Resolution, Graph Neural Networks, and LLM Analysis Pipeline** (Node.js `@xenova/transformers` / local ONNX / Ollama). |
| **Graph & Search Layer (New)**| N/A | **Graph Database (Neo4j / Memgraph)** + **Vector Database (Qdrant / Milvus)**. |
| **Visualization & UI** | React 18, Framer Motion | **Interactive Intelligence Canvas**: React + Cytoscape.js / 3D Force Graph + Mapbox/Leaflet geospatial layers. |

---

## 2. Detailed Technology Stack

### A. Frontend & Visualization
- **Core Framework**: React 18 / Next.js (TypeScript) + Vite
- **Graph Visualization**: 
  - `Cytoscape.js` / `@reactflow/core` for 2D entity-relationship exploration and node manipulation.
  - `3d-force-graph` / `WebGL` for massive multi-cluster 3D network visualizations.
- **Geospatial & Timeline Analysis**:
  - `Mapbox GL JS` / `Leaflet` for geospatial movement tracking & cell tower CDR triangulation.
  - `Vis.js Timeline` / `D3.js` for chronological event reconstruction.
- **Web3 / Cryptography**:
  - `ethers.js` (v6) for wallet connection, signing audit logs, and warrant verification.
  - `Web Crypto API` + `crypto-js` for in-browser client-side AES-GCM / hybrid ECIES encryption.

---

### B. AI, NLP & Entity Extraction Pipeline
- **OCR & Document Ingestion**:
  - `Tesseract OCR` / `PaddleOCR` / `Nougat` for extracting text from scanned FIRs, police diaries, and identity cards.
  - `PyPDF2` / `pdfplumber` / `python-docx` for structured document parsing.
- **Named Entity Recognition (NER) & Relation Extraction (RE)**:
  - `spaCy` (en_core_web_trf) / `GLiNER` (Zero-shot Named Entity Recognition for custom law enforcement entities: Suspect, Alias, Vehicle, Weapon, Bank Account, IMEI/IMSI, Location, Gang).
  - `Hugging Face Transformers` (RoBERTa / DeBERTa fine-tuned on legal & intelligence datasets).
- **Entity Resolution & Deduplication (Record Linkage)**:
  - `Dedupe.io` / `Splink` (probabilistic record linkage to match aliases, misspelled names, multiple phone numbers to single suspect profiles).
  - Sentence Transformers (`all-mpnet-base-v2` / `bge-large-en-v1.5`) for semantic identity resolution.
- **Generative AI & LLM Assistant**:
  - `Llama 3 / Mistral / DeepSeek` (locally hostable with `vLLM` / `Ollama` for on-premise air-gapped security).
  - LangChain / LlamaIndex for Retrieval-Augmented Generation (RAG) over case dossiers.

---

### C. Graph Analytics & Storage
- **Graph Database**:
  - `Neo4j` (Cypher Query Language) or `Memgraph` (high-performance in-memory graph).
  - Algorithms: PageRank (influencer detection), Betweenness Centrality (key broker/intermediary identification), Louvain / Leiden (sub-gang/community detection), Shortest Path (link discovery).
- **Vector Search Engine**:
  - `Qdrant` / `Milvus` / `pgvector` for semantic similarity search across FIR narratives, surveillance transcripts, and suspect descriptions.
- **Relational / Metadata DB**:
  - `PostgreSQL` for operational metadata, user management, and structured CDR/transaction tabular logs.
- **Caching & Message Broker**:
  - `Redis` (session tokens, real-time query caching) + `Celery / RabbitMQ` (async pipeline queuing).

---

### D. Decentralized Evidence Custody & Blockchain
- **Blockchain / Ledger**:
  - **Private / Consortium EVM Chain** (Hyperledger Besu / Polygon Supernet / Avalanche Subnet) or Ethereum Testnet (Sepolia/Holesky).
  - Smart Contracts (Solidity):
    - `EvidenceRegistry.sol`: Stores SHA-256 / IPFS hash of raw evidence, timestamp, contributing agency ID.
    - `ChainOfCustody.sol`: Immutable audit trail recording every read, query, export, and modification by officer wallet addresses.
    - `WarrantGate.sol`: Multi-sig threshold access (requiring judge/senior superintendent approval signature before accessing restricted wiretaps or high-security intelligence).
- **Decentralized Storage**:
  - `IPFS` / `Kubo` (private IPFS cluster for law enforcement node-sharing) or `Pinata` / `Filecoin`.

---

### E. Backend Services & DevOps
- **Backend API**: Python `FastAPI` (high performance, native async, OpenAPI documentation).
- **Containerization & Orchestration**: Docker + Kubernetes (k8s) / Docker Compose.
- **Security & Compliance**:
  - End-to-End Encryption (E2EE) with Hardware Security Module (HSM) / KMS key management.
  - Role-Based Access Control (RBAC) + Attribute-Based Access Control (ABAC).
  - Air-gapped on-premise deployment capability for defense/police intranet.
