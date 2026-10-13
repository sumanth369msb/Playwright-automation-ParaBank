# 🗺️ ML QE & AI/LLM Evaluation — Master Roadmap & Interview Guide

> **Author:** Kadali Sai Sumanth | **Target Role:** Principal AI/ML Quality Engineer / LLM Evaluation Specialist  
> **Last Updated:** October 2026

---

## 📋 Module Index

| # | Module | File | Core Focus |
|---|--------|------|------------|
| 1 | API Automation & Evaluations | [`01-API-AUTOMATION-AND-EVALUATIONS.md`](./01-API-AUTOMATION-AND-EVALUATIONS.md) | Playwright, PyTest, SSE streaming, schema validation, rate-limiting, retry patterns |
| 2 | RAG Workflows & Evaluations | [`02-RAG-WORKFLOWS-AND-EVALUATIONS.md`](./02-RAG-WORKFLOWS-AND-EVALUATIONS.md) | Retrieval pipeline testing, Hit Rate, MRR, Faithfulness, Answer Relevance |
| 3 | Metric Evaluations, Rubrics & Semantic Similarity | [`03-METRIC-EVALUATIONS-RUBRICS-SEMANTIC-SIMILARITY.md`](./03-METRIC-EVALUATIONS-RUBRICS-SEMANTIC-SIMILARITY.md) | Cosine similarity, sentence embeddings, multi-dimensional rubric design |
| 4 | LLM-as-a-Judge Metric Enforcement | [`04-LLM-AS-A-JUDGE.md`](./04-LLM-AS-A-JUDGE.md) | Judge prompt engineering, bias mitigation, calibration against human ground truth |
| 5 | Agentic AI Workflow Evaluations | [`05-AGENTIC-AI-WORKFLOW-EVALUATIONS.md`](./05-AGENTIC-AI-WORKFLOW-EVALUATIONS.md) | Multi-agent loops, tool-calling accuracy, hallucinated tool calls, state drift |
| 6 | Performance & Load Testing for LLMs/RAG | [`06-PERFORMANCE-LOAD-TESTING-LLMS.md`](./06-PERFORMANCE-LOAD-TESTING-LLMS.md) | TTFT, ITL, TPS, concurrency limits, GPU memory leaks |
| 7 | Online Evaluations & Real-Time Monitoring | [`07-ONLINE-EVALUATIONS-REALTIME-MONITORING.md`](./07-ONLINE-EVALUATIONS-REALTIME-MONITORING.md) | Production guardrails, drift detection, shadow deployments, telemetry |
| 8 | Core Coding & Algorithmic Efficiency | [`08-CORE-CODING-ALGORITHMIC-EFFICIENCY.md`](./08-CORE-CODING-ALGORITHMIC-EFFICIENCY.md) | Sliding window, two-pointer, token parsing, validation scripts |
| 9 | STT & STS Model Automation | [`09-STT-STS-MODEL-AUTOMATION.md`](./09-STT-STS-MODEL-AUTOMATION.md) | WER, CER, diarization, audio streaming, ambient noise robustness |

---

## 🏗️ Each Module Contains These 4 Mandatory Sections

1. **IN-DEPTH TECHNICAL ARCHITECTURE & TEST STRATEGY** — Core concepts, workflows, validation targets, test design patterns.
2. **TECHNICAL CODING & AUTOMATION PRACTICE (Python/Java)** — Production-ready code implementations and framework setups.
3. **SCENARIO-BASED DEBUGGING & ROOT CAUSE ANALYSIS (RCA)** — 2 realistic failure scenarios with step-by-step debugging workflows.
4. **TARGETED INTERVIEW QUESTIONS** — 2 advanced technical, 1 behavioral, 1 scenario-based with ideal candidate answers.

---

## 🎯 Learning Path (Recommended Order)

```
Phase 1 (Foundation)        → Module 8 (Coding) → Module 1 (API Automation)
Phase 2 (RAG & Evals Core)  → Module 2 (RAG) → Module 3 (Metrics/Rubrics) → Module 4 (LLM-as-Judge)
Phase 3 (Advanced AI QE)    → Module 5 (Agentic AI) → Module 9 (STT/STS)
Phase 4 (Scale & Prod)      → Module 6 (Performance) → Module 7 (Online Evals)
```

---

> **Note:** All code examples are production-grade. No placeholders, no stubs — every snippet is runnable.

