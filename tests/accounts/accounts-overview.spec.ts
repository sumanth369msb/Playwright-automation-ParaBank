import { test, expect } from '../../src/fixtures/banking-fixtures';

test.describe('Accounts - Overview', () => {
  // Use the authenticatedPage fixture for all tests in this suite
  // which will automatically log in before the test starts
  
  test('should display accounts overview after login @smoke', async ({ authenticatedPage, accountsOverviewPage }) => {
    await test.step('Verify accounts overview page is loaded', async () => {
      await accountsOverviewPage.waitForLoad();
      expect(await accountsOverviewPage.isLoaded()).toBeTruthy();
    });
  });

  test('should show all account balances @regression', async ({ authenticatedPage, accountsOverviewPage }) => {
    await test.step('Check account balances visibility', async () => {
      const accounts = await accountsOverviewPage.getAllAccounts();
      expect(accounts.length).toBeGreaterThan(0);
      
      for (const account of accounts) {
        expect(account.balance).toBeDefined();
        expect(account.balance).toMatch(/^\$[\d,]+\.\d{2}$/);
      }
    });
  });

  test('should display total balance @regression', async ({ authenticatedPage, accountsOverviewPage }) => {
    await test.step('Verify total balance calculation', async () => {
      const totalBalance = await accountsOverviewPage.getTotalBalance();
      expect(totalBalance).toBeDefined();
      expect(typeof totalBalance).toBe('number');
    });
  });

  test('should navigate to account details on click @smoke', async ({ authenticatedPage, accountsOverviewPage, accountDetailsPage }) => {
    await test.step('Click on first account', async () => {
      const accounts = await accountsOverviewPage.getAllAccounts();
      expect(accounts.length).toBeGreaterThan(0);
      
      const firstAccountId = accounts[0].id;
      await accountsOverviewPage.clickAccount(firstAccountId);
    });
    
    await test.step('Verify account details page loaded', async () => {
      await accountDetailsPage.waitForLoad();
      expect(await accountDetailsPage.isLoaded()).toBeTruthy();
    });
  });

  test('should show correct number of accounts @regression', async ({ authenticatedPage, accountsOverviewPage }) => {
    await test.step('Count table rows matching accounts', async () => {
      const rowCount = await accountsOverviewPage.getAccountRowCount();
      const accounts = await accountsOverviewPage.getAllAccounts();
      expect(rowCount).toEqual(accounts.length);
    });
  });
});
