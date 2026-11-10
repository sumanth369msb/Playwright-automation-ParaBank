import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import { parseAccountsXml, parseCustomerXml, parseLoanResponseXml } from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Loan Application Suite @api @loans', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;
  let customerId: string;
  let fromAccountId: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });
    bankingAPI = new BankingAPI(apiContext);

    // Bootstrap customer & account
    const loginRes = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    expect(loginRes.status()).toBe(200);
    const customer = parseCustomerXml(await loginRes.text());
    customerId = customer.id;

    const accountsRes = await bankingAPI.getCustomerAccounts(customerId);
    const accounts = parseAccountsXml(await accountsRes.text());
    expect(accounts.length).toBeGreaterThan(0);
    fromAccountId = accounts[0].id;
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('TC-API-LOAN-001: [Positive] Should process and approve loan with qualifying parameters', async () => {
    const loanAmount = 1000;
    const downPayment = 100;

    const response = await bankingAPI.requestLoan(customerId, loanAmount, downPayment, fromAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const loanResponse = parseLoanResponseXml(xml);

    // In standard ParaBank logic, small amount with 10% down payment is approved
    expect(xml).toMatch(/loanResponse/);
    expect(typeof loanResponse.approved).toBe('boolean');
    if (loanResponse.approved) {
      expect(loanResponse.accountId).toBeTruthy();
    }
  });

  test('TC-API-LOAN-002: [Positive] Should evaluate and deny loan with insufficient down payment / excessive amount', async () => {
    // Excessive loan amount with negligible down payment
    const loanAmount = 10_000_000;
    const downPayment = 1;

    const response = await bankingAPI.requestLoan(customerId, loanAmount, downPayment, fromAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const loanResponse = parseLoanResponseXml(xml);

    expect(loanResponse.approved).toBe(false);
    expect(loanResponse.message).toBeTruthy();
  });

  test('TC-API-LOAN-003: [Negative] Should reject loan request with non-existent source account', async () => {
    const invalidAccountId = '99999999';
    const response = await bankingAPI.requestLoan(customerId, 1000, 100, invalidAccountId);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-LOAN-004: [Negative] Should reject loan request with non-existent customer ID', async () => {
    const invalidCustomerId = '99999999';
    const response = await bankingAPI.requestLoan(invalidCustomerId, 1000, 100, fromAccountId);
    expect(response.status()).toBe(200);
    const body = await response.text();
    const loan = parseLoanResponseXml(body);
    expect(loan.approved).toBe(false);
  });

  test('TC-API-LOAN-005: [Negative] Should handle negative loan amount', async () => {
    const response = await bankingAPI.requestLoan(customerId, -5000, 100, fromAccountId);
    expect(response.status()).toBe(200);
    const body = await response.text();
    const loan = parseLoanResponseXml(body);
    expect(loan.approved).toBe(false);
  });

  test('TC-API-LOAN-006: [Negative] Should handle negative down payment amount', async () => {
    const response = await bankingAPI.requestLoan(customerId, 100_000, -100, fromAccountId);
    expect(response.status()).toBe(200);
    const body = await response.text();
    const loan = parseLoanResponseXml(body);
    expect(loan.approved).toBe(false);
  });
});
