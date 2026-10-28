# HighLevel Automation & API Testing Guide (Playwright, REST, GraphQL)

**Target:** SDET / AI Automation Engineer @ HighLevel  
**Stack in JD:** Playwright, Cypress, Selenium, Postman, REST, GraphQL, gRPC

---

## 1. HighLevel API Architecture: REST vs. GraphQL

HighLevel heavily utilizes **REST** for webhook triggers and integrations, and **GraphQL** for client portals and CRM data querying.

### A. Testing GraphQL APIs (Queries & Mutations)
Unlike REST where status codes define errors (`404`, `500`), **GraphQL almost always returns HTTP 200 OK**, even when the query fails!

```javascript
// Example Playwright test for HighLevel GraphQL API
import { test, expect } from '@playwright/test';

test('Verify GraphQL Appointment Query & Error Handling', async ({ request }) => {
  const query = `
    query GetContactAppointments($contactId: ID!) {
      contact(id: $contactId) {
        id
        name
        email
        appointments {
          id
          startTime
          status
        }
      }
    }
  `;

  const response = await request.post('https://services.leadconnectorhq.com/graphql', {
    headers: {
      'Authorization': 'Bearer test_jwt_token',
      'Content-Type': 'application/json'
    },
    data: {
      query: query,
      variables: { contactId: "contact_123" }
    }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();

  // 💡 CRITICAL GRAPHQL ASSERTION: Must assert 'errors' is undefined!
  expect(body.errors).toBeUndefined();
  expect(body.data.contact.name).toBe("John Doe");
  expect(body.data.contact.appointments.length).toBeGreaterThan(0);
});
```

---

## 2. Playwright Hybrid Testing for HighLevel AI Chatbots

HighLevel deploys live webchat widgets on agency client websites. We test both the **UI chat interaction** and the **streaming network packets (SSE)** in one test:

```typescript
import { test, expect } from '@playwright/test';

test('E2E Conversational AI Bot: Streaming Token & UI Verification', async ({ page }) => {
  // 1. Navigate to client website with HighLevel chat widget
  await page.goto('https://demo-dental-clinic.com');

  // 2. Open chat widget
  const chatBubble = page.locator('#hl-chat-bubble-launcher');
  await chatBubble.click();

  // 3. Setup response listener to verify streaming latency (TTFT)
  let firstTokenTime = 0;
  const startTime = Date.now();

  page.on('response', response => {
    if (response.url().includes('/api/conversation-ai/stream')) {
      firstTokenTime = Date.now() - startTime;
    }
  });

  // 4. Send customer inquiry
  const input = page.locator('textarea[placeholder="Type a message..."]');
  await input.fill('What are your hours on Saturday?');
  await page.keyboard.press('Enter');

  // 5. Assert Time to First Token SLA (< 1200ms)
  await expect(async () => {
    expect(firstTokenTime).toBeGreaterThan(0);
    expect(firstTokenTime).toBeLessThan(1200);
  }).toPass();

  // 6. Assert UI rendering: Bot answers without hallucination
  const botReply = page.locator('.chat-message-bot').last();
  await expect(botReply).toBeVisible({ timeout: 10_000 });
  await expect(botReply).toContainText(/open from 9 AM to 2 PM on Saturday/i);
});
```

---

## 3. High-Yield Interview Scenarios for HighLevel

### Scenario 1: "How do you test an automated CRM workflow that triggers an AI email draft?"
1. **Trigger:** Send a webhook simulating a new lead form submission (`POST /api/v1/leads`).
2. **Intermediate Event:** Poll the workflow execution state or listen to a webhook for `status = "DRAFT_GENERATED"`.
3. **Assert:** Query the CRM API for the drafted email:
   - Verify email recipient and contact name match the lead.
   - Run a prompt safety check ensuring the AI-generated email contains no toxic claims or fabricated discounts.

### Scenario 2: "HighLevel supports 40,000+ agencies. How do you test Multi-Tenancy and Data Isolation?"
1. **The Risk:** Agency A asking the AI bot: *"What were Agency B's sales this month?"*
2. **Test Strategy:**
   - Automated RBAC tests sending prompts with cross-tenant context injection.
   - Verify that the vector database query enforces metadata filtering (`metadata.agency_id == current_tenant_id`) at the database driver level, ensuring Agency A's bot can physically never retrieve Agency B's documents.

