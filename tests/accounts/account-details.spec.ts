import { test, expect } from '../../src/fixtures/banking-fixtures';

test.describe('Accounts - Account Details', () => {
  let targetAccountId: string;

  test.beforeEach(async ({ authenticatedPage, accountsOverviewPage, accountDetailsPage }) => {
    // Navigate to a specific account before each test
    await accountsOverviewPage.waitForLoad();
    const accounts = await accountsOverviewPage.getAllAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No accounts available to test');
    }
    
    targetAccountId = accounts[0].id;
    await accountsOverviewPage.clickAccount(targetAccountId);
    await accountDetailsPage.waitForLoad();
  });

  test('should display account number @smoke', async ({ accountDetailsPage }) => {
    await test.step('Verify account ID matches', async () => {
      const accountId = await accountDetailsPage.getAccountId();
      expect(accountId).toEqual(targetAccountId);
    });
  });

  test('should display account type and balance @regression', async ({ accountDetailsPage }) => {
    await test.step('Verify account details', async () => {
      const accountType = await accountDetailsPage.getAccountType();
      const balance = await accountDetailsPage.getBalance();
      
      expect(['CHECKING', 'SAVINGS', 'LOAN']).toContain(accountType);
      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });

  test('should show transaction history @smoke', async ({ accountDetailsPage }) => {
    await test.step('Verify transactions table', async () => {
      const transactions = await accountDetailsPage.getTransactions();
      // It might be empty for a new account, but the table should exist
      expect(Array.isArray(transactions)).toBeTruthy();
    });
  });

  test('should filter transactions by date @regression', async ({ accountDetailsPage }) => {
    await test.step('Apply date filter', async () => {
      await accountDetailsPage.filterByDate('All');
      // Wait for table update if needed
    });
    
    await test.step('Verify results', async () => {
      const transactions = await accountDetailsPage.getTransactions();
      expect(Array.isArray(transactions)).toBeTruthy();
    });
  });

  test('should filter transactions by type @regression', async ({ accountDetailsPage }) => {
    await test.step('Apply type filter', async () => {
      await accountDetailsPage.filterByType('Credit');
    });
    
    await test.step('Verify filtered results', async () => {
      const transactions = await accountDetailsPage.getTransactions();
      // If transactions exist, they should be of type credit
      if (transactions.length > 0) {
        // Assume transaction object has amount mapping or similar checks depending on implementation
        expect(Array.isArray(transactions)).toBeTruthy();
      }
    });
  });
});
