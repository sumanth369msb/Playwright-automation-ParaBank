import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import {
  parseAccountXml,
  parseAccountsXml,
  parseCustomerXml,
  parseTransactionXml,
  parseTransactionsXml,
} from '../../src/utils/xml-parser';

test.describe('ParaBank REST API - Transaction Inquiries & Search Suite @api @transactions', () => {
  let apiContext: APIRequestContext;
  let bankingAPI: BankingAPI;
  let customerId: string;
  let accountId: string;
  let sampleTransactionId: string;
  let sampleTransactionAmount: number;
  let sampleTransactionDate: string;

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
    accountId = accounts[0].id;

    // Generate a fresh transaction to ensure account has at least one record
    await bankingAPI.deposit(accountId, 75.0);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('TC-API-TXN-001: [Positive] Should retrieve all transactions for an account', async () => {
    const response = await bankingAPI.getAccountTransactions(accountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const transactions = parseTransactionsXml(xml);

    // Assert transactions exist or list structure is valid
    if (transactions.length > 0) {
      const firstTx = transactions[0];
      expect(firstTx.id).toBeTruthy();
      expect(firstTx.accountId).toBe(accountId);
      expect(firstTx.type).toBeTruthy();
      expect(typeof firstTx.amount).toBe('number');

      sampleTransactionId = firstTx.id;
      sampleTransactionAmount = firstTx.amount;
      sampleTransactionDate = firstTx.date;
    }
  });

  test('TC-API-TXN-002: [Positive] Should retrieve single transaction details by ID', async () => {
    // If no transaction was populated yet, do a quick deposit to produce one
    if (!sampleTransactionId) {
      await bankingAPI.deposit(accountId, 100);
      const res = await bankingAPI.getAccountTransactions(accountId);
      const txs = parseTransactionsXml(await res.text());
      expect(txs.length).toBeGreaterThan(0);
      sampleTransactionId = txs[0].id;
    }

    const response = await bankingAPI.getTransactionById(sampleTransactionId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const transaction = parseTransactionXml(xml);

    expect(transaction.id).toBe(sampleTransactionId);
    expect(transaction.amount).toBeDefined();
    expect(transaction.description).toBeTruthy();
  });

  test('TC-API-TXN-003: [Positive] Should find transactions filtered by specific amount', async () => {
    const targetAmount = sampleTransactionAmount || 75.0;

    const response = await bankingAPI.getTransactionsByAmount(accountId, targetAmount);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const transactions = parseTransactionsXml(xml);

    for (const tx of transactions) {
      expect(tx.amount).toBe(targetAmount);
    }
  });

  test('TC-API-TXN-004: [Positive] Should filter transactions by specific date', async () => {
    // ParaBank accepts MM-DD-YYYY or date string
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;

    const response = await bankingAPI.getTransactionsByDate(accountId, formattedDate);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toBeDefined();
  });

  test('TC-API-TXN-005: [Positive] Should filter transactions across date range', async () => {
    const fromDate = '01-01-2020';
    const toDate = '12-31-2030';

    const response = await bankingAPI.getTransactionsByDateRange(accountId, fromDate, toDate);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const transactions = parseTransactionsXml(xml);
    expect(Array.isArray(transactions)).toBeTruthy();
  });

  test('TC-API-TXN-006: [Positive] Should filter transactions by month and transaction type', async () => {
    const response = await bankingAPI.getTransactionsByMonthAndType(accountId, 'All', 'All');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const transactions = parseTransactionsXml(xml);
    expect(Array.isArray(transactions)).toBeTruthy();
  });

  test('TC-API-TXN-007: [Negative] Should handle query for non-existent transaction ID', async () => {
    const nonExistentTxId = '99999999';
    const response = await bankingAPI.getTransactionById(nonExistentTxId);
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-TXN-008: [Negative] Should reject malformed transaction query date', async () => {
    const response = await bankingAPI.getTransactionsByDate(accountId, 'invalid-date');
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-TXN-009: [Negative] Should return error for non-existent account transactions', async () => {
    const nonExistentAccount = '99999999';
    const response = await bankingAPI.getAccountTransactions(nonExistentAccount);
    expect([400, 404]).toContain(response.status());
  });
});
