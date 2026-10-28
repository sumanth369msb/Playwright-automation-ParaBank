# Senior SDET Master Guide: RAG Workflows, Testing Strategies, RCA & Performance

**Target Role:** Senior SDET / AI Quality Engineer @ HighLevel (GoHighLevel)  
**Profile Alignment:** Tailored to Kadali Sai Sumanth's ServiceNow & Gainsight Experience

---

## 1. The 4 Architectures of RAG (Focus on Your Gainsight Experience)

HighLevel will ask about RAG architecture. Frame your answer around the **Multi-Agent RAG Copilot** you tested at Gainsight.

### 1. Naive RAG (Basic - Avoid in Production)
- **Flow:** Query → Embed → Vector DB (Cosine Similarity) → Top-K Chunks → LLM
- **Limitations:** Low Context Precision, high hallucination rate, loses context if keywords don't match.

### 2. Advanced RAG (Your Gainsight Specialty)
- **Pre-retrieval:** Query expansion, intent classification.
- **Retrieval:** **Hybrid Search** (BM25 Lexical + HNSW Vector Search).
- **Post-retrieval:** **Reciprocal Rank Fusion (RRF)** to merge lexical/vector results, followed by **Cross-Encoder Rerankers** to re-score chunks.
- **Your Testing Angle:** Validating the reranker didn't drop context and managing the latency overhead (rerankers add 200-500ms).

### 3. Modular RAG (Routing & Agents)
- **Flow:** Query Router directs intent (e.g., FAQ → Cache, Billing → SQL, Docs → Vector DB).
- **Testing Angle:** Router misclassification. If the router sends a billing query to the vector DB, it hallucinates instead of fetching structured data.

### 4. GraphRAG (Knowledge Graphs)
- **Flow:** Entity-relationship extraction for multi-hop reasoning (e.g., "Which HighLevel agency manages client X and what plan are they on?").

---

## 2. Senior E2E Testing Strategy (The "Sumanth" Framework)

Frame your testing strategy exactly as you did at ServiceNow & Gainsight: **Retrieval Metrics vs. Generation Metrics.**

### Phase A: Retrieval Quality Testing (Context Validation)
Before the LLM even sees the data, you must test the search algorithm against a Golden Dataset.
1. **Context Precision:** Is the *most relevant* chunk at Rank-1? (Tested via RAGAS `context_precision`).
2. **Context Recall:** Did the retrieval pipeline fetch *all* necessary chunks to answer the query? (If it only fetches 2 out of 3 steps to configure a HighLevel workflow, the LLM will hallucinate step 3).
3. **Hybrid Search Validation:** Assert that exact-match SKUs or IDs trigger lexical (BM25) hits, while semantic questions trigger vector (HNSW) hits.

### Phase B: LLM Generation Testing (LLM-as-a-Judge)
1. **Faithfulness (No Hallucinations):** Assert that 100% of the LLM's claims can be traced back to the retrieved context. (RAGAS `faithfulness`).
2. **Answer Relevancy:** Assert the LLM actually answered the user's prompt and didn't just summarize the retrieved chunks.
3. **Human Calibration (<5% Delta):** *Crucial talking point.* Explain that you didn't just trust the LLM Judge blindly. You had human domain experts grade 100 responses, compared them to the LLM Judge scores, and prompt-tuned the Judge model until the discrepancy (delta) was under 5% before sign-off.

### Phase C: Data Isolation & Multi-Tenancy (HighLevel Critical)
- **Scenario:** Agency A asks for revenue stats.
- **Assertion:** Strict metadata filtering at the Vector DB query level (`{"agency_id": {"$eq": "AGENCY_A"}}`). Assert that **0 chunks** from Agency B are returned.

---

## 3. RAG Performance & NFR Testing (Load, Stress & Latency)

RAG has three independent latency bottlenecks. You test these using **k6** or **Locust**:

1. **TTFT (Time to First Token) & TPOT (Time Per Output Token):**
   - **Metric:** TTFT must be `< 1000ms`. TPOT must be `> 40 tokens/sec`.
   - **Test:** 100 Concurrent Users. Assert that API Gateway successfully streams chunks without buffering delays.
2. **Reranker Bottleneck Stress Testing:**
   - **Metric:** Reranker latency spikes under load.
   - **Test:** Push 500 QPS. Assert that if the Cross-Encoder Reranker times out (>400ms), the system implements a **Circuit Breaker** and degrades gracefully to standard vector similarity ranking.
3. **Redis Semantic Cache Hit Ratio:**
   - **Test:** Fire identical queries rapidly. Assert that 2nd query onwards bypasses the Embed/Vector/LLM chain entirely and returns from Redis in `< 50ms`.

---

## 4. Production Observability (Your ServiceNow AI Control Tower)

If they ask: *"How do you test in production?"* or *"What happens after release?"*

* **The AI Control Tower Strategy:**
  1. **Traceability:** Every query is tagged with OpenTelemetry (or LangSmith) to capture `Query -> Chunks -> LLM Output -> User Feedback`.
  2. **Drift & Edge Case Detection:** You monitor for high-latency queries or responses where the user clicked "Thumbs Down" or modified the generated text before using it.
  3. **Continuous Evaluation Loop:** You extract those failed real-world interactions, anonymize the PII, and curate them back into your Golden Dataset for the next CI/CD pipeline run.

---

## 5. Technical RCA & Debugging Cases (Interview Gold)

### Case 1: "The RAG bot hallucinates answers for long, complex documents."
* **Your RCA:**
  - Check LangSmith traces. Is the Context Recall low?
  - Root cause is usually **naive chunking** (e.g., splitting a 10-step guide into 5 chunks, and retrieval only grabbed 3).
  - **Fix:** Implement **Parent-Document Retrieval** (embed small 256-token child chunks for accurate search, but pass the full 2048-token parent document to the LLM).

### Case 2: "Query latency jumped from 800ms to 4.5 seconds. Debug it."
* **Your RCA:**
  - Look at distributed tracing. Break down the pipeline: Embedding (80ms) + Vector Search (50ms) + Reranker (3.5s 🚨) + LLM TTFT (600ms).
  - Root cause: The reranker is bottlenecking because someone misconfigured the vector search to pass `Top-100` chunks to the reranker instead of `Top-20`.
  - **Fix:** Hardcap reranker inputs to Top-15 chunks and autoscale the reranker worker pool.

### Case 3: "A customer uploaded a new pricing PDF, but the bot still quotes old prices."
* **Your RCA:**
  - Look at the retrieved chunks for the failing query.
  - Root cause: The ingestion pipeline appended the new vectors but failed to delete/deprecate the stale vectors from the old PDF.
  - **Fix:** Enforce document versioning metadata (`{"doc_version": "2.0", "status": "active"}`) during ingestion and filter on active status during search.

---

## 6. Behavioral Questions (Tailored to You)

### Q1: "Tell me about a complex challenge you solved in AI testing."
> *"At ServiceNow, the biggest challenge was proving to stakeholders that our automated LLM-as-a-Judge was actually accurate. Developers trusted human QA, but were skeptical of automated RAGAS scores. To solve this, I led a calibration initiative. I had human reviewers manually grade a diverse dataset of edge cases. Then we compared those human scores to our LLM judge scores. Initially, the LLM was a bit too lenient. We iteratively prompt-tuned the judge model and adjusted the temperature until the discrepancy (delta) between human and AI scores was consistently under 5%. Once we hit that <5% delta, we earned the team's trust to fully automate our CI/CD gating."*

### Q2: "How do you handle disagreements with developers on AI flakiness?"
> *"AI engineers often say 'LLMs are non-deterministic, so tests will be flaky.' I agree that token generation is probabilistic, but I argue that our **quality governance must be deterministic**. We don't write assertions for exact string matches. Instead, we establish statistical thresholds. We run our Golden Dataset at temperature 0.0, and assert on aggregate metrics—like Average Faithfulness must be $\ge 95\%$. Framing quality through empirical data and standard deviations builds trust and stops the 'it works on my machine' arguments."*
