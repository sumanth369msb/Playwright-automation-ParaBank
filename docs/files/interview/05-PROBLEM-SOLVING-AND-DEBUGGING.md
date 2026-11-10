# Problem Solving and Debugging - SDET-2 Interview Preparation

This document focuses on the problem-solving and debugging aspects of the SDET-2 role at Zinier. It covers medium-level coding logic, SQL problems, and structured debugging methodologies for APIs, tests, and production issues.

## Section 1: Coding Problem Patterns (Medium Level)

As an SDET, coding questions often focus on data manipulation, parsing, and algorithmic efficiency.

### 1. String Manipulation

#### Problem: Valid Anagram
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

**Python Solution:**
```python
def isAnagram(s: str, t: str) -> bool:
    if len(s) != len(t): return False
    count = {}
    for char in s:
        count[char] = count.get(char, 0) + 1
    for char in t:
        if char not in count or count[char] == 0:
            return False
        count[char] -= 1
    return True
```

**Java Solution:**
```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] store = new int[26];
    for (int i = 0; i < s.length(); i++) {
        store[s.charAt(i) - 'a']++;
        store[t.charAt(i) - 'a']--;
    }
    for (int count : store) if (count != 0) return false;
    return true;
}
```
* **Time Complexity:** O(N) where N is the length of the string.
* **Space Complexity:** O(1) space since there are at most 26 lowercase English letters (or O(N) if supporting Unicode).

### 2. Array / HashMap

#### Problem: Two Sum
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

**Python Solution:**
```python
def twoSum(nums, target):
    numMap = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in numMap:
            return [numMap[complement], i]
        numMap[num] = i
    return []
```

**Java Solution:**
```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[] { map.get(complement), i };
        }
        map.put(nums[i], i);
    }
    return new int[] {};
}
```
* **Time Complexity:** O(N)
* **Space Complexity:** O(N)

### 3. Sliding Window

#### Problem: Longest Substring Without Repeating Characters

**Python Solution:**
```python
def lengthOfLongestSubstring(s: str) -> int:
    char_set = set()
    left = 0
    max_len = 0
    
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_len = max(max_len, right - left + 1)
        
    return max_len
```

**Java Solution:**
```java
public int lengthOfLongestSubstring(String s) {
    Set<Character> set = new HashSet<>();
    int left = 0, maxLen = 0;
    
    for (int right = 0; right < s.length(); right++) {
        while (set.contains(s.charAt(right))) {
            set.remove(s.charAt(left));
            left++;
        }
        set.add(s.charAt(right));
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```
* **Time Complexity:** O(N)
* **Space Complexity:** O(min(M, N)) where M is the charset size.

### SDET-Specific Coding

#### Validate API Response Schemas
**Python (Using `jsonschema`):**
```python
from jsonschema import validate, ValidationError

schema = {
    "type": "object",
    "properties": {
        "id": {"type": "number"},
        "name": {"type": "string"}
    },
    "required": ["id", "name"]
}

response = {"id": 1, "name": "Zinier"}

try:
    validate(instance=response, schema=schema)
    print("Valid")
except ValidationError as e:
    print(f"Invalid: {e.message}")
```

#### Compare JSON ignoring dynamic fields
**Java (Using Jackson & JSONassert conceptually or custom logic):**
```java
public boolean compareJsonIgnoring(JsonNode expected, JsonNode actual, List<String> ignoreFields) {
    if (expected.isObject() && actual.isObject()) {
        Iterator<String> fieldNames = expected.fieldNames();
        while (fieldNames.hasNext()) {
            String fieldName = fieldNames.next();
            if (ignoreFields.contains(fieldName)) continue;
            if (!actual.has(fieldName) || !compareJsonIgnoring(expected.get(fieldName), actual.get(fieldName), ignoreFields)) {
                return false;
            }
        }
        return true;
    }
    return expected.equals(actual);
}
```

---

## Section 2: SQL Problems (Important for Zinier)

### Core Concepts
* **INNER JOIN:** Returns records with matching values in both tables.
* **LEFT JOIN:** Returns all records from the left table, and matched records from the right.
* **Subqueries & CTEs:** Used for breaking down complex logic. CTEs (`WITH` clause) are often preferred for readability.
* **Window Functions:** `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()` over `PARTITION BY`.

### Practice Problems

#### 1. Nth Highest Salary
```sql
SELECT DISTINCT salary 
FROM Employee 
ORDER BY salary DESC 
LIMIT 1 OFFSET (N-1);

-- Or using Window Functions
WITH RankedSalaries AS (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk
    FROM Employee
)
SELECT salary FROM RankedSalaries WHERE rnk = N;
```

#### 2. Find Duplicate Records
```sql
SELECT email, COUNT(*)
FROM Users
GROUP BY email
HAVING COUNT(*) > 1;
```

#### 3. Employees Earning More Than Their Managers
```sql
SELECT e1.name AS Employee
FROM Employee e1
INNER JOIN Employee e2 ON e1.managerId = e2.id
WHERE e1.salary > e2.salary;
```

#### 4. Running Total
```sql
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) as running_total
FROM Transactions;
```

#### 5. Data Integrity Check (Finding orphaned records)
```sql
-- Find orders that reference a non-existent customer
SELECT o.order_id
FROM Orders o
LEFT JOIN Customers c ON o.customer_id = c.id
WHERE c.id IS NULL;
```

---

## Section 3: Debugging Methodology

### Structured Debugging Framework
1. **Reproduce:** Can I consistently make it happen? Isolate the environment and conditions.
2. **Isolate:** Narrow down the scope (e.g., UI vs. API vs. DB). Use binary search logic to disable parts of the system.
3. **Identify:** Look at logs, metrics, network traffic, or stack traces to find the root cause.
4. **Fix:** Apply the patch or configuration change.
5. **Verify:** Confirm the issue is resolved and add a test case to prevent regression.

### Debugging API Failures
* **HTTP Status Code Analysis:**
    * 400: Bad Request (Check payload)
    * 401/403: Auth issues
    * 404: Not Found (Check URL/path variables)
    * 500: Server error (Check server logs)
    * 502/504: Gateway/Timeout issues
* **Tools:** Network tab (browser), Postman, cURL, Kibana/Datadog for backend logs.
* **cURL Recreation:** Right-click a failed network request in the browser -> Copy as cURL -> Run in terminal to verify independently of the frontend.

### Debugging Test Failures
* **Flaky Tests:**
    * **Race conditions:** UI elements loading slower than the test executes. Fix: Use appropriate wait/polling mechanisms (Playwright's auto-waiting `expect(locator).toBeVisible()`).
    * **State/Data dependency:** Tests modifying shared data. Fix: Setup/teardown isolated data per test.
* **Playwright Traces:** View DOM snapshots, console logs, network requests, and the exact timeline of the test failure using `playwright show-trace trace.zip`.
* **Stack Traces:** Read from top to bottom, look for your code's package name rather than framework internals.

### Debugging Production Issues
* **Log Analysis:** Use `grep`, `awk`, or structured queries (e.g., KQL for Elasticsearch) to filter errors. Correlate using a `trace_id` or `request_id`.
* **Metrics Corroboration:** Check CPU, memory, and database connection pools around the time of the failure.

---

## Section 4: Root Cause Analysis

* **5 Whys Technique:** Ask "Why?" iteratively to drill down to the fundamental process or system failure, not just the symptom.
* **Fishbone Diagram:** Categorize potential causes into People, Process, Technology, Environment.
* **RCA Document Template:**
    * Incident Summary
    * Timeline of events
    * Root Cause
    * Resolution
    * Action Items (How to prevent this in the future)

---

## Section 5: Situational Questions

### 'A test that passed yesterday is failing today with no code changes. Walk me through your investigation.'
* **What's being tested:** Your systematic approach to isolation and environment factors.
* **Structured Answer:**
    1. Check the test run history to see if it's flaky or a hard failure.
    2. Check environment changes: Did a database refresh happen? Are third-party APIs down? Did configuration flags change?
    3. Check data dependency: Is the test relying on a specific date (`today()`) that rolled over?
    4. Run the test locally against the target environment.
* **Pro Tip:** Mention "Test Data Aging" and "Environment Drift".

### 'Production API is returning 502 intermittently. Only 5% of requests fail. How do you debug?'
* **What's being tested:** Handling distributed systems, load balancing, and network debugging.
* **Structured Answer:**
    1. Look at metrics: Are the failures isolated to a specific server node or pod behind the load balancer?
    2. Check downstream services: Is the API timing out calling a database or a 3rd party?
    3. Examine logs for the 5% failures using correlation IDs to trace the full request lifecycle.
* **Pro Tip:** 502s are often gateway timeouts or out-of-memory container kills. Mention checking container orchestrator (e.g., Kubernetes) events.

### 'You're given a failing Playwright test trace. What do you look for first?'
* **What's being tested:** Practical tool knowledge.
* **Structured Answer:**
    1. Go straight to the final error message and the exact line of code that threw it.
    2. Look at the network panel leading up to the failure: Did an API call fail or hang?
    3. Look at the DOM snapshot right before the failure: Was the element covered by a modal? Was it not rendered yet?
* **Pro Tip:** Playwright traces show "Actionability logs" which explain *why* an element couldn't be clicked (e.g., "element is outside of the viewport").

### 'The database shows inconsistent data after a transfer API call. How do you investigate?'
* **What's being tested:** Understanding of transactions and ACID properties.
* **Structured Answer:**
    1. Verify if the API uses a single database transaction for the transfer operation.
    2. Check server logs during the transfer time for exceptions, timeouts, or process crashes.
    3. Write a script/query to identify the extent of the corruption (how many records).

---

## Section 6: Behavioral Questions

### 'Tell me about the hardest bug you ever debugged'
* **What's being tested:** Tenacity, technical depth, and structured thinking.
* **Structured Answer (STAR Format):**
    * **Situation:** Describe a complex, perhaps intermittent issue.
    * **Task:** Your responsibility to fix it.
    * **Action:** How you systematically narrowed it down (added logs, replicated the environment, isolated the subsystem).
    * **Result:** The fix, and importantly, the preventative measures (tests, alerts) you added.
* **Pro Tip:** Choose a bug that spans multiple systems (e.g., UI to API to DB) rather than a simple syntax error.

### 'Describe a time you had to debug a production issue under time pressure'
* **What's being tested:** Composure, prioritization, and communication.
* **Structured Answer:**
    * Emphasize first mitigating the impact (e.g., rolling back a deployment, turning off a feature flag).
    * Then, finding the root cause offline.
    * Highlight communicating status updates to stakeholders during the outage.
* **Pro Tip:** "Mitigation first, resolution second" is the golden rule of production incidents.
