import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import { parseAccountXml, parseAccountsXml, parseCustomerXml } from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Accounts Management Suite @api @accounts', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;
  let customerId: string;
  let primaryAccountId: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });
    bankingAPI = new BankingAPI(apiContext);

    // Bootstrap customer ID and primary account
    const loginRes = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    expect(loginRes.status()).toBe(200);
    const customer = parseCustomerXml(await loginRes.text());
    customerId = customer.id;

    const accountsRes = await bankingAPI.getCustomerAccounts(customerId);
    expect(accountsRes.status()).toBe(200);
    const accounts = parseAccountsXml(await accountsRes.text());
    expect(accounts.length).toBeGreaterThan(0);
    primaryAccountId = accounts[0].id;
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('TC-API-ACC-001: [Positive] Should retrieve all accounts for the customer with valid schema', async () => {
    const response = await bankingAPI.getCustomerAccounts(customerId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const accounts = parseAccountsXml(xml);

    expect(accounts.length).toBeGreaterThan(0);
    for (const acc of accounts) {
      expect(acc.id).toBeTruthy();
      expect(Number(acc.id)).toBeGreaterThan(0);
      expect(['CHECKING', 'SAVINGS', 'LOAN']).toContain(acc.type.toUpperCase());
      expect(typeof acc.balance).toBe('number');
    }
  });

  test('TC-API-ACC-002: [Positive] Should retrieve specific account details by account ID', async () => {
    expect(primaryAccountId).toBeDefined();

    const response = await bankingAPI.getAccountDetails(primaryAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const account = parseAccountXml(xml);

    expect(account.id).toBe(primaryAccountId);
    expect(account.customerId).toBe(customerId);
    expect(account.type).toBeTruthy();
    expect(account.balance).toBeDefined();
  });

  test('TC-API-ACC-003: [Positive] Should create a new CHECKING account (Type 0)', async () => {
    expect(primaryAccountId).toBeDefined();

    // 0 = CHECKING in ParaBank
    const response = await bankingAPI.createAccount(customerId, 0, primaryAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const newAccount = parseAccountXml(xml);

    expect(newAccount.id).toBeTruthy();
    expect(newAccount.id).not.toBe(primaryAccountId);
    const newlyCreatedCheckingId = newAccount.id;

    // Verify account exists in customer's account list
    const accountsRes = await bankingAPI.getCustomerAccounts(customerId);
    const accountsXml = await accountsRes.text();
    const allAccounts = parseAccountsXml(accountsXml);
    expect(allAccounts.some((a) => a.id === newlyCreatedCheckingId)).toBeTruthy();
  });

  test('TC-API-ACC-004: [Positive] Should create a new SAVINGS account (Type 1)', async () => {
    expect(primaryAccountId).toBeDefined();

    // 1 = SAVINGS in ParaBank
    const response = await bankingAPI.createAccount(customerId, 1, primaryAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const newAccount = parseAccountXml(xml);

    expect(newAccount.id).toBeTruthy();
  });

  test('TC-API-ACC-005: [Negative] Should return error when querying non-existent account ID', async () => {
    const nonExistentId = '99999999';
    const response = await bankingAPI.getAccountDetails(nonExistentId);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-ACC-006: [Negative] Should reject malformed non-numeric account ID', async () => {
    const malformedId = 'abc-xyz-invalid';
    const response = await bankingAPI.getAccountDetails(malformedId);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-ACC-007: [Negative] Should fail to create account with non-existent source account', async () => {
    const invalidSourceId = '99999999';
    const response = await bankingAPI.createAccount(customerId, 0, invalidSourceId);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-ACC-008: [Negative] Should handle query for non-existent customer accounts gracefully', async () => {
    const nonExistentCustomerId = '99999999';
    const response = await bankingAPI.getCustomerAccounts(nonExistentCustomerId);
    expect([400, 404]).toContain(response.status());
  });
});
