import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import { parseCustomerXml, parseAccountsXml } from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Database & Administration Suite @api @admin', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });
    bankingAPI = new BankingAPI(apiContext);
  });

  test.afterAll(async () => {
    // Ensure database is always left in initialized state for other suites/workers
    await bankingAPI.initializeDB();
    await apiContext.dispose();
  });

  test('TC-API-ADM-001: [Positive] Should successfully execute cleanDB to reset database', async () => {
    const response = await bankingAPI.cleanDB();
    expect(response.status()).toBe(204);
    // Restore DB immediately so other parallel workers are not starved of test data
    await bankingAPI.initializeDB();
  });

  test('TC-API-ADM-002: [Positive] Should successfully execute initializeDB', async () => {
    const response = await bankingAPI.initializeDB();
    expect(response.status()).toBe(204);
  });

  test('TC-API-ADM-003: [Idempotency] Should execute cleanDB multiple times idempotently without failure', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await bankingAPI.cleanDB();
      expect(response.status()).toBe(204);
    }
    // Restore DB immediately so TC-004 and other parallel workers can query intact accounts
    await bankingAPI.initializeDB();
  });

  test('TC-API-ADM-004: [State Verification] Should verify database state is intact and default user is restored', async () => {
    const loginRes = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    expect(loginRes.status()).toBe(200);

    const xml = await loginRes.text();
    const customer = parseCustomerXml(xml);
    expect(customer.id).toBeTruthy();

    const accountsRes = await bankingAPI.getCustomerAccounts(customer.id);
    expect(accountsRes.status()).toBe(200);

    const accountsXml = await accountsRes.text();
    const accounts = parseAccountsXml(accountsXml);
    expect(accounts.length).toBeGreaterThan(0);
  });
});
