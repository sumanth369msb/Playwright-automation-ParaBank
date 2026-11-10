# LLM-as-a-Judge Pipeline Architecture (Project Summary)

**Source Project:** `LLM-As-A-Judge`
**Purpose:** An automated pipeline for evaluating Generative AI outputs, calibrating against human baselines, and tracking production drift. This perfectly mirrors your ServiceNow experience.

---

## 1. Project Architecture & Flow

The core orchestration happens in `scripts/run_pipeline.py`, which is driven by a `config.yaml` file. The pipeline executes in **Three Distinct Phases**, serving as a complete CI/CD quality gate for GenAI features.

### Phase 1: Batch LLM-as-a-Judge Evaluation
In this phase, raw Generative AI responses are evaluated for quality. The framework supports two different "Judges":
1. **Ragas Engine:** Uses the out-of-the-box `ragas` library to calculate standard metrics (e.g., Faithfulness, Answer Relevancy).
2. **Custom Judge Engine:** Uses custom prompt templates (e.g., `faithfulness_judge_prompt.py`, `relevancy_judge_prompt.py`) to grade outputs on a **1-5 Likert Scale**. 
   - Connects to various model providers via OpenRouter (e.g., OpenAI, Gemini, Claude).

### Phase 2: Calibration Gate vs. Human Baseline
This is your **<5% Delta** talking point.
- The pipeline reads the LLM-generated scores (`llm_eval_results.json`) and compares them against a ground-truth dataset graded by human experts (`human_baseline.csv`).
- It calculates the `calibration_delta`.
- **CI/CD Blocker:** If the LLM judge is too lenient or too strict and exceeds the `max_acceptable_delta` threshold, it outputs: `[BLOCKED] CI/CD Pipeline Blocked: LLM Judge failed calibration gate.` 
- If it passes, the LLM Judge is certified for production use.

### Phase 3: Online Shadow Evaluation & Drift Monitoring
This represents the **AI Control Tower** you mentioned.
- Once the AI feature is live, this phase monitors production logs.
- Supports two observability backends:
  1. **Native Backend:** Logs shadow evaluations to a local database (`shadow_evals.db`).
  2. **LangSmith Backend:** Pushes trace data to LangSmith for visual dashboarding.
- **Drift Reporting:** It calculates moving averages of production quality scores over a lookback period (e.g., 7 days). If quality drops below the `drift_alert_threshold` (e.g., scores drop below 2.0/5.0), it triggers an alert.

---

## 2. How to Talk About This in Your Interview

When asked *"How did you automate evaluations at ServiceNow?"*, map your answer directly to this repo's structure:

> *"I built a 3-phase CI/CD quality pipeline in Python. 
> 
> **First**, I implemented an offline batch evaluator supporting both the RAGAS framework and custom LLM-as-a-Judge prompts using a 1-5 Likert scale.
> 
> **Second**, I built a Calibration Gate. Developers didn't inherently trust the LLM Judge, so my script cross-referenced the LLM's scores against a golden dataset graded by human experts. If the delta between the AI Judge and Human Judge was greater than 5%, it hard-failed the pipeline build. We prompt-tuned the judge until we consistently hit that <5% variance.
> 
> **Finally**, I implemented Phase 3: Online Shadow Evals. We piped production AI interactions into LangSmith (our AI Control Tower). I wrote scripts to run async drift reports looking back 7 days. If the average faithfulness dropped below our threshold, the dashboard alerted us, and we curated those edge cases right back into Phase 1's dataset."*

