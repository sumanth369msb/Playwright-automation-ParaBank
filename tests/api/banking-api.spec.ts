import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS as CREDS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';
import {
  parseAccountXml,
  parseAccountsXml,
  parseCustomerXml,
  parseLoanResponseXml,
  parseTransactionsXml,
} from '../../src/utils/xml-parser';

let bankingAPI: BankingAPI;
let customerId: string;
let primaryAccountId: string;
let createdAccountId: string;

test.describe.serial('Banking REST API End-to-End Workflow Suite @api @regression', () => {
  let apiContext!: APIRequestContext;

  test.beforeAll(async () => {
    // Manually create APIRequestContext since test fixtures can't be shared from beforeAll
    apiContext = await request.newContext({
      baseURL: BASE_URL,
    });
    bankingAPI = new BankingAPI(apiContext);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('STEP 1: Authenticate and retrieve customer profile via REST API', async () => {
    const response = await bankingAPI.login(CREDS.username, CREDS.password);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain('<customer>');

    const customer = parseCustomerXml(xml);
    expect(customer.id).toBeTruthy();
    expect(customer.firstName).toBeTruthy();
    customerId = customer.id;
  });

  test('STEP 2: Fetch customer accounts list and identify primary funding account', async () => {
    expect(customerId).toBeDefined();

    const response = await bankingAPI.getCustomerAccounts(customerId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const accounts = parseAccountsXml(xml);
    expect(accounts.length).toBeGreaterThan(0);

    primaryAccountId = accounts[0].id;
    expect(primaryAccountId).toBeTruthy();
  });

  test('STEP 3: Retrieve and verify specific account balance and details', async () => {
    expect(primaryAccountId).toBeDefined();

    const response = await bankingAPI.getAccountDetails(primaryAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const account = parseAccountXml(xml);
    expect(account.id).toBe(primaryAccountId);
    expect(typeof account.balance).toBe('number');
  });

  test('STEP 4: Create a new savings account via API', async () => {
    expect(customerId).toBeDefined();
    expect(primaryAccountId).toBeDefined();

    // Account type 1 = SAVINGS in ParaBank
    const response = await bankingAPI.createAccount(customerId, 1, primaryAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const newAccount = parseAccountXml(xml);
    expect(newAccount.id).toBeTruthy();
    createdAccountId = newAccount.id;
  });

  test('STEP 5: Deposit funds into the newly created account', async () => {
    expect(createdAccountId).toBeDefined();

    const depositAmount = 250;
    const response = await bankingAPI.deposit(createdAccountId, depositAmount);
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/(Successfully deposited|deposited)/i);
  });

  test('STEP 6: Transfer funds from primary account to newly created account', async () => {
    expect(primaryAccountId).toBeDefined();
    expect(createdAccountId).toBeDefined();

    const transferAmount = 75;
    const response = await bankingAPI.transferFunds(primaryAccountId, createdAccountId, transferAmount);
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/(Successfully transferred|transferred)/i);
  });

  test('STEP 7: Query account transactions to verify the posted transfer', async () => {
    expect(createdAccountId).toBeDefined();

    const response = await bankingAPI.getAccountTransactions(createdAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const transactions = parseTransactionsXml(xml);
    expect(Array.isArray(transactions)).toBeTruthy();
  });

  test('STEP 8: Submit a loan application using the funded account for down payment', async () => {
    expect(customerId).toBeDefined();
    expect(primaryAccountId).toBeDefined();

    const loanAmount = 2000;
    const downPayment = 200;

    const response = await bankingAPI.requestLoan(customerId, loanAmount, downPayment, primaryAccountId);
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const loanResponse = parseLoanResponseXml(xml);
    expect(xml).toMatch(/loanResponse/);
    expect(typeof loanResponse.approved).toBe('boolean');
  });

  test('STEP 9: Reset test database state to maintain clean environment', async () => {
    const response = await bankingAPI.cleanDB();
    expect(response.status()).toBe(204);
  });
});
