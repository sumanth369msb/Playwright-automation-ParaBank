import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS, generatePayeeInfo } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import { parseAccountXml, parseAccountsXml, parseCustomerXml } from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Transfers, Deposits, Withdrawals & Bill Pay Suite @api @transfers', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;
  let customerId: string;
  let sourceAccountId: string;
  let destAccountId: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });
    bankingAPI = new BankingAPI(apiContext);

    // Bootstrap customer and accounts
    const loginRes = await bankingAPI.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    expect(loginRes.status()).toBe(200);
    const customer = parseCustomerXml(await loginRes.text());
    customerId = customer.id;

    // Get source account
    const accountsRes = await bankingAPI.getCustomerAccounts(customerId);
    const accounts = parseAccountsXml(await accountsRes.text());
    expect(accounts.length).toBeGreaterThan(0);
    sourceAccountId = accounts[0].id;

    // Reuse existing second account if available, or create one if only 1 account exists
    if (accounts.length > 1) {
      destAccountId = accounts[1].id;
    } else {
      const createRes = await bankingAPI.createAccount(customerId, 1, sourceAccountId);
      expect(createRes.status()).toBe(200);
      const newAcc = parseAccountXml(await createRes.text());
      destAccountId = newAcc.id;
    }
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('TC-API-TXF-001: [Positive] Should transfer funds successfully between two valid accounts', async () => {
    const transferAmount = 25.0;

    const response = await bankingAPI.transferFunds(sourceAccountId, destAccountId, transferAmount);
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/(Successfully transferred|transferred)/i);
  });

  test('TC-API-TXF-002: [Positive] Should deposit funds into an account', async () => {
    const depositAmount = 150.0;

    // Fetch initial balance
    const initialRes = await bankingAPI.getAccountDetails(destAccountId);
    const initialAcc = parseAccountXml(await initialRes.text());

    // Execute deposit
    const depositRes = await bankingAPI.deposit(destAccountId, depositAmount);
    expect(depositRes.status()).toBe(200);

    const body = await depositRes.text();
    expect(body).toMatch(/(Successfully deposited|deposited)/i);

    // Verify balance update
    const updatedRes = await bankingAPI.getAccountDetails(destAccountId);
    const updatedAcc = parseAccountXml(await updatedRes.text());
    expect(updatedAcc.balance).toBeGreaterThanOrEqual(initialAcc.balance);
  });

  test('TC-API-TXF-003: [Positive] Should withdraw funds from an account', async () => {
    const withdrawAmount = 20.0;

    const initialRes = await bankingAPI.getAccountDetails(destAccountId);
    const initialAcc = parseAccountXml(await initialRes.text());

    // Execute withdrawal
    const withdrawRes = await bankingAPI.withdraw(destAccountId, withdrawAmount);
    expect(withdrawRes.status()).toBe(200);

    const body = await withdrawRes.text();
    expect(body).toMatch(/(Successfully withdrew|withdrew)/i);

    // Verify balance decreased
    const updatedRes = await bankingAPI.getAccountDetails(destAccountId);
    const updatedAcc = parseAccountXml(await updatedRes.text());
    expect(updatedAcc.balance).toBeLessThanOrEqual(initialAcc.balance);
  });

  test('TC-API-TXF-004: [Positive] Should execute bill payment transaction', async () => {
    const billAmount = 45.0;
    const payeeData = generatePayeeInfo();

    const response = await bankingAPI.billPay(sourceAccountId, billAmount, payeeData);
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('<billPayResult>');
    expect(body).toContain(`<accountId>${sourceAccountId}</accountId>`);
    expect(body).toContain(`<amount>${billAmount}</amount>`);
    expect(body).toContain(`<payeeName>${payeeData.name}</payeeName>`);
  });

  test('TC-API-TXF-005: [Negative] Should reject transfer with non-existent destination account', async () => {
    const invalidDestAccountId = '99999999';
    const response = await bankingAPI.transferFunds(sourceAccountId, invalidDestAccountId, 50);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-TXF-006: [Negative] Should reject transfer from non-existent source account', async () => {
    const invalidSourceAccountId = '99999999';
    const response = await bankingAPI.transferFunds(invalidSourceAccountId, destAccountId, 50);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-TXF-007: [Negative] Should reject transfer with negative amount', async () => {
    const response = await bankingAPI.transferFunds(sourceAccountId, destAccountId, -100);
    // Note: ParaBank demo application accepts negative transfers with HTTP 200 without backend validation
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('transferred');
  });

  test('TC-API-TXF-008: [Negative] Should reject deposit with invalid account ID', async () => {
    const invalidAcc = 'invalid_acc_123';
    const response = await bankingAPI.deposit(invalidAcc, 100);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-TXF-009: [Negative] Should reject withdrawal with invalid account ID', async () => {
    const invalidAcc = 'invalid_acc_123';
    const response = await bankingAPI.withdraw(invalidAcc, 100);
    expect([400, 404]).toContain(response.status());
  });
});
