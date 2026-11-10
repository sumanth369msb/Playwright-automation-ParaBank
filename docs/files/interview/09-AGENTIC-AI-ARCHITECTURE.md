# Agentic AI Architecture: Complete Guide for SDETs & AI Quality Engineers

This document breaks down **Agentic AI Architecture** from fundamentals to advanced design patterns, tool integration (MCP), failure modes, and test/validation strategies. It is specifically tailored for testing autonomous systems like **Zinier's field-service AI agents** and enterprise platforms (ServiceNow, Gainsight).

---

## 1. What is Agentic AI vs. Traditional LLM / RAG?

| Dimension | Traditional LLM (Prompt/Response) | RAG (Retrieval-Augmented Gen) | Agentic AI |
| :--- | :--- | :--- | :--- |
| **Autonomy** | Zero. Static 1-shot answer. | Low. Fetches context and answers. | **High. Decomposes goals into multi-step actions.** |
| **Execution** | Passive text generator. | Passive summarizer/answerer. | **Active executor. Calls APIs, queries DBs, executes code.** |
| **Feedback Loop**| None. Single-turn. | None. Single pass retrieve $\rightarrow$ generate. | **Continuous: Observe $\rightarrow$ Reason $\rightarrow$ Act $\rightarrow$ Evaluate loop.** |
| **State** | Stateless. | Stateless per query. | **Stateful: Manages memory, plan progress, scratchpads.** |
| **Deterministic vs Non** | Non-deterministic text. | Grounded text retrieval. | **Non-deterministic reasoning driving deterministic tool calls.** |

---

## 2. Core Architecture: The 5 Building Blocks of an AI Agent

### 2.1 System Architecture Diagram

```mermaid
graph TD
    %% Trigger Layer
    subgraph Layer1 ["1. Perception & Event Ingestion"]
        UI[User Prompt / Chat UI]
        Kafka[Kafka Events / Webhooks]
        Cron[Scheduled Cron Jobs]
        ContextBuilder[Context & Prompt Assembly<br/><i>Injects RBAC, System Prompt, User Metadata</i>]
        UI --> ContextBuilder
        Kafka --> ContextBuilder
        Cron --> ContextBuilder
    end

    %% Agent Brain & Core
    subgraph Layer2 ["2. Agent Brain (LLM Reasoning & Memory Core)"]
        LLM["Foundation Model (LLM Brain)<br/><b>Claude 3.5 Sonnet / GPT-4o</b>"]
        Planner["Planner & Task Decomposer<br/><i>Cognitive Reasoning Ability (ReAct / Tree-of-Thought)</i>"]
        
        subgraph MemorySystem ["Memory Subsystem"]
            WM["Short-term Working Memory<br/><i>Current scratchpad & context</i>"]
            LTM[("Long-term Memory<br/><i>Vector DB / RAG Embeddings</i>")]
            EM[("Episodic Memory<br/><i>Past run trajectories & successes</i>")]
        end
        
        ContextBuilder --> LLM
        LLM <--> Planner
        LLM <--> WM
        LLM <--> LTM
        LLM <--> EM
    end

    %% Execution & Tooling
    subgraph Layer3 ["3. Execution Runtime & Tool Actuators"]
        Runtime["Agent Host Runtime<br/><i>Parses LLM JSON Tool Calls</i>"]
        Validator{"Schema Validator<br/><i>Pydantic / JSON Schema</i>"}
        MCP["MCP Client & Tool Router<br/><i>Model Context Protocol</i>"]

        LLM -->|Emits Tool Call Request| Runtime
        Runtime --> Validator
        Validator -->|Valid Schema| MCP
        Validator -.->|Invalid Schema 422| LLM
        
        subgraph Tools ["Actuators & External Systems"]
            REST["Zinier REST APIs<br/><i>Work Orders, Schedules</i>"]
            DB[(PostgreSQL / Snowflake)]
            ThirdParty["Third-party Services<br/><i>Google Maps, SendGrid</i>"]
        end

        MCP --> REST
        MCP --> DB
        MCP --> ThirdParty
    end

    %% Evaluation & Human Layer
    subgraph Layer4 ["4. Quality Gates, Guardrails & Human-in-the-Loop"]
        Observation["Tool Result / Observation"]
        Reflect{"Self-Reflection &<br/>Goal Complete?"}
        HITL{"High-Stakes<br/>Decision?"}
        Human[Human Dispatcher / Approver]
        FinalOutput([Final Response / State Updated])

        REST --> Observation
        DB --> Observation
        ThirdParty --> Observation
        Observation --> Reflect
        Reflect -->|Needs More Steps| LLM
        Reflect -->|Goal Met| HITL
        HITL -->|Yes| Human
        Human -->|Approved| FinalOutput
        HITL -->|No| FinalOutput
    end

    classDef primary fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef memory fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef tools fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef gates fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;

    class LLM,Planner primary;
    class WM,LTM,EM memory;
    class REST,DB,ThirdParty,MCP tools;
    class Validator,Reflect,HITL gates;
```

### 2.2 Deep Dive into the 5 Pillars

#### 1. Perception (Input & Trigger Layer)
* Ingests user prompts, system webhooks, Kafka events, or schedule triggers.
* Standardizes environment data, user roles (RBAC), and session metadata before feeding into the context window.

#### 2. The Brain (Reasoning Engine - LLM)
* Uses foundation models (e.g., Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) with system prompts instructing role, guardrails, and allowed operations.
* **Reasoning Frameworks**:
  * **ReAct (Reason + Act)**: The agent outputs: `Thought` $\rightarrow$ `Action` $\rightarrow$ `Observation` $\rightarrow$ `Thought` $\rightarrow$ `Final Answer`.
  * **Plan-and-Solve / Tree of Thoughts**: Pre-plans a sequence of steps, executes them, and dynamically updates the plan if a step fails.

> [!IMPORTANT]
> **Key Interview Distinction: Is the "Planner / Decomposer" a Tool or a Model Ability?**
> - **It is an *internal cognitive ability of the reasoning model***, guided by prompting paradigms (ReAct, Chain-of-Thought, Tree-of-Thought). It runs inside the LLM token generation loop.
> - **Tools**, by contrast, are **external functions/APIs** (`query_db()`, `assign_ticket_api()`, Google Maps) executed by external backend code.
> - *Exception (Hybrid Systems):* The LLM decomposes high-level business goals, but can delegate NP-hard combinatorial optimization (like multi-technician route scheduling) to an external deterministic solver tool (e.g., Google OR-Tools).

#### 3. Memory Architecture
* **Short-Term / Working Memory**: Current session scratchpad, conversation history, and immediate tool call outputs inside the prompt context window.
* **Long-Term Memory**: Vector database (Pinecone, Chroma, Qdrant) storing past user preferences, historical work order resolutions, or organizational domain knowledge.
* **Episodic Memory**: Past execution trajectories used by the agent to learn from previous successes or failures.

#### 4. Planning & Decomposition
* Breaks a complex, ambiguous user objective (*"Reschedule all delayed high-priority HVAC work orders in North Region"*) into discrete sub-tasks:
  1. Query active work orders with status `DELAYED` and priority `P1`.
  2. Find available HVAC-certified technicians in North Region.
  3. Validate shift schedules & travel time constraints.
  4. Call scheduling API to update work orders.
  5. Notify technicians via SMS/Push.

#### 5. Tools & Actuators (Action Space)
* APIs, database queries, bash commands, browser automation, or **Model Context Protocol (MCP)** endpoints that allow the agent to affect the outside world.

---

## 3. Tool Execution & Runtime Sequence (The ReAct Loop)

Agents don't execute actions directly; they emit **structured tool call requests** (JSON schema) that an execution runtime invokes.

### 3.1 Runtime Sequence Diagram: Autonomous Field Dispatch with Human-in-the-Loop

```mermaid
sequenceDiagram
    autonumber
    actor Dispatcher as User / Dispatcher
    participant Agent as Agent Brain (LLM)
    participant Memory as Scratchpad / Working Memory
    participant Runtime as Tool Runtime (MCP Client)
    participant Backend as Zinier Backend APIs
    actor HITL as Human Approver

    Dispatcher->>Agent: "John called in sick. Reassign his urgent P1 work orders."
    
    rect rgb(240, 248, 255)
        Note over Agent,Memory: Step 1: Planning & Tool Call 1
        Agent->>Memory: Thought: "I need to look up John's active P1 work orders."
        Agent->>Runtime: Tool Call: get_technician_jobs(tech_name="John", priority="P1")
        Runtime->>Backend: GET /api/v1/jobs?tech=John&priority=P1
        Backend-->>Runtime: 200 OK: [{job_id: 104, type: "HVAC", status: "PENDING"}]
        Runtime-->>Agent: Observation: Found Job #104 (HVAC repair)
    end

    rect rgb(255, 250, 240)
        Note over Agent,Memory: Step 2: Reasoning & Tool Call 2
        Agent->>Memory: Thought: "Now find nearby technicians certified in HVAC with open slots."
        Agent->>Runtime: Tool Call: find_available_technicians(skill="HVAC", region="North")
        Runtime->>Backend: GET /api/v1/technicians/available?skill=HVAC
        Backend-->>Runtime: 200 OK: [{tech_id: 88, name: "Sarah", status: "AVAILABLE"}]
        Runtime-->>Agent: Observation: Sarah is certified and available at 2 PM.
    end

    rect rgb(245, 255, 245)
        Note over Agent,HITL: Step 3: High-Stakes Action & Human Gate
        Agent->>Memory: Thought: "Reassigning Job #104 to Sarah. This is a P1 dispatch; requires approval."
        Agent->>HITL: Request Approval: "Reassign P1 HVAC Job #104 from John to Sarah at 2 PM?"
        HITL-->>Agent: "Approved"
        Agent->>Runtime: Tool Call: reassign_job(job_id=104, new_tech_id=88)
        Runtime->>Backend: POST /api/v1/jobs/104/reassign
        Backend-->>Runtime: 200 OK: {status: "REASSIGNED"}
        Runtime-->>Agent: Observation: Job successfully reassigned.
    end

    Agent->>Dispatcher: "Job #104 has been successfully reassigned to Sarah for 2 PM."
```

### Why MCP (Model Context Protocol) Matters:
* **Decouples Tools from Agents**: Standardized JSON-RPC protocol developed by Anthropic.
* Instead of hardcoding 50 API clients inside your agent, the agent connects to an **MCP Server** that exposes available `Tools`, `Resources` (data), and `Prompts` dynamically.
* **In SDET testing**: You can mock an entire MCP server during integration testing to verify how the agent behaves under tool errors, timeouts, or unexpected payloads.

---

## 4. Multi-Agent Architectures (Orchestration Patterns)

Complex enterprise platforms do not use a single monolithic agent. They use specialized multi-agent teams:

```mermaid
graph TD
    Router[Supervisor / Router Agent] --> Triage[Triage Agent]
    Router --> Scheduling[Intelligent Scheduling Agent]
    Router --> Diagnostics[Parts & Diagnostics Agent]

    Scheduling --> TechDB[(Technician Roster DB)]
    Scheduling --> MapsAPI[Maps & Traffic API]
    
    Diagnostics --> ManualsVectorDB[(OEM Manuals Vector DB)]
```

1. **Supervisor / Hierarchical Pattern**: A lead agent delegates sub-tasks to specialized sub-agents and synthesizes their outputs.
2. **Sequential / Pipeline Pattern**: Output of Agent A becomes input of Agent B (e.g., Triage Agent $\rightarrow$ Estimator Agent $\rightarrow$ Dispatch Agent).
3. **Collaborative / Peer Pattern**: Agents communicate via a shared message bus or shared state graph (e.g., LangGraph, AutoGen, CrewAI).

---

### 5.1 How to Detect Tool Failures in an Agent Execution Trace

In autonomous agents, a tool failure does not always crash the host program—the agent might catch the error, hallucinate a fake response, or loop infinitely. Detecting failures requires inspecting the **execution trace** across 4 distinct layers:

```mermaid
flowchart TD
    LLM[LLM Emits Tool Call] --> L1{Layer 1: Pre-Execution<br/>Schema / Argument Failure?}
    L1 -->|Yes: Bad JSON / Types| F1[422 Schema Error / Hallucinated Params]
    L1 -->|No| Runtime[Runtime Dispatches Tool]
    
    Runtime --> L2{Layer 2: Execution / Network<br/>HTTP or System Error?}
    L2 -->|Yes: 4xx, 5xx, Timeout| F2[API / System Execution Failure]
    L2 -->|No| Output[Tool Returns Payload]
    
    Output --> L3{Layer 3: Semantic / Business<br/>Empty Data / Contract Breach?}
    L3 -->|Yes: Empty list / Partial data| F3[Silent Semantic Failure]
    L3 -->|No| Observation[Fed to LLM Observation]
    
    Observation --> L4{Layer 4: Trajectory / Agent Loop<br/>Infinite Retry / Goal Drift?}
    L4 -->|Yes: Repeats same call 5x| F4[Infinite Loop / Unrecoverable Drift]
    L4 -->|No| Success[Step Complete]
```

#### The 4 Layers of Trace Failure Detection:
1. **Layer 1: Schema / Argument Hallucination**:
   - The LLM outputs invalid JSON or parameter types that violate the tool's Pydantic contract (e.g. `tech_id: "John"` instead of `int`).
   - *Detection in Trace:* Pre-execution validation span marked as `status=ERROR` with `error_type=ValidationError`.
2. **Layer 2: Network & API Gateway Errors**:
   - The tool executes via HTTP/REST or MCP, but upstream services return `4xx`, `5xx`, or timeout.
   - *Detection in Trace:* Distributed span (OpenTelemetry / LangSmith) reports HTTP status $\ge 400$ or unhandled `TimeoutException`.
3. **Layer 3: Silent Semantic Failures**:
   - The tool returns HTTP 200 OK, but the payload is empty (`{"technicians": []}`) or lacks required data.
   - *Detection in Trace:* Evaluator inspects tool observation payloads for null/empty values and missing keys.
4. **Layer 4: Trajectory & Infinite Loop Failures**:
   - The agent encounters an error and repeats the exact same tool call with identical inputs across subsequent steps without learning.
   - *Detection in Trace:* Trajectory deduplication check: flag when consecutive steps have identical `tool_name` and `arguments`.

> [!TIP]
> **SDET Golden Interview Insight: Tool Failure vs. Agent Failure**
> In agentic evaluation, distinguish between **Tool Failure** and **Agent Failure**:
> - If a tool returns `404 Not Found` or `500 Server Error`, but the agent reads the observation, **self-corrects** (e.g., switches to a backup API or alternate query), and achieves the goal, the test **PASSES** under **Agent Resilience Testing**.
> - The test **FAILS** only if the agent hallucinates success despite the failure, gets stuck in an infinite retry loop, or crashes.

## 6. How to Test Agentic AI: The Quality Framework

```mermaid
flowchart LR
    A[Agent Test Framework] --> B[1. Unit Evals: Tool Calling]
    A --> C[2. Integration Evals: Trajectory / ReAct]
    A --> D[3. End-to-End Evals: LLM-as-a-Judge]
    A --> E[4. Safety & Guardrails: Jailbreak / RBAC]
```

### 1. Tool-Calling Unit Tests (Deterministic)
* Assert that given specific user intents, the LLM emits the **correct tool name** and **valid argument schema** (validating against Pydantic / JSON Schema contracts).

### 2. Trajectory & Reasoning Evaluation (Intermediate Steps)
* Don't just assert the final outcome; assert the **execution path**:
  * Did the agent call the minimal set of tools without redundant calls?
  * Metric: **Tool Call Precision & Recall** and **Trajectory Efficiency** ($\text{Optimal Steps} / \text{Actual Steps}$).

### 3. Golden Trajectory Datasets
* Curate a benchmark suite of 100-200 scenarios with known ground truth steps.
* Run in CI/CD before any prompt or model version update.

### 4. Human-in-the-Loop (HITL) Validation
* For high-stakes workflows (e.g., canceling a contract, assigning overtime pay), assert that the agent **pauses execution**, stores state in DB, and requests human confirmation before executing the tool.

---

## 7. How to Explain This in Your Interview with Keerthivasan

> **Interviewer Question:** *"Can you explain the architecture of an AI agent and how you would test an autonomous scheduling agent at Zinier?"*

### **Your Structured Answer:**
1. **Architecture Overview:**
   > *"An agentic system consists of five core components: the **Perception layer** that ingests work order events; the **Brain (LLM)** running a reasoning loop like ReAct; the **Memory system** managing short-term context and long-term vector embeddings; a **Planner** that decomposes high-level goals into step-by-step sub-tasks; and **Tools/Actuators** connected via REST APIs or MCP to take real actions in Zinier's backend."*

2. **The Agent Execution Loop:**
   > *"The agent operates in a continuous **Observe-Reason-Act** cycle. For example, to schedule an emergency HVAC repair, it reasons about required technician skills, calls `query_technicians()`, observes who is available and nearest, applies business constraints (shift limits, travel time), and either executes `assign_ticket()` or routes to a human dispatcher if constraints conflict."*

3. **My Quality Engineering Strategy:**
   > *"I test agents at three levels:
   > 1. **Contract & Schema Level:** Strict Pydantic/JSON validation on tool call arguments to catch argument hallucination.
   > 2. **Trajectory & Efficiency Testing:** Using benchmark golden datasets in CI to evaluate whether the agent follows the optimal path without infinite loops or redundant API hits.
   > 3. **Constraint & Safety Gates:** Asserting hard business constraints (no double-booking, shift rules) via deterministic rule engines, while using calibrated LLM-as-a-Judge for semantic quality and upstream PII/RBAC gates."*
