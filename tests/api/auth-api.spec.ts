import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS, INVALID_CREDENTIALS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import { parseCustomerXml, extractXmlTag } from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Authentication & Login Suite @api @auth', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: BASE_URL,
    });
    bankingAPI = new BankingAPI(apiContext);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('TC-API-AUTH-001: [Positive] Should authenticate with valid credentials and return complete customer schema', async () => {
    const startTime = Date.now();
    const response = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    const duration = Date.now() - startTime;

    // HTTP Status Assertion
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(10000); // Latency SLA assertion

    // Content-Type Assertion
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/(application\/xml|text\/xml)/);

    // Payload Parsing & Schema Validation
    const xml = await response.text();
    expect(xml).toContain('<customer>');
    expect(xml).toContain('</customer>');

    const customer = parseCustomerXml(xml);
    expect(customer.id).toBeTruthy();
    expect(Number(customer.id)).toBeGreaterThan(0);
    expect(customer.firstName).toBeTruthy();
    expect(customer.lastName).toBeTruthy();
  });

  test('TC-API-AUTH-002: [Positive] Should support XML Accept header negotiation', async () => {
    const response = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password, {
      Accept: 'application/xml',
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.startsWith('<?xml') || body.startsWith('<customer')).toBeTruthy();
  });

  test('TC-API-AUTH-003: [Negative] Should reject login with invalid password', async () => {
    const response = await bankingAPI.login(VALID_CREDENTIALS.username, 'WrongPassword123!');
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).not.toContain('<customer>');
  });

  test('TC-API-AUTH-004: [Negative] Should reject login with non-existent user', async () => {
    const response = await bankingAPI.login(INVALID_CREDENTIALS.username, INVALID_CREDENTIALS.password);
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).not.toContain('<customer>');
  });

  test('TC-API-AUTH-005: [Security] Should safely handle SQL injection attack strings', async () => {
    const maliciousUser = "' OR '1'='1";
    const maliciousPass = "' OR '1'='1";
    const response = await bankingAPI.login(maliciousUser, maliciousPass);
    expect([400, 403]).toContain(response.status());
    const body = await response.text();
    expect(body).not.toContain('<customer>');
  });

  test('TC-API-AUTH-006: [Edge Case] Should handle special character inputs safely', async () => {
    const specialCharsUser = 'user@#$%^&*()';
    const response = await bankingAPI.login(specialCharsUser, 'test');
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).not.toContain('<customer>');
  });
});
