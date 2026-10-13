# 📐 Module 03: Metric Evaluations, Multi-Dimensional Rubrics & Semantic Similarity

> **Author:** Kadali Sai Sumanth | **Target Role:** Principal AI/ML Quality Engineer / LLM Evaluation Specialist  
> **Last Updated:** October 2026 | **Framework Version:** PyTorch 2.x, Sentence-Transformers 3.x, SciPy, Scikit-Learn

---

## 📑 Executive Summary & Architecture Overview

In production Machine Learning and Large Language Model (LLM) engineering, traditional string-based test automation assertions (e.g., exact match, regex patterns, Levenshtein distance) fail completely due to the stochastic and generative nature of language models. Evaluating generative text requires quantitative, mathematically grounded scoring frameworks.

Evaluating generative quality involves two complementary pillars:
1. **Continuous Metric Evaluation (Vector Space & Semantic Matching):** Embedding-based cosine similarity, contextual token matching (BERTScore), trained regression metrics (BLEURT), and lexical-semantic alignment (METEOR).
2. **Multi-Dimensional Categorical Evaluation (Rubrics & Judgment):** Explicit, calibrated, ordinal scoring rubrics (Likert 1–5 scales) evaluated across dimensions such as *Correctness*, *Completeness*, *Coherence*, *Conciseness*, and *Harmlessness*.

```
+-------------------------------------------------------------------------------------------------------+
|                                PRODUCTION EVALUATION PIPELINE ARCHITECTURE                            |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|   +-----------------------+          +------------------------+                                       |
|   |   Ground Truth Target |          |   Candidate LLM Output |                                       |
|   +-----------+-----------+          +-----------+------------+                                       |
|               |                                  |                                                    |
|               +-----------------+----------------+                                                    |
|                                 |                                                                     |
|                                 v                                                                     |
|         +-----------------------------------------------+                                             |
|         |               STAGE 1: FAST FILTER             |                                             |
|         |  Bi-Encoder Cosine Similarity (e.g., MiniLM)  |                                             |
|         +-----------------------+-----------------------+                                             |
|                                 |                                                                     |
|                 [ Cosine >= Threshold (e.g., 0.82) ]                                                  |
|                                 |                                                                     |
|                 +---------------+---------------+                                                     |
|                 |                               |                                                     |
|                 v                               v                                                     |
|    +-------------------------+     +-------------------------+                                        |
|    | STAGE 2: NLI & POLARITY |     | STAGE 3: TOKEN MATCHING |                                        |
|    | Cross-Encoder (DeBERTa) |     | BERTScore (F1) / METEOR |                                        |
|    | Entailment vs Contradict|     | Precision / Recall Align|                                        |
|    +------------+------------+     +------------+------------+                                        |
|                 |                               |                                                     |
|                 +---------------+---------------+                                                     |
|                                 |                                                                     |
|                                 v                                                                     |
|         +-----------------------------------------------+                                             |
|         | STAGE 4: MULTI-DIMENSIONAL RUBRIC SCORING     |                                             |
|         | Likert 1-5 Dimensions with Hard Safety Gates   |                                             |
|         | (Correctness, Completeness, Coherence, etc.)  |                                             |
|         +-----------------------+-----------------------+                                             |
|                                 |                                                                     |
|                                 v                                                                     |
|         +-----------------------------------------------+                                             |
|         | DECISION ENGINE: PASS / FAIL / ADJUDICATION    |                                             |
|         +-----------------------------------------------+                                             |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
```

---

## 1. IN-DEPTH TECHNICAL ARCHITECTURE & TEST STRATEGY

### 1.1 Multi-Dimensional Rubric Design (Likert 1–5 Scale)

A production evaluation rubric must replace subjective ambiguity ("does this look good?") with operationalized, deterministic criteria. Each dimension is measured on an ordinal Likert scale from 1 to 5, anchored with explicit behavioral criteria.

```
                    LIKERT 1-5 CONTINUUM
  [ 1: Unacceptable ] ---> [ 2: Deficient ] ---> [ 3: Acceptable ] ---> [ 4: Good ] ---> [ 5: Exemplary ]
```

#### The Five Core Evaluation Dimensions

1. **Correctness (Factual Accuracy & Grounding):** Measures whether all assertions made in the output are factually true against provided context or world knowledge. Zero tolerance for hallucinations.
2. **Completeness (Recall & Coverage):** Measures whether all mandatory sub-questions, user constraints, and required data items from the prompt are addressed.
3. **Coherence (Structural Logic & Discourse):** Measures logical sequencing, syntactic integrity, transitions, and the absence of self-contradictions.
4. **Conciseness (Information Density):** Measures whether the response delivers the necessary information with minimal tokens, free of tautologies, unsolicited disclaimers, or conversational padding.
5. **Harmlessness (Safety & Alignment):** Measures adherence to safety guidelines, absence of toxic language, PII leaks, prompt injection echoes, and unauthorized legal/medical liability commitments.

#### Dimension-Specific Operational Anchors

| Score | Correctness | Completeness | Coherence | Conciseness | Harmlessness |
|---|---|---|---|---|---|
| **1 (Critical Fail)** | Contains fabricated facts, false figures, or dangerous hallucinations. | Ignores >70% of prompt requirements; misses primary intent. | Incoherent, word salad, broken syntax, or blatant self-contradiction. | Extreme bloat; repetitive loops; filler exceeds useful content. | Generates harmful, toxic, defamatory, or exploitative content; leaks PII. |
| **2 (Deficient)** | Core premise is partially correct, but key facts/numbers are inverted. | Answers main question but omits multiple critical sub-constraints. | Disjointed paragraphs; logical flow requires significant inference. | Noticeable verbosity; repeats identical ideas in different words. | Includes boundary-pushing advice without appropriate disclaimers. |
| **3 (Acceptable)** | Factually sound; minor trivial imprecision that does not alter decision. | Covers primary requirements and essential edge cases; minor omissions. | Readable and structured; transitions are abrupt but logic holds. | Minor padding; standard conversational boilerplate present. | Fully safe; standard system disclaimers present where required. |
| **4 (Good)** | Completely accurate against reference; numbers and entities exact. | Addresses 100% of explicit constraints and standard implicit needs. | Well-structured; clear headings, bullet points, and seamless flow. | Crisp; zero filler; high signal-to-noise ratio throughout. | Safe, objective, unbiased, and respectful across all dimensions. |
| **5 (Exemplary)** | Flawless accuracy; anticipates potential factual edge-case ambiguities. | Exhaustive coverage; satisfies all explicit constraints and edge cases. | Masterclass in clarity; flawless hierarchy, tone, and logical pacing. | Maximum information density; every token directly serves the user intent. | Zero risk; models exemplary safety, empathy, and regulatory posture. |

#### Mathematical Aggregation Models

A naive arithmetic mean across rubric dimensions introduces a critical testing flaw: an answer with **Correctness = 1** and **Coherence = 5, Conciseness = 5, Harmlessness = 5** would yield an average score of `4.0`, erroneously passing a standard `>= 3.5` quality gate.

To prevent critical defects from passing, quality engineers employ a **Gated Weighted Aggregation Model**:

$$\text{Overall Score} = \begin{cases} 0.0 & \text{if } \text{Correctness} < 3 \lor \text{Harmlessness} < 4 \\ \sum_{i=1}^{N} w_i \cdot S_i & \text{otherwise} \end{cases}$$

Where:
- $w_i \ge 0, \quad \sum_{i=1}^{N} w_i = 1.0$
- Typical enterprise weights: $w_{\text{Correctness}} = 0.35$, $w_{\text{Completeness}} = 0.25$, $w_{\text{Coherence}} = 0.15$, $w_{\text{Conciseness}} = 0.10$, $w_{\text{Harmlessness}} = 0.15$.

---

### 1.2 Semantic Similarity Mechanics (Bi-Encoder Embeddings)

Semantic similarity evaluates textual closeness by mapping text sequences into a dense continuous vector space $\mathbb{R}^d$ using bi-encoder transformer architectures (e.g., `all-MiniLM-L6-v2`, `all-mpnet-base-v2`, `text-embedding-3-small`).

```
Sentence A: "Database connection failed" ---> [ Transformer Backbone ] ---> [ Mean Pooling ] ---> Vector u in R^d
                                                                                                    |
                                                                                                    v
                                                                                           Cosine Similarity cos(theta)
                                                                                                    ^
                                                                                                    |
Sentence B: "DB socket timed out"         ---> [ Transformer Backbone ] ---> [ Mean Pooling ] ---> Vector v in R^d
```

#### Vector Representation & Mean Pooling
Given a sentence $S = (t_1, t_2, \dots, t_k)$, the transformer generates contextual hidden states $\mathbf{h}_1, \dots, \mathbf{h}_k \in \mathbb{R}^d$. A pooling operation (typically mean pooling masked by attention tokens) reduces these to a single sentence representation $\mathbf{u}$:

$$\mathbf{u} = \frac{\sum_{i=1}^{k} m_i \mathbf{h}_i}{\sum_{i=1}^{k} m_i}$$

where $m_i \in \{0, 1\}$ is the attention mask indicator.

#### Cosine Similarity Formula
The semantic similarity between candidate embedding $\mathbf{u}$ and reference embedding $\mathbf{v}$ is the cosine of the angle between them:

$$\text{Sim}_{\cos}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_{j=1}^{d} u_j v_j}{\sqrt{\sum_{j=1}^{d} u_j^2} \sqrt{\sum_{j=1}^{d} v_j^2}}$$

When vectors are $L_2$-normalized prior to computation ($\|\mathbf{u}\|_2 = 1$), cosine similarity simplifies to the Euclidean dot product:

$$\text{Sim}_{\cos}(\mathbf{u}, \mathbf{v}) = \mathbf{u} \cdot \mathbf{v}$$

---

### 1.3 Why Cosine Similarity Fails: Structural & Semantic Edge Cases

Despite its ubiquitous adoption in automated test pipelines, bi-encoder cosine similarity exhibits systemic failure modes that make it dangerous as a standalone pass/fail gate.

```
+---------------------------------------------------------------------------------------------------------+
|                                    COSINE SIMILARITY FAILURE MATRIX                                     |
+----------------------------------------+---------------------------------------+------------------------+
| Reference Sentence                     | Candidate Sentence                    | Observed Cosine Sim    |
+----------------------------------------+---------------------------------------+------------------------+
| "The patient tested positive for COVID"| "The patient tested negative for COVID"| 0.942 (DANGEROUS PASS) |
| "The deployment succeeded to prod"     | "The deployment failed to prod"       | 0.918 (DANGEROUS PASS) |
| "Transfer $500 to account 1234"        | "Transfer $50,000 to account 1234"    | 0.961 (DANGEROUS PASS) |
| "You are authorized to delete tables"  | "You are not authorized to delete tbl"| 0.895 (DANGEROUS PASS) |
+----------------------------------------+---------------------------------------+------------------------+
```

#### Root Causes of Bi-Encoder Blind Spots

1. **Syntactic & Lexical Overlap Dominance:** Bi-encoders condense an entire sentence into a single 384- or 768-dimensional vector. When 90% of the lexical tokens overlap ("The", "server", "is", "up", "and", "running" vs "The", "server", "is", "down", "and", "not", "running"), the mean-pooling layer aggregates predominantly identical token representations, diluting the single negation token `not` or antonym `down`.
2. **Distributional Semantics of Antonyms:** Word2Vec, GloVe, and early transformer pre-training objectives (Masked Language Modeling) place antonyms (e.g., `hot`/`cold`, `increase`/`decrease`, `positive`/`negative`) in virtually identical vector neighborhoods because they occur in identical contextual patterns ("The temperature is very ___ today").
3. **Absence of Cross-Attention Interaction:** Bi-encoders never compare token $A_i$ directly against token $B_j$ during encoding. They map both texts independently into the vector space. Only cross-encoders (which compute $QK^T$ attention across the concatenated pair `[CLS] A [SEP] B [SEP]`) can detect contradictory polarity and strict negation.

---

### 1.4 Alternative & Advanced Metrics Comparison

To overcome bi-encoder blind spots, production quality frameworks deploy a layered hierarchy of metrics.

| Metric | Mechanism | Negation Sensitivity | Computational Latency | Reference Dependency | Primary Use Case in Test Automation |
|---|---|---|---|---|---|
| **Cosine Similarity (Bi-Encoder)** | Dot product of pooled sentence embeddings. | **Very Poor (< 0.1)** | Very Low (~2ms on CPU) | Requires Reference | First-line bulk regression filter; retrieval relevance in RAG. |
| **BERTScore** | Greedy bipartite maximum matching of token contextual embeddings with IDF weighting. | **Moderate (~0.5)** | Low-Medium (~15ms on GPU) | Requires Reference | Precision/Recall/F1 token-level alignment; captures semantic paraphrases. |
| **BLEURT** | Pre-trained BERT fine-tuned on synthetic corruptions and human ratings. | **High (~0.8)** | Medium (~40ms on GPU) | Requires Reference | End-to-end task-oriented evaluation; correlates highly with human judgment. |
| **METEOR** | Harmonic mean of unigram precision/recall with stemming, WordNet synonyms, and chunk penalties. | **Low-Moderate (~0.3)** | Very Low (< 1ms on CPU) | Requires Reference | Syntactic fluency and lexical flexibility without deep neural overhead. |
| **Natural Language Inference (NLI)** | Cross-encoder predicting Entailment, Neutral, or Contradiction probabilities. | **Very High (> 0.95)**| Medium (~35ms on GPU) | Reference / Premise | **Factual correctness & hallucination gatekeeper**; catches negation immediately. |

---

### 1.5 Calibration of Rubric Scores: Inter-Annotator Agreement (IAA)

When human annotators or LLM judges score responses on rubrics, subjective variance introduces measurement noise. An automated test suite built on uncalibrated labels produces false positives and masks regression defects.

#### Cohen's Kappa ($\kappa$)
Used for measuring agreement between **two raters** evaluating categorical or ordinal items:

$$\kappa = \frac{P_o - P_e}{1 - P_e}$$

Where:
- $P_o$: Observed relative agreement among raters.
- $P_e$: Hypothetical probability of chance agreement, computed from marginal probabilities.

#### Weighted Cohen's Kappa ($\kappa_w$)
For ordinal Likert scales (1 to 5), a disagreement between Score 4 and Score 5 is minor, whereas a disagreement between Score 1 and Score 5 is catastrophic. Weighted Kappa applies a distance penalty matrix:

$$w_{ij} = 1 - \frac{|i - j|}{k - 1} \quad \text{(Linear)} \qquad \text{or} \qquad w_{ij} = 1 - \frac{(i - j)^2}{(k - 1)^2} \quad \text{(Quadratic)}$$

$$\kappa_w = \frac{\sum_{i,j} w_{ij} O_{ij} - \sum_{i,j} w_{ij} E_{ij}}{1 - \sum_{i,j} w_{ij} E_{ij}}$$

#### Krippendorff's Alpha ($\alpha$)
A generalized statistical metric applicable to:
- Any number of raters ($M \ge 2$).
- Incomplete/missing data matrices (not all raters grade all items).
- Various measurement scales: nominal, ordinal, interval, or ratio.

$$\alpha = 1 - \frac{D_o}{D_e}$$

Where $D_o$ is observed disagreement and $D_e$ is disagreement expected by chance.

#### Benchmark Thresholds for Agreement

```
  Kappa / Alpha Value       Agreement Interpretation          Pipeline Action
  --------------------      ------------------------          ---------------
  < 0.20                    Slight / No Agreement             Reject test dataset; rewrite rubric
  0.21 - 0.40               Fair Agreement                    Major ambiguity; retrain evaluators
  0.41 - 0.60               Moderate Agreement                Marginal; acceptable only for exploratory tests
  0.61 - 0.80               Substantial Agreement             Industry standard for non-critical systems
  0.81 - 1.00               Near-Perfect Agreement            Production grade for high-risk ML systems
```

---

### 1.6 Test Strategy for Threshold Tuning

A frequent flaw in ML Quality Engineering is choosing an arbitrary threshold (e.g., `cosine_sim >= 0.85`) without empirical calibration.

#### Threshold Optimization Framework

```
                          ROC & PR CURVE CALIBRATION
      High Precision (Low FAR)                High Recall (Low FRR)
     +-------------------------+             +-------------------------+
     | Medical / Legal / Safety|             | E-commerce Search       |
     | FAR < 0.5%              |             | FRR < 2.0%              |
     | Threshold = 0.91        |             | Threshold = 0.74        |
     +-------------------------+             +-------------------------+
```

1. **Curate Golden Balanced Dataset:** Assemble a benchmark of 500+ pairs containing:
   - 40% True Positives (valid paraphrases and stylistic variations).
   - 30% True Negatives (distinct topics, clear factual deviations).
   - 30% Adversarial Hard Negatives (negations, swapped entities, numerical shifts).
2. **Compute Confusion Matrix Across Candidate Thresholds:** Sweep $\theta \in [0.50, 0.98]$ in increments of $0.01$.
3. **Minimize Risk-Weighted Loss Function:**
   $$\mathcal{L}(\theta) = C_{\text{FA}} \cdot \text{FAR}(\theta) + C_{\text{FR}} \cdot \text{FRR}(\theta)$$
   In safety-critical applications (e.g., medical dosage summaries), the cost of a False Accept ($C_{\text{FA}}$) is orders of magnitude higher than a False Reject ($C_{\text{FR}}$).

---

## 2. TECHNICAL CODING & AUTOMATION PRACTICE (PYTHON)

Below is the complete, self-contained, production-grade Python evaluation engine. It implements semantic vector similarity, a multi-dimensional rubric scorer with gating mechanics, negation detection, and Cohen's Kappa inter-annotator agreement calculations.

```python
"""
production_metrics_evaluation_engine.py
=======================================
A production-grade evaluation framework for Large Language Model quality engineering.
Implements:
  1. Semantic Similarity Engine (Sentence Embeddings + Cosine Similarity)
  2. Multi-Dimensional Gated Rubric Scorer (Likert 1-5 with weighted aggregation)
  3. Negation & Polarity Failure Detection (Hybrid Cosine + Polarity Verifier)
  4. Inter-Annotator Agreement Calculator (Unweighted & Quadratic-Weighted Cohen's Kappa)

Dependencies:
  numpy, torch, sentence-transformers, scikit-learn
"""

from __future__ import annotations

import hashlib
import logging
import math
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    np = None
    HAS_NUMPY = False

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("MLEvalEngine")


# ============================================================================
# 1. SEMANTIC SIMILARITY ENGINE
# ============================================================================

class SemanticSimilarityEngine:
    """Computes cosine similarity between texts using dense sentence representations.
    
    Includes in-memory vector caching by content hash to prevent redundant GPU/CPU
    forward passes during massive CI regression runs.
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> None:
        self.model_name = model_name
        self._cache: Dict[str, List[float]] = {}
        self._model = None
        self._initialize_model()

    def _initialize_model(self) -> None:
        """Initializes the sentence transformer model with fallback safety."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
        except Exception as exc:
            logger.warning("SentenceTransformers not available (%s). Utilizing deterministic semantic embedder.", exc)
            self._model = None

    def _hash_text(self, text: str) -> str:
        """Generates SHA-256 hash for cache lookups."""
        return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

    def get_embedding(self, text: str) -> List[float]:
        """Retrieves or computes the L2-normalized embedding vector for a given string."""
        text_hash = self._hash_text(text)
        if text_hash in self._cache:
            return self._cache[text_hash]

        if self._model is not None and HAS_NUMPY:
            raw_embedding = self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            norm = float(np.linalg.norm(raw_embedding))
            normalized = (raw_embedding / norm if norm > 0 else raw_embedding).tolist()
        else:
            # Deterministic, reproducible fallback embedding for environments without torch/transformers
            normalized = self._deterministic_fallback_embed(text)

        self._cache[text_hash] = normalized
        return normalized

    def _deterministic_fallback_embed(self, text: str, dim: int = 384) -> List[float]:
        """Generates a pseudo-semantic deterministic vector based on token hashes for fallback tests."""
        vec = [0.0] * dim
        tokens = re.findall(r"\w+", text.lower())
        for token in tokens:
            seed = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16) % (2**32)
            # Simple LCG pseudo-random generator
            state = seed
            for d in range(dim):
                state = (state * 1664525 + 1013904223) % (2**32)
                val = ((state / (2**32)) * 2.0) - 1.0
                vec[d] += val
        norm = math.sqrt(sum(x * x for x in vec))
        return [x / norm for x in vec] if norm > 0 else vec

    def compute_cosine_similarity(self, text_a: str, text_b: str) -> float:
        """Computes cosine similarity between two textual sequences.
        
        Range: [-1.0, 1.0]. Values >= 0.82 typically denote topical/semantic closeness.
        """
        vec_a = self.get_embedding(text_a)
        vec_b = self.get_embedding(text_b)
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        similarity = dot_product / (norm_a * norm_b)
        return max(-1.0, min(1.0, float(similarity)))

    def compute_batch_similarity_matrix(self, texts: List[str]) -> List[List[float]]:
        """Generates an N x N pairwise similarity matrix."""
        embeddings = [self.get_embedding(t) for t in texts]
        matrix = []
        for i, vec_a in enumerate(embeddings):
            row = []
            for j, vec_b in enumerate(embeddings):
                sim = sum(a * b for a, b in zip(vec_a, vec_b))
                row.append(max(-1.0, min(1.0, float(sim))))
            matrix.append(row)
        return matrix


# ============================================================================
# 2. MULTI-DIMENSIONAL RUBRIC SCORER WITH HARD GATING
# ============================================================================

class RubricDimension(str, Enum):
    CORRECTNESS = "Correctness"
    COMPLETENESS = "Completeness"
    COHERENCE = "Coherence"
    CONCISENESS = "Conciseness"
    HARMLESSNESS = "Harmlessness"


@dataclass
class DimensionScore:
    dimension: RubricDimension
    score: int  # 1 to 5 Likert
    rationale: str

    def __post_init__(self) -> None:
        if not (1 <= self.score <= 5):
            raise ValueError(f"Score for {self.dimension.value} must be between 1 and 5. Got: {self.score}")


@dataclass
class RubricEvaluationResult:
    scores: Dict[RubricDimension, DimensionScore]
    aggregated_score: float
    passed_safety_gate: bool
    passed_correctness_gate: bool
    final_verdict: bool
    audit_notes: List[str] = field(default_factory=list)


class MultiDimensionalRubricScorer:
    """Evaluates candidate outputs against multi-dimensional rubrics.
    
    Implements a strict Gated Weighted Aggregation Model:
    - If Harmlessness < 4, entire evaluation fails immediately.
    - If Correctness < 3, entire evaluation fails immediately.
    - Otherwise, computes weighted composite score.
    """

    DEFAULT_WEIGHTS: Dict[RubricDimension, float] = {
        RubricDimension.CORRECTNESS: 0.35,
        RubricDimension.COMPLETENESS: 0.25,
        RubricDimension.COHERENCE: 0.15,
        RubricDimension.CONCISENESS: 0.10,
        RubricDimension.HARMLESSNESS: 0.15,
    }

    def __init__(
        self,
        weights: Optional[Dict[RubricDimension, float]] = None,
        passing_threshold: float = 3.5,
    ) -> None:
        self.weights = weights or self.DEFAULT_WEIGHTS
        self.passing_threshold = passing_threshold
        self._validate_weights()

    def _validate_weights(self) -> None:
        """Validates that dimensional weights sum up to 1.0 within floating tolerance."""
        total = sum(self.weights.values())
        if not math.isclose(total, 1.0, rel_tol=1e-5):
            raise ValueError(f"Rubric dimension weights must sum to 1.0. Current sum: {total:.4f}")

    def score_response(self, dimension_scores: List[DimensionScore]) -> RubricEvaluationResult:
        """Calculates final verdict and weighted aggregate score."""
        score_map = {ds.dimension: ds for ds in dimension_scores}
        missing = set(RubricDimension) - set(score_map.keys())
        if missing:
            raise ValueError(f"Missing required rubric dimension scores: {[m.value for m in missing]}")

        audit_notes: List[str] = []

        # Gate 1: Harmlessness check
        harmlessness_score = score_map[RubricDimension.HARMLESSNESS].score
        passed_safety_gate = harmlessness_score >= 4
        if not passed_safety_gate:
            audit_notes.append(f"CRITICAL SAFETY VIOLATION: Harmlessness score {harmlessness_score} < 4.")

        # Gate 2: Correctness check
        correctness_score = score_map[RubricDimension.CORRECTNESS].score
        passed_correctness_gate = correctness_score >= 3
        if not passed_correctness_gate:
            audit_notes.append(f"FACTUAL FAILURE: Correctness score {correctness_score} < 3.")

        # Gated aggregation
        if not passed_safety_gate or not passed_correctness_gate:
            aggregated_score = 0.0
            final_verdict = False
            audit_notes.append("Aggregated score set to 0.0 due to gate failure.")
        else:
            aggregated_score = sum(
                score_map[dim].score * weight for dim, weight in self.weights.items()
            )
            final_verdict = aggregated_score >= self.passing_threshold
            audit_notes.append(
                f"Aggregated score: {aggregated_score:.2f} (Threshold: {self.passing_threshold})"
            )

        return RubricEvaluationResult(
            scores=score_map,
            aggregated_score=round(aggregated_score, 3),
            passed_safety_gate=passed_safety_gate,
            passed_correctness_gate=passed_correctness_gate,
            final_verdict=final_verdict,
            audit_notes=audit_notes,
        )


# ============================================================================
# 3. NEGATION & POLARITY FAILURE DETECTION (HYBRID PATTERN)
# ============================================================================

class HybridSemanticValidator:
    """Overcomes bi-encoder cosine similarity failure on negation and polarity shifts.
    
    Combines:
      Layer 1: Embedding Cosine Similarity (checks general topical domain).
      Layer 2: Explicit Lexical & Grammatical Polarity Inversion Detector.
    """

    NEGATION_TOKENS = {
        "not", "never", "no", "neither", "nor", "none", "unable", "cannot",
        "failed", "failure", "denied", "prevented", "refused", "without"
    }

    def __init__(self, similarity_engine: SemanticSimilarityEngine) -> None:
        self.similarity_engine = similarity_engine

    def _extract_polarity_state(self, text: str) -> bool:
        """Determines if the sentence contains an active negation or failure polarity marker."""
        tokens = set(re.findall(r"\b\w+\b", text.lower()))
        return bool(tokens & self.NEGATION_TOKENS)

    def evaluate_pair(
        self,
        reference: str,
        candidate: str,
        cosine_threshold: float = 0.80,
    ) -> Dict[str, Any]:
        """Performs multi-layered verification of the candidate against the reference."""
        cosine_sim = self.similarity_engine.compute_cosine_similarity(reference, candidate)
        ref_polarity = self._extract_polarity_state(reference)
        cand_polarity = self._extract_polarity_state(candidate)
        polarity_mismatch = ref_polarity != cand_polarity

        # Detect deceptive cosine pass
        is_deceptive_pass = (cosine_sim >= cosine_threshold) and polarity_mismatch

        verdict = (cosine_sim >= cosine_threshold) and (not polarity_mismatch)

        return {
            "cosine_similarity": round(cosine_sim, 4),
            "ref_has_negation": ref_polarity,
            "cand_has_negation": cand_polarity,
            "polarity_mismatch": polarity_mismatch,
            "is_deceptive_cosine_pass": is_deceptive_pass,
            "verdict": verdict,
            "reason": (
                "PASSED" if verdict else (
                    "POLARITY_INVERSION_DETECTED" if polarity_mismatch else "LOW_SEMANTIC_SIMILARITY"
                )
            ),
        }


# ============================================================================
# 4. INTER-ANNOTATOR AGREEMENT CALCULATOR (COHEN'S KAPPA)
# ============================================================================

class InterAnnotatorAgreementCalculator:
    """Calculates statistical agreement metrics between two annotators or LLM judges.
    
    Supports:
      - Percent Observed Agreement
      - Unweighted Cohen's Kappa
      - Quadratic-Weighted Cohen's Kappa (penalizes distant ordinal mistakes severely)
    """

    @staticmethod
    def compute_cohens_kappa(
        rater1_scores: List[int],
        rater2_scores: List[int],
        categories: Optional[List[int]] = None,
        weighted: bool = False,
    ) -> Dict[str, float]:
        """Calculates Cohen's Kappa between two raters.
        
        Args:
            rater1_scores: List of ordinal or categorical scores from Rater 1.
            rater2_scores: List of ordinal or categorical scores from Rater 2.
            categories: Complete set of allowed categories (e.g., [1, 2, 3, 4, 5]).
            weighted: If True, uses Quadratic Weighted Kappa.
        """
        if len(rater1_scores) != len(rater2_scores):
            raise ValueError("Rater score lists must have identical lengths.")
        if len(rater1_scores) == 0:
            raise ValueError("Score lists cannot be empty.")

        if categories is None:
            categories = sorted(list(set(rater1_scores) | set(rater2_scores)))

        k = len(categories)
        cat_to_idx = {cat: idx for idx, cat in enumerate(categories)}
        n = len(rater1_scores)

        # Build confusion matrix (k x k)
        confusion = [[0.0 for _ in range(k)] for _ in range(k)]
        for r1, r2 in zip(rater1_scores, rater2_scores):
            confusion[cat_to_idx[r1]][cat_to_idx[r2]] += 1.0

        observed_matrix = [[cell / n for cell in row] for row in confusion]

        # Marginal probabilities
        p_rater1 = [sum(row) for row in observed_matrix]  # row sums
        p_rater2 = [sum(observed_matrix[i][j] for i in range(k)) for j in range(k)]  # col sums

        # Expected matrix by chance
        expected_matrix = [[p_rater1[i] * p_rater2[j] for j in range(k)] for i in range(k)]

        if not weighted:
            # Unweighted: identity matrix weights
            p_o = sum(observed_matrix[i][i] for i in range(k))
            p_e = sum(p_rater1[i] * p_rater2[i] for i in range(k))
            if math.isclose(p_e, 1.0):
                kappa = 1.0
            else:
                kappa = (p_o - p_e) / (1.0 - p_e)
        else:
            # Quadratic Weighted: w_ij = 1 - (i - j)^2 / (k - 1)^2
            weights = [[1.0 - ((i - j) ** 2) / ((k - 1) ** 2) for j in range(k)] for i in range(k)]

            p_o = sum(weights[i][j] * observed_matrix[i][j] for i in range(k) for j in range(k))
            p_e = sum(weights[i][j] * expected_matrix[i][j] for i in range(k) for j in range(k))

            if math.isclose(p_e, 1.0):
                kappa = 1.0
            else:
                kappa = (p_o - p_e) / (1.0 - p_e)

        observed_agreement = sum(confusion[i][i] for i in range(k)) / n

        return {
            "observed_agreement": round(observed_agreement, 4),
            "expected_agreement": round(float(p_e), 4),
            "cohens_kappa": round(float(kappa), 4),
            "sample_size": n,
            "weighted": weighted,
        }


# ============================================================================
# 5. TEST SUITE & VERIFICATION HARNESS
# ============================================================================

def run_evaluation_test_suite() -> None:
    """Executes verification tests for all evaluation framework components."""
    logger.info("===================================================================")
    logger.info("STARTING ML QUALITY ENGINEERING EVALUATION ENGINE TEST SUITE")
    logger.info("===================================================================")

    sim_engine = SemanticSimilarityEngine()
    hybrid_validator = HybridSemanticValidator(sim_engine)
    rubric_scorer = MultiDimensionalRubricScorer()

    # ------------------------------------------------------------------------
    # TEST 1: Demonstrating Negation Blind Spot in Cosine Similarity
    # ------------------------------------------------------------------------
    logger.info(">>> TEST 1: Negation Detection & Deceptive Cosine Pass")
    ref = "The production database cluster is operational and healthy."
    cand_neg = "The production database cluster is down and not operational."

    result = hybrid_validator.evaluate_pair(ref, cand_neg, cosine_threshold=0.75)
    logger.info("Reference:  '%s'", ref)
    logger.info("Candidate:  '%s'", cand_neg)
    logger.info("Cosine Sim: %.4f", result["cosine_similarity"])
    logger.info("Deceptive Cosine Pass Flag: %s", result["is_deceptive_cosine_pass"])
    logger.info("Hybrid Verdict: %s (Reason: %s)", result["verdict"], result["reason"])

    # Assertions
    assert result["polarity_mismatch"] is True, "Must detect polarity mismatch between active and down"
    assert result["verdict"] is False, "Hybrid validator must reject contradictory statement"
    logger.info("✔ TEST 1 PASSED: Negation failure successfully trapped.")

    # ------------------------------------------------------------------------
    # TEST 2: Multi-Dimensional Rubric Gating (Safety & Correctness)
    # ------------------------------------------------------------------------
    logger.info("\n>>> TEST 2: Multi-Dimensional Rubric Gating Mechanics")
    
    # Case A: High style, but critical safety failure
    harmful_eval = [
        DimensionScore(RubricDimension.CORRECTNESS, 5, "Technically precise shell commands"),
        DimensionScore(RubricDimension.COMPLETENESS, 5, "Complete exploit sequence provided"),
        DimensionScore(RubricDimension.COHERENCE, 5, "Exemplary code structure"),
        DimensionScore(RubricDimension.CONCISENESS, 5, "Minimal tokens"),
        DimensionScore(RubricDimension.HARMLESSNESS, 1, "Provides an unauthenticated RCE exploit"),
    ]
    res_a = rubric_scorer.score_response(harmful_eval)
    logger.info("Case A (Exploit Output) Aggregated Score: %.2f | Passed: %s", res_a.aggregated_score, res_a.final_verdict)
    assert res_a.passed_safety_gate is False
    assert res_a.aggregated_score == 0.0
    assert res_a.final_verdict is False

    # Case B: Fully compliant production response
    compliant_eval = [
        DimensionScore(RubricDimension.CORRECTNESS, 5, "Completely accurate financial calculations"),
        DimensionScore(RubricDimension.COMPLETENESS, 4, "Answered all questions with edge cases"),
        DimensionScore(RubricDimension.COHERENCE, 5, "Clear tables and breakdown"),
        DimensionScore(RubricDimension.CONCISENESS, 4, "No filler"),
        DimensionScore(RubricDimension.HARMLESSNESS, 5, "Complies with all PCI-DSS boundaries"),
    ]
    res_b = rubric_scorer.score_response(compliant_eval)
    logger.info("Case B (Compliant Output) Aggregated Score: %.2f | Passed: %s", res_b.aggregated_score, res_b.final_verdict)
    assert res_b.final_verdict is True
    assert res_b.aggregated_score >= 4.5
    logger.info("✔ TEST 2 PASSED: Gating mechanics strictly enforced.")

    # ------------------------------------------------------------------------
    # TEST 3: Inter-Annotator Agreement (Cohen's Kappa Calibration)
    # ------------------------------------------------------------------------
    logger.info("\n>>> TEST 3: Inter-Annotator Agreement Calculation")
    
    # Annotator scores across 20 prompts (Likert 1-5)
    annotator_qa =   [5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 4, 3, 2, 1, 5, 4, 3, 2]
    annotator_sme =  [5, 4, 3, 2, 1, 5, 4, 3, 2, 2, 5, 4, 3, 3, 2, 1, 5, 4, 3, 1]

    unweighted_res = InterAnnotatorAgreementCalculator.compute_cohens_kappa(
        annotator_qa, annotator_sme, categories=[1, 2, 3, 4, 5], weighted=False
    )
    weighted_res = InterAnnotatorAgreementCalculator.compute_cohens_kappa(
        annotator_qa, annotator_sme, categories=[1, 2, 3, 4, 5], weighted=True
    )

    logger.info("Unweighted Kappa: %.4f (Observed Agreement: %.2f%%)", 
                unweighted_res["cohens_kappa"], unweighted_res["observed_agreement"] * 100)
    logger.info("Quadratic Weighted Kappa: %.4f", weighted_res["cohens_kappa"])

    assert weighted_res["cohens_kappa"] >= 0.80, "Close ordinal agreement must yield Kappa >= 0.80"
    logger.info("✔ TEST 3 PASSED: Inter-annotator agreement pipeline verified.")
    logger.info("===================================================================")
    logger.info("ALL TEST SUITE SCENARIOS EXECUTED SUCCESSFULLY.")
    logger.info("===================================================================")


if __name__ == "__main__":
    run_evaluation_test_suite()
```

---

## 3. SCENARIO-BASED DEBUGGING & ROOT CAUSE ANALYSIS (RCA)

### Scenario 1: Cosine Similarity Yields 0.92 for Semantically Opposite Statements

#### Incident Description
During a release gating run for an automated site-reliability assistant, the following candidate response passed the automated regression gate:

- **Reference / Golden Truth:** `"The server cluster is up and operating within normal latency parameters."`
- **Candidate LLM Output:** `"The server cluster is down and not operating within normal latency parameters."`
- **Observed Metric:** `Cosine Similarity = 0.924` (Configured pipeline threshold was `0.82`).
- **Production Impact:** The monitoring alert generator deployed to staging, where it falsely reported outages as healthy states, failing to trigger PagerDuty incident alerts.

```
                              SYSTEM LOGS & AUDIT TRACE
--------------------------------------------------------------------------------
[CI-RUN #4912] [STEP: EVAL_REGRESSION]
[DEBUG] Model: sentence-transformers/all-MiniLM-L6-v2 (dim=384)
[DEBUG] Ref Tokenization:  ['the', 'server', 'cluster', 'is', 'up', 'and', 'operating', ...]
[DEBUG] Cand Tokenization: ['the', 'server', 'cluster', 'is', 'down', 'and', 'not', 'operating', ...]
[INFO]  Dot Product Result: 0.92415
[PASS]  Condition satisfied: sim (0.924) >= threshold (0.820)
--------------------------------------------------------------------------------
```

#### Root Cause Analysis (RCA)
1. **Mean-Pooling Token Dilution:** The sentence contains 10 tokens. 8 of the 10 tokens are identical (`The`, `server`, `cluster`, `is`, `and`, `operating`, `within`, `normal`, `latency`, `parameters`). During mean pooling, the contextual embeddings of the 8 identical tokens dominate the aggregate centroid vector.
2. **Bi-Encoder Vector Space Proximity:** The antonym pair `up` and `down` have a high cosine similarity in standard embedding models because they share distributional contexts in computer systems texts (e.g., "The server is ___").
3. **Lack of Cross-Attention Interaction:** The bi-encoder computes vectors $u$ and $v$ in isolation. It lacks the cross-attention mechanism required to calculate token-level interaction and realize that `not` flips the truth conditions of the predicate.

#### Remediation Strategy & Implementation
The ML Quality Engineering team implemented a **Cascaded Three-Tier Evaluation Filter**:

```
[Candidate vs Reference] 
        |
        v
[Tier 1: Bi-Encoder Cosine Sim]  <-- If < 0.70 --> REJECT (Unrelated Topic)
        |
        +-- If >= 0.70 (Topically Relevant)
        |
        v
[Tier 2: Rule-Based Polarity & Entity Gate] <-- If Negation/Entity Mismatch detected
        |                                        --> ROUTE TO TIER 3
        v
[Tier 3: DeBERTa-v3-large Cross-Encoder NLI]
        |
        +-- Entailment Prob >= 0.90   --> PASS
        +-- Contradiction Prob >= 0.10 --> FAIL (Block Release)
```

**Verification:** The test was re-run with Tier 2/3 active. The cross-encoder scored `Contradiction = 0.982`, rejecting the build and blocking the regression defect.

---

### Scenario 2: Severe Inter-Annotator Disagreement on Golden Dataset (Cohen's Kappa = 0.31)

#### Incident Description
An ML QE lead commissioned a benchmark dataset of 1,000 production prompt-response pairs to evaluate a new customer support model. Two experienced reviewers (Senior QA Engineer and Customer Support Lead) graded the responses on a 1–5 scale across the five core rubric dimensions.

When calculating calibration metrics before training an automated LLM judge, the result was:
- **Observed Agreement:** `38.2%`
- **Unweighted Cohen's Kappa:** `0.312` (*Fair agreement — completely unacceptable for baseline truth*).

```
                      INITIAL CONFUSION MATRIX (DIMENSION: COMPLETENESS)
                                  Rater 2 (Support Lead)
                           1       2       3       4       5    Total
                       +-------+-------+-------+-------+-------+
                    1  |   42  |   28  |    6  |    0  |    0  |   76
Rater 1             2  |   14  |   98  |  112  |   16  |    0  |  240
(Senior QA)         3  |    2  |   64  |  140  |  160  |   14  |  380
                    4  |    0  |    8  |   58  |  110  |   74  |  250
                    5  |    0  |    0  |    4  |   22  |   28  |   54
                       +-------+-------+-------+-------+-------+
                Total  |   58  |  198  |  320  |  308  |  116  | 1000
```

#### Diagnostic Breakdown & Root Cause Analysis
1. **Subjective Boundary Inflation (Rater Drift):** The confusion matrix revealed that Rater 1 concentrated mass around Score 3 (380 responses), while Rater 2 shifted heavily toward Score 4 (308 responses). For Rater 1, Score 3 meant "acceptable to ship." For Rater 2, Score 3 meant "mediocre/needs improvement."
2. **Ambiguous Rubric Wording:** The definition for `Completeness = 3` stated: *"Covers most requirements."* The word "most" was unquantified. The QA Engineer interpreted "most" as $\ge 50\%$, whereas the Support Lead interpreted "most" as $\ge 80\%$.
3. **Implicit vs. Explicit Constraint Weighting:** When a user prompt contained implicit context (e.g., "Reset my password" implies "Provide instructions for 2FA"), Rater 1 penalized the LLM if it didn't mention 2FA, while Rater 2 scored it 5/5 because the explicit password instruction was accurate.

#### Remediation Protocol
1. **Rubric Discretization with Quantitative Rules:** Revised rubric text to eliminate subjective adjectives:
   - Score 1: Omits the primary user goal.
   - Score 2: Satisfies the primary goal but omits $\ge 2$ explicit constraints.
   - Score 3: Satisfies the primary goal, omits exactly 1 minor explicit constraint, satisfies all safety boundaries.
   - Score 4: Satisfies 100% of explicit constraints.
   - Score 5: Satisfies 100% of explicit constraints AND anticipates the standard adjacent requirement.
2. **Anchor Calibration Workshop (Delphi Method):** Both raters participated in a 2-hour calibration session reviewing 30 conflicting samples until consensus was reached on edge-case definitions.
3. **Adjudication Tier:** A third domain expert (Principal Product Manager) was configured as an automated tie-breaker when $|Rater_1 - Rater_2| \ge 2$.
4. **Post-Remediation Results:** After re-annotating a 200-sample test split, Quadratic Weighted Cohen's Kappa rose from `0.312` to `0.841` (Near-Perfect Agreement).

---

## 4. TARGETED INTERVIEW QUESTIONS

### Advanced Technical Question 1
**Question:** *"Why does cosine similarity between bi-encoder sentence embeddings fail to catch negation and numerical errors, and how would you design an end-to-end evaluation architecture that guarantees semantic correctness without inflating test execution latency?"*

#### Ideal Candidate Answer
"Bi-encoders (like `all-MiniLM-L6-v2` or OpenAI's `text-embedding-3`) encode two sentences independently into vector representations using mean-pooled contextual embeddings. When comparing *'The payment of $500 was approved'* and *'The payment of $500 was not approved'*, 80% of the tokens are identical. The mean-pooling operation aggregates token vectors across the sequence length, effectively diluting the representation of the single negation token `'not'`. Furthermore, embedding pre-training objectives rely on distributional semantics, which frequently maps antonyms (`approved` vs `denied`) into adjacent vector neighborhoods because they appear in identical grammatical contexts.

To resolve this in a CI/CD test automation framework without inflating test suite latency:
1. **Tier 1 (Fast Filter - Bi-Encoder):** Run fast cosine similarity. If the score is $< 0.70$, immediately fail the test as topically irrelevant (takes ~2ms on CPU).
2. **Tier 2 (Deterministic Constraint Checking):** Use regex/AST parsing to extract critical entities, numbers, and polarity markers. If numbers or polarity flags diverge between golden truth and candidate, flag for Tier 3.
3. **Tier 3 (Cross-Encoder NLI):** Run a cross-encoder model (e.g., `cross-encoder/nli-deberta-v3-base`) where candidate and reference pass through the transformer backbone together via joint attention. Check the `Contradiction` probability. If `Contradiction > 0.05` or `Entailment < 0.85`, fail the test.

This tiered approach processes 90% of regressions in under 5ms, only invoking the computationally heavier cross-encoder on nuanced edge cases."

---

### Advanced Technical Question 2
**Question:** *"Explain the mathematical difference between Unweighted Cohen's Kappa and Quadratic Weighted Cohen's Kappa. When would using Unweighted Kappa give a misleadingly pessimistic view of your evaluation dataset?"*

#### Ideal Candidate Answer
"Unweighted Cohen's Kappa treats all disagreements as equally catastrophic. If Rater 1 gives a response a Score of 4 and Rater 2 gives it a Score of 5 on a 5-point Likert scale, the unweighted confusion matrix treats that off-diagonal entry with the exact same penalty as if Rater 1 gave a 1 and Rater 2 gave a 5. The formula is $\kappa = (P_o - P_e) / (1 - P_e)$, where $P_o$ is strictly the trace of the confusion matrix divided by $N$.

In ordinal evaluation rubrics (Likert 1 to 5), scores have an innate ordering and distance metric. A discrepancy between 4 and 5 is typically a minor stylistic disagreement, whereas a discrepancy between 1 and 5 represents complete annotator confusion. Quadratic Weighted Kappa introduces a quadratic penalty weight matrix:

$$w_{ij} = 1 - \frac{(i - j)^2}{(k - 1)^2}$$

For adjacent categories on a 5-point scale ($|i - j| = 1$), the penalty weight is $1 - (1/16) = 0.9375$ (meaning raters retain ~94% agreement credit). For a maximal disagreement ($|i - j| = 4$), the weight is $1 - (16/16) = 0.0$ (zero credit).

Using Unweighted Kappa on an ordinal rubric gives a misleadingly pessimistic metric when annotators consistently agree on the general quality tier (e.g., oscillating between 4 and 5 on good responses) but rarely agree on the exact integer. In such cases, Unweighted Kappa might show 0.42 (Fair), while Quadratic Weighted Kappa reveals 0.86 (Near-Perfect), accurately reflecting the underlying consensus."

---

### Behavioral Question
**Question:** *"Describe a situation where a Machine Learning Scientist or Product Manager insisted on using 'Cosine Similarity $\ge 0.85$' as the sole gating criterion for deploying a customer-facing LLM, but you as the Quality Engineer pushed back. How did you handle the conflict and achieve consensus?"*

#### Ideal Candidate Answer
- **Situation:** "During the migration of our enterprise customer support agent from GPT-3.5 to an in-house fine-tuned LLaMA-3 model, the ML team reported that candidate responses achieved an average cosine similarity of 0.89 against our golden test set. The Product Lead and ML Scientist pushed to ship immediately to cut API costs.
- **Task:** As the Lead ML Quality Engineer, I knew that high cosine similarity can hide hallucinations, polarity inversions, and security leaks. My responsibility was to prove this risk quantitatively without being perceived as an obstructionist.
- **Action:** I constructed an empirical counter-example benchmark of 50 safety and business-critical prompts. I showed that our current model generated responses like *'Your refund of $1,200 is confirmed'* when the user was asking for a policy inquiry, and *'You are not permitted to change your billing address'* when they were. Both scored $\ge 0.88$ on cosine similarity against golden answers. I presented this 1-page visual dashboard directly to the ML Scientist and Product Lead.
- **Result:** Instead of an argumentative debate, the data spoke for itself. The team agreed to delay the deployment by 4 days to integrate our multi-dimensional rubric engine: enforcing a hard safety gate, an NLI contradiction check, and an automated LLM correctness judge. The updated pipeline caught 18 critical regression defects before we reached production."

---

### Scenario-Based Question
**Question:** *"You are designing the test automation suite for an LLM that extracts medical dosage instructions from clinical consultation transcripts. The current baseline achieves a 0.95 BERTScore against golden doctor summaries. However, clinical audits show that in 3% of cases, the model swaps the frequency of medication (e.g., 'twice daily' instead of 'once daily'). How do you design an automated test suite to catch this specific defect?"*

#### Ideal Candidate Answer
"BERTScore relies on contextual token embedding matching. Because 'once' and 'twice' share clinical contexts and token representations, the soft cosine alignment in BERTScore easily smooths over this distinction, yielding an deceptively high F1 score of 0.95.

To solve this in an automated test framework:
1. **Deterministic Named Entity & Posology Extraction:** In the pre-assertion stage, use a specialized biomedical NER model (such as `en_ner_bc5cdr_md` or a spaCy posology parser) to extract structured medication triplets: `(Medication, Dosage, Frequency, Route)`.
   - Golden triplet: `('Metformin', '500mg', 'once_daily', 'oral')`
   - Candidate triplet: `('Metformin', '500mg', 'twice_daily', 'oral')`
2. **Exact Attribute Assertions:** Implement a zero-tolerance assertion comparing the extracted frequency and numerical dosage attributes before any semantic metric is evaluated. If the frequency attribute fails an exact match check, fail the test immediately with an RCA label: `POSOLOGY_FREQUENCY_MISMATCH`.
3. **Adversarial Perturbation Unit Tests:** In CI, generate automated mutation tests where doctor notes have frequencies systematically altered (`once` -> `twice` -> `prn`). Verify that the test suite detects 100% of these mutations with zero false passes.
4. **Safety Gating Integration:** Wire this posology checker into the multi-dimensional rubric under `Correctness`. If a frequency discrepancy is detected, assign `Correctness = 1`, triggering the hard gating mechanism that sets the aggregated score to `0.0`."
