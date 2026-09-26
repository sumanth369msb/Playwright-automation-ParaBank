import { test, expect, request, APIRequestContext } from '@playwright/test';
import { BankingAPI } from '../../src/api/BankingAPI';
import { VALID_CREDENTIALS as CREDS } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';

let bankingAPI: BankingAPI;
let customerId: string;
let primaryAccountId: string;

test.describe.serial('Banking REST API Automation @api @regression', () => {
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

  test('should successfully authenticate and retrieve customer details via API', async () => {
    const response = await bankingAPI.login(CREDS.username, CREDS.password);
    
    // Assert HTTP status
    expect(response.status()).toBe(200);
    
    // ParaBank returns XML. Extracting data securely using string matching and basic regex
    const text = await response.text();
    expect(text).toContain('<customer>');
    expect(text).toContain('<firstName>');
    
    // Extract customerId for the next tests
    const idMatch = text.match(/<id>(\d+)<\/id>/);
    expect(idMatch).not.toBeNull();
    customerId = idMatch![1];
  });

  test('should fetch customer accounts successfully', async () => {
    // Ensure previous test passed and populated customerId
    expect(customerId).toBeDefined();

    const response = await bankingAPI.getCustomerAccounts(customerId);
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text).toContain('<account>');
    
    // Extract the first account ID to use as a funding account
    const accountMatch = text.match(/<id>(\d+)<\/id>/);
    expect(accountMatch).not.toBeNull();
    primaryAccountId = accountMatch![1];
  });

  test('should retrieve specific account details', async () => {
    expect(primaryAccountId).toBeDefined();

    const response = await bankingAPI.getAccountDetails(primaryAccountId);
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toContain(`<id>${primaryAccountId}</id>`);
    expect(text).toContain('<balance>');
  });

  test('should create a new savings account via API', async () => {
    expect(customerId).toBeDefined();
    expect(primaryAccountId).toBeDefined();
    
    // Account type 1 = SAVINGS in ParaBank
    const response = await bankingAPI.createAccount(customerId, 1, primaryAccountId);
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    // Verify successful creation response format
    expect(text).toContain('<id>');
  });

  test('should successfully transfer funds between accounts', async () => {
    expect(customerId).toBeDefined();
    expect(primaryAccountId).toBeDefined();
    
    // 1. Create a destination account first
    const createRes = await bankingAPI.createAccount(customerId, 1, primaryAccountId);
    const createText = await createRes.text();
    const destMatch = createText.match(/<id>(\d+)<\/id>/);
    const destAccountId = destMatch ? destMatch[1] : primaryAccountId;

    // 2. Perform the transfer
    const transferAmount = 50;
    const response = await bankingAPI.transferFunds(primaryAccountId, destAccountId, transferAmount);
    
    expect(response.status()).toBe(200);
    
    // 3. Verify transfer response
    const text = await response.text();
    expect(text).toContain('Successfully transferred');
    expect(text).toContain(`$${transferAmount}`);
  });
});
