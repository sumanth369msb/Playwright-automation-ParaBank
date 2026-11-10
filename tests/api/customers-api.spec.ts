import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import { parseCustomerXml, extractXmlTag } from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Customer Management Suite @api @customers', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;
  let customerId: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });
    bankingAPI = new BankingAPI(apiContext);

    // Bootstrap customer ID via login
    const loginRes = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    expect(loginRes.status()).toBe(200);
    const loginXml = await loginRes.text();
    const customer = parseCustomerXml(loginXml);
    customerId = customer.id;
    expect(customerId).toBeTruthy();
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('TC-API-CUST-001: [Positive] Should retrieve customer details by valid ID', async () => {
    const response = await bankingAPI.getCustomer(customerId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const customer = parseCustomerXml(xml);

    expect(customer.id).toBe(customerId);
    expect(customer.firstName).toBeTruthy();
    expect(customer.lastName).toBeTruthy();
  });

  test('TC-API-CUST-002: [Positive] Should successfully update customer profile details', async () => {
    const updatedPhone = '555-0199';
    const updatedCity = 'Beverly Hills';

    const updateResponse = await bankingAPI.updateCustomer(customerId, {
      firstName: 'John',
      lastName: 'Smith',
      street: '1431 Main St',
      city: updatedCity,
      state: 'CA',
      zipCode: '90210',
      phoneNumber: updatedPhone,
      ssn: '123-45-6789',
      username: VALID_CREDENTIALS.username,
      password: VALID_CREDENTIALS.password,
    });

    expect(updateResponse.status()).toBe(200);

    // Verify changes persisted via GET
    const fetchResponse = await bankingAPI.getCustomer(customerId);
    expect(fetchResponse.status()).toBe(200);
    const xml = await fetchResponse.text();

    const customer = parseCustomerXml(xml);
    expect(customer.city).toBe(updatedCity);
    expect(customer.phoneNumber).toBe(updatedPhone);
  });

  test('TC-API-CUST-003: [Negative] Should return error when querying non-existent customer ID', async () => {
    const nonExistentId = '99999999';
    const response = await bankingAPI.getCustomer(nonExistentId);
    expect([400, 404]).toContain(response.status());
    const body = await response.text();
    expect(body).not.toContain('<firstName>');
  });

  test('TC-API-CUST-004: [Negative] Should handle invalid alphanumeric customer ID format', async () => {
    const invalidId = 'invalid_customer_id';
    const response = await bankingAPI.getCustomer(invalidId);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-CUST-005: [Edge Case] Should update phone number while preserving other profile fields', async () => {
    // 1. Fetch current profile state
    const currentRes = await bankingAPI.getCustomer(customerId);
    expect(currentRes.status()).toBe(200);
    const currentCustomer = parseCustomerXml(await currentRes.text());

    // 2. Read-Modify-Write: update only phone number while preserving other mandatory fields
    const newPhone = '555-9999';
    const updateResponse = await bankingAPI.updateCustomer(customerId, {
      firstName: currentCustomer.firstName,
      lastName: currentCustomer.lastName,
      street: currentCustomer.street || '1431 Main St',
      city: currentCustomer.city || 'Beverly Hills',
      state: currentCustomer.state || 'CA',
      zipCode: currentCustomer.zipCode || '90210',
      ssn: currentCustomer.ssn || '123-45-6789',
      phoneNumber: newPhone,
      username: VALID_CREDENTIALS.username,
      password: VALID_CREDENTIALS.password,
    });

    // 3. Strict 200 OK assertion - no ambiguous status arrays
    expect(updateResponse.status()).toBe(200);

    // 4. Verify phone number was updated while other fields remained intact
    const verifyRes = await bankingAPI.getCustomer(customerId);
    expect(verifyRes.status()).toBe(200);
    const updatedCustomer = parseCustomerXml(await verifyRes.text());

    expect(updatedCustomer.phoneNumber).toBe(newPhone);
    expect(updatedCustomer.firstName).toBe(currentCustomer.firstName);
    expect(updatedCustomer.lastName).toBe(currentCustomer.lastName);
  });
});
