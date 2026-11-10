# Performance, NFR, and Resilience Testing

**Context:** Preparing for SDET-2 at Zinier. Zinier is a field service management platform with AI agents, REST APIs, and microservices. The JD emphasizes performance, load, resilience, and failure testing. Since performance testing is not heavily featured in your resume, focus on demonstrating a solid understanding of the foundations, the right terminology, and a strong analytical mindset.

---

## Section 1: Performance Testing Fundamentals

Understanding these concepts is crucial for discussing performance testing strategies.

### Types of Performance Testing
*   **Load Testing:** Evaluating system behavior under the *expected* peak load (e.g., normal daily traffic).
*   **Stress Testing:** Pushing the system *beyond* normal operational capacity until it breaks, to find the breaking point and observe how it fails and recovers.
*   **Spike Testing:** Testing the system's reaction to sudden, extreme, and brief bursts of traffic (e.g., a Black Friday sale or a sudden alert).
*   **Soak / Endurance Testing:** Running a steady load for an extended period (hours or days) to identify memory leaks, resource exhaustion, or database connection issues.
*   **Scalability Testing:** Determining how the application scales up or out to support an increasing user load.
*   **Volume Testing:** Testing with a large volume of data in the database to see how it affects response times.

### Key Metrics
*   **Response Time:** The time taken from sending a request to receiving the last byte of the response.
    *   **Average vs. Percentiles:** Averages are misleading because outliers skew them. Always talk about percentiles: **p95** (95% of requests are faster than this value) and **p99** (99% are faster).
*   **Throughput (TPS/RPS):** Transactions Per Second or Requests Per Second. The amount of work the system can handle in a given time.
*   **Error Rate:** The percentage of requests that fail (e.g., HTTP 5xx errors) under load.
*   **Concurrent Users:** The number of virtual users (threads) interacting with the system simultaneously.
*   **Latency:** Often used interchangeably with response time, but technically it's the network delay (time for a packet to travel from source to destination).

### Performance Testing Lifecycle
1.  **Identify Test Environment & Requirements:** Define SLA/SLOs, identify hardware/network specs.
2.  **Test Planning & Design:** Identify critical scenarios, define workloads.
3.  **Test Environment Setup:** Ensure the environment matches production as closely as possible.
4.  **Test Script Implementation:** Create the scripts using a tool (JMeter, k6).
5.  **Test Execution:** Run load, stress, spike tests.
6.  **Test Analysis & Tuning:** Analyze results (bottlenecks, metrics) and tune the system.
7.  **Test Reporting:** Share findings with stakeholders.

### SLA / SLO / SLI
*   **SLA (Service Level Agreement):** A business contract with the customer (e.g., "99.9% uptime or we pay you").
*   **SLO (Service Level Objective):** Internal goals set to ensure you meet the SLA (e.g., "99.95% uptime").
*   **SLI (Service Level Indicator):** The actual, real-time measurement (e.g., "Currently at 99.92% uptime over the last 30 days").

### Apdex Score (Application Performance Index)
An open standard that measures user satisfaction with response times on a scale from 0 to 1 (Satisfied, Tolerating, Frustrated).

---

## Section 2: Tools & Frameworks

Be prepared to discuss which tools you know and which ones you'd recommend.

*   **JMeter:** The industry standard. Java-based, GUI-driven (but run in CLI for actual tests). Uses Thread Groups (users), Samplers (requests), Listeners (reports), Timers, and Assertions. Great for protocol-level testing.
*   **k6:** Modern, developer-centric, written in Go but scripts are in **JavaScript**. Excellent for CI/CD integration. (Highly recommended to mention if you have JS/TS experience, as it aligns well with modern SDET stacks).
*   **Gatling:** Scala-based, highly performant, uses an asynchronous architecture (Netty). Good for massive scale.
*   **Locust:** Python-based. Users are defined in Python code. Highly flexible but less raw throughput per node than k6 or Gatling.
*   **Artillery:** Node.js-based. Good for testing Node backends and WebSocket applications.

**Recommendation for Zinier:** "While JMeter is widely used, I prefer **k6** because it allows writing performance tests in JavaScript/TypeScript, integrating seamlessly into a modern CI/CD pipeline, and treating performance tests as code alongside the automation suite."

---

## Section 3: API Performance Testing

Focus on testing REST APIs, as this is highly relevant to Zinier and your ParaBank project.

### Designing API Load Tests
1.  **Identify Critical Paths:** Focus on high-volume APIs (e.g., `POST /auth/login`, `GET /work-orders`, `POST /sync`).
2.  **Data Setup:** Ensure realistic test data (not just the same user 1000 times). Use CSVs or dynamic generation.
3.  **Workload Modeling:**
    *   **Think Time:** The pause between actions a real user takes (prevents artificial, unrealistic hammering of the server).
    *   **Ramp-up Strategy:** Gradually increasing the number of virtual users rather than hitting the server all at once (unless it's a spike test).
    *   **Pacing:** The time between iterations of a full user journey.

### Database & Backend Bottlenecks
*   **Connection Pooling:** Are there enough database connections available, or are threads waiting for a connection?
*   **N+1 Query Problem:** Is an API making one DB query to get a list, and then N more queries to get details for each item?
*   **Memory Leaks:** Watch heap usage during soak tests.

### Testing Async/Event-Driven APIs
If the API returns `202 Accepted` and processes data in the background (via Kafka or RabbitMQ), you can't just measure the HTTP response time. You must measure the time from the HTTP request until the final database state is updated or the completion event is fired.

---

## Section 4: Non-Functional Requirements (NFRs)

Performance is just one NFR. Others include:

*   **Scalability Testing:**
    *   *Vertical Scaling (Scaling Up):* Adding more CPU/RAM to a single machine.
    *   *Horizontal Scaling (Scaling Out):* Adding more machines/nodes (common in microservices/Kubernetes). Testing ensures the load balancer distributes traffic correctly.
*   **Reliability & Availability:**
    *   99.9% ("Three nines") = ~43 minutes downtime/month.
    *   99.99% ("Four nines") = ~4 minutes downtime/month.
*   **Security Testing Basics:**
    *   Know the OWASP Top 10 (Injection, Broken Authentication, Sensitive Data Exposure).
    *   SQL Injection: Injecting malicious SQL in inputs.
    *   XSS (Cross-Site Scripting): Injecting malicious scripts.
    *   CSRF (Cross-Site Request Forgery): Forcing a user to execute unwanted actions.
*   **Compatibility Testing:** Ensuring APIs/Apps work across different OS versions, browsers, and mobile devices.

---

## Section 5: Observability & Resilience (CRITICAL for Zinier)

Zinier is a microservices platform. Understanding how to monitor and test the resilience of these services is key.

### The Three Pillars of Observability
1.  **Logs:** Detailed, immutable records of events (structured logging like JSON). Tools: ELK stack (Elasticsearch, Logstash, Kibana), Splunk.
    *   *Crucial Concept:* **Correlation IDs**. A unique ID generated at the API gateway and passed through all microservices, allowing you to trace a single request's path through the logs.
2.  **Metrics:** Aggregated data over time (e.g., CPU %, memory, error rates). Tools: Prometheus, Datadog. Visualized in Grafana.
3.  **Traces:** Represent the end-to-end journey of a request across distributed systems. Tools: OpenTelemetry, Jaeger.

### Resilience Patterns (How systems handle failure)
*   **Circuit Breaker:** If Service A calls Service B and Service B fails 10 times in a row, the circuit "opens," failing fast and preventing cascading failures, giving Service B time to recover.
*   **Retry with Exponential Backoff:** If a network call fails, retry after 1s, then 2s, then 4s, etc., to avoid overwhelming a struggling service.
*   **Timeout:** Setting a strict limit on how long to wait for a response so threads don't hang indefinitely.
*   **Bulkhead:** Partitioning resources (e.g., thread pools) so a failure in one area doesn't take down the entire application.
*   **Fallback:** Providing a default response or cached data if the primary service is down.

### Failure/Chaos Testing
*   **Concept:** Intentionally injecting faults into the system to verify it behaves as expected (resilience patterns work).
*   **Blast Radius:** Always start small (e.g., one pod in staging) to minimize unintended impact.
*   **How to test:**
    *   Kill a database node. Does the replica take over?
    *   Introduce network latency (using tools like Toxiproxy). Do timeouts and circuit breakers trigger?
    *   Take down Kafka. Does the system queue messages locally or fail gracefully?

---

## Section 6: Situational Questions

**Q: "Zinier's API response time increased from 200ms to 2s after a deployment. How do you investigate?"**
*   **What they are testing:** Troubleshooting methodology, knowledge of observability.
*   **Answer:** "First, I'd check the **metrics** (Grafana/Datadog) to isolate the issue: Is it a specific endpoint, a specific microservice, or the database? Second, I'd use **distributed tracing** (Jaeger) to see exactly which span is taking the extra time. Third, I'd check the **logs** for that specific service for errors or slow queries. Finally, I'd review the Git commit history for the recent deployment to see what changed (e.g., a missing DB index or an unoptimized third-party API call). If it's critical, I would advocate for rolling back the deployment while we investigate."
*   **Pro Tip:** Mention isolating the problem and using the Three Pillars of Observability.

**Q: "How would you load test an intelligent scheduling API that calls an LLM?"**
*   **What they are testing:** Understanding of asynchronous systems and third-party dependencies.
*   **Answer:** "LLMs are notoriously slow and asynchronous. I wouldn't just test the initial API response. I'd set up a load testing script (like k6) to fire requests, then implement a polling mechanism or listen for webhooks to measure the *total time to completion*. Also, since LLM calls are expensive and rate-limited, I would likely mock the LLM endpoint for internal load testing to test our system's throughput, and separately do capacity testing on the real LLM endpoint to understand its limits."

**Q: "A microservice is intermittently timing out. Walk me through your debugging approach."**
*   **Answer:** "Intermittent issues are usually related to resource exhaustion or network blips. I would look at memory usage over time to check for memory leaks (garbage collection pauses). I'd check database connection pool metrics to see if threads are waiting for connections. I'd also look for 'noisy neighbors' on the Kubernetes node. Implementing correlation IDs in logs would be essential here to track exactly which requests are failing and trace them back to specific parameters."

**Q: "How do you test system behavior when Kafka/RabbitMQ is down?"**
*   **What they are testing:** Resilience testing / Chaos engineering.
*   **Answer:** "I would perform a failure test in a staging environment by intentionally stopping the Kafka brokers. I'd verify that the APIs still return a fast response (perhaps degrading gracefully or writing to an outbox table in the database to be synced later). When Kafka is restored, I'd verify that the system processes the backlog without dropping messages or processing them out of order. I'd also monitor Consumer Lag metrics."

---

## Section 7: Behavioral Questions

Since performance isn't heavily on your resume, pivot these to your API/Backend experience.

**Q: "Tell me about a time you identified a performance bottleneck."**
*   **Strategy:** Use a database or API optimization example.
*   **Answer structure (STAR):** "In a previous project, we noticed an API was getting very slow when fetching large datasets. (Task): I investigated the endpoint. (Action): I analyzed the SQL queries and noticed we had an N+1 query problem, where we were making a new DB call for every item in a list instead of a single JOIN. (Result): I highlighted this to the dev team, they optimized the query, and response time dropped from 3 seconds to under 200ms."

**Q: "How would you integrate performance testing into CI/CD?"**
*   **Answer:** "I believe in running lightweight performance tests as part of the daily pipeline. I would create a subset of critical API tests using a tool like k6. These would run in the CI/CD pipeline (e.g., GitHub Actions or Jenkins) after deployment to the staging environment. We would assert on SLA metrics (e.g., p95 response time < 500ms). If the test fails, the build turns red, preventing a performance regression from reaching production. Heavy, long-running soak tests would run on weekends."
