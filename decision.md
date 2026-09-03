# Architectural & Design Decisions: `BlockD`

This document details the key technical, cryptographic, AI/ML, and operational decisions we need to make together to build the **AI-Powered Criminal Network Analysis System**.

---

## Decision Matrix Summary

```
+-----------------------------------------------------------------------------------+
| #  | Decision Area              | Option A (Recommended) | Option B               |
+----+----------------------------+------------------------+------------------------+
| 1  | Blockchain Network Type    | Private EVM (Besu/Raft)| Public Testnet/Mainnet |
| 2  | Key Management & Custody   | Asymmetric Hybrid ECIES| Symmetric AES + OTP    |
| 3  | Graph Database Engine      | Neo4j Enterprise       | Memgraph (In-Memory)   |
| 4  | AI Deployment Model        | Self-Hosted Air-Gapped | Cloud APIs (OpenAI/etc)|
| 5  | Entity Resolution Strategy | Hybrid (Rules + Embed) | Pure ML Clustering     |
| 6  | IPFS Network Topology      | Private IPFS Cluster   | Public Gateway (Pinata)|
+-----------------------------------------------------------------------------------+
```

---

## 1. Blockchain Network Type & Privacy

### Context:
In Acute v2, transactions were executed on the public Ethereum Sepolia network. In law enforcement and intelligence, case metadata, suspect wallet interactions, and access logs contain sensitive national security and criminal intelligence data.

### Options:
* **Option A: Consortium / Private EVM Chain (e.g., Hyperledger Besu, Polygon Edge, Quorum) [Recommended]**
  * *Pros*: Zero gas fees for officers, high throughput (>1000 TPS), instant finality (IBFT 2.0 / QBFT), privacy-preserving nodes restricted only to authorized police/intelligence departments.
  * *Cons*: Requires running and maintaining at least 4 validator nodes.
* **Option B: Public L1/L2 (e.g., Sepolia, Arbitrum, Polygon PoS)**
  * *Pros*: Zero infrastructure maintenance for nodes.
  * *Cons*: Transaction fee overhead, metadata leaks on public block explorers, not compliant with strict government data residency laws.

---

## 2. Evidence Cryptography & Key Management

### Context:
Acute v2 stored AES keys directly on-chain and deleted them upon retrieval via `accessFile(otp)`. For law enforcement evidence:
1. Multiple authorized investigators may need repeated access over months during an active trial.
2. The key must never be visible to unauthorized observers.

### Options:
* **Option A: Asymmetric Hybrid Cryptography (ECIES + Multi-Party Computation / Threshold KMS) [Recommended]**
  * Evidence is encrypted with a unique AES-256-GCM symmetric key.
  * That AES key is encrypted with the public keys of authorized investigators / department role certificates (envelope encryption).
  * Access can be granted/revoked dynamically without re-encrypting the underlying gigabytes of evidence on IPFS.
* **Option B: One-Time Ephemeral Keys (Acute Pattern)**
  * Best for single-use handoffs between whistleblowers and field agents, but less practical for multi-agency collaborative case investigations.

---

## 3. Graph Database Engine & Analytics

### Context:
The core requirement is discovering hidden relationships (financial transactions, co-occurrences in FIRs, CDR calls, shared vehicles, associate networks) and calculating network influence metrics (centrality, community clustering).

### Options:
* **Option A: Neo4j (Cypher + Graph Data Science Plugin) [Recommended]**
  * *Pros*: Industry standard for link analysis and fraud/crime networks. Built-in Graph Data Science (GDS) algorithms: PageRank, Betweenness Centrality, Weakly Connected Components, Node Similarity. Excellent ecosystem and UI visualizer support.
  * *Cons*: Requires dedicated memory sizing for large datasets (>10M edges).
* **Option B: Memgraph (In-Memory + C++ Core)**
  * *Pros*: Ultra-fast streaming graph updates (ideal for real-time CDR streaming).
  * *Cons*: Smaller community and fewer out-of-the-box analytical algorithms compared to Neo4j GDS.

---

## 4. AI & NLP Model Hosting (Air-Gapped vs. Cloud)

### Context:
Entity extraction, crime report summarization, and query answering require processing highly confidential investigative documents (FIRs, transcripts, interrogation notes).

### Options:
* **Option A: Self-Hosted / On-Premise LLMs & Transformers (vLLM / Ollama + GLiNER / spaCy) [Recommended]**
  * *Models*: Llama-3-8B-Instruct (quantized via AWQ/GGUF), GLiNER for zero-shot crime entity recognition, BGE-M3 for multilingual embeddings (handling regional languages/English).
  * *Pros*: 100% data sovereignty, zero external data leaks, works in classified air-gapped environments.
  * *Cons*: Requires local GPU hardware (e.g., NVIDIA RTX 4090 or A100/L40S).
* **Option B: Cloud AI APIs (Azure OpenAI GovCloud / AWS Bedrock)**
  * *Pros*: Instant scalability, zero GPU setup.
  * *Cons*: Strict regulatory hurdles in many jurisdictions regarding uploading criminal records to third-party cloud endpoints.

---

## 5. Entity Resolution (Handling Aliases, Typos & Multiple Identifiers)

### Context:
Criminals use aliases (e.g., *"Bhai"*, *"Tony"*, *"Vikram alias Vicky"*), disposable SIM cards (10+ phone numbers), and fake IDs. The system must merge identical entities into a single **Master Person Index (MPI)** while preserving source confidence scores.

### Proposed Strategy:
1. **Deterministic Matching**: Exact match on National ID, Passport, IMEI, Bank Account number.
2. **Probabilistic Linkage**: Levenshtein / Jaro-Winkler phonetic matching (Soundex/Metaphone) on names, father names, and addresses.
3. **Semantic Embedding Matching**: Vector cosine similarity over biographical descriptions.
4. **Human-in-the-Loop Review**: Ambiguous entity mergers (>70% but <95% confidence) are flagged for investigator verification before graph fusion.

---

## 6. Multi-Tiered Access & Evidence Chain of Custody

### Proposed Access Workflow:
1. **Officer Ingestion**: Field officer uploads FIR / CDR / Video $\rightarrow$ Client encrypts $\rightarrow$ Pinned to private IPFS $\rightarrow$ File hash + timestamp + Officer ID committed to `EvidenceRegistry.sol`.
2. **AI Processing Pipeline**: Background workers fetch, decrypt in secure enclaves, extract entities/relations, populate Neo4j and Vector DB.
3. **Investigation Query**: Analyst queries graph or searches suspect. Every search query and graph expansion is hashed and signed into `ChainOfCustody.sol`.
4. **High-Security Warrants**: Wiretap / CDR deeper records require 2-of-3 multi-sig approval (`WarrantGate.sol` signed by Supervising Officer + Magistrate) before releasing decryption keys.

---

## Next Steps for Collaboration:
1. [ ] Confirm the preferred blockchain network environment (Private Consortium vs Testnet).
2. [ ] Confirm server/compute specifications for AI/NLP pipeline (Local GPU vs CPU/Cloud).
3. [ ] Define the primary input data formats for Phase 1 (e.g., CSV CDR logs, PDF FIRs, or simulated mock schemas).
4. [ ] Begin core pipeline scaffolding inside `blockd/`.
