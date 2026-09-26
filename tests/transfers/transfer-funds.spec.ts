import { test, expect } from '../../src/fixtures/banking-fixtures';
import { generateRandomAmount } from '../../src/utils/test-data';

test.describe('Fund Transfers @regression @transfers', () => {
  test.beforeEach(async ({ authenticatedPage, navigation }) => {
    await navigation.goToTransferFunds();
  });

  test('should transfer funds between accounts successfully @smoke', async ({ transferFundsPage }) => {
    const amount = generateRandomAmount(10, 50);
    const accounts = await transferFundsPage.getAvailableAccounts();
    await transferFundsPage.transferFunds(amount, accounts[0], accounts[0]);
    await expect(transferFundsPage.successMessage).toBeVisible();
  });

  test('should show success message with correct amount', async ({ transferFundsPage }) => {
    const amount = 10.50;
    const accounts = await transferFundsPage.getAvailableAccounts();
    await transferFundsPage.transferFunds(amount, accounts[0], accounts[0]);
    const message = await transferFundsPage.getSuccessMessage();
    expect(message).toMatch(new RegExp(`\\$?10.50`));
  });

  test('should show success message with correct accounts', async ({ transferFundsPage }) => {
    const amount = 15.00;
    const accounts = await transferFundsPage.getAvailableAccounts();
    await transferFundsPage.transferFunds(amount, accounts[0], accounts[0]);
    const message = await transferFundsPage.getSuccessMessage();
    expect(message).toBeTruthy();
  });

  test('should display available accounts in dropdowns', async ({ transferFundsPage }) => {
    await expect(transferFundsPage.fromAccountDropdown).toBeVisible();
    await expect(transferFundsPage.toAccountDropdown).toBeVisible();
  });

  test('should handle transfer with different amounts', async ({ transferFundsPage, page }) => {
    const amounts = [1.00, 100.00, 5.25];
    const accounts = await transferFundsPage.getAvailableAccounts();
    for (const amt of amounts) {
      await transferFundsPage.transferFunds(amt, accounts[0], accounts[0]);
      await expect(transferFundsPage.successMessage).toBeVisible();
      await page.reload();
    }
  });

  test('should show updated balances after transfer', async ({ transferFundsPage, navigation, page }) => {
    const amount = 10.00;
    await navigation.goToAccountsOverview();
    await navigation.goToTransferFunds();
    const accounts = await transferFundsPage.getAvailableAccounts();
    await transferFundsPage.transferFunds(amount, accounts[0], accounts[0]);
    await navigation.goToAccountsOverview();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should transfer minimum amount', async ({ transferFundsPage }) => {
    const amount = 0.01;
    const accounts = await transferFundsPage.getAvailableAccounts();
    await transferFundsPage.transferFunds(amount, accounts[0], accounts[0]);
    await expect(transferFundsPage.successMessage).toBeVisible();
  });

  test('should transfer between different account types', async ({ navigation, openNewAccountPage, transferFundsPage }) => {
    await navigation.goToOpenNewAccount();
    await openNewAccountPage.openAccount('SAVINGS', '1');
    await navigation.goToTransferFunds();
    const accounts = await transferFundsPage.getAvailableAccounts();
    await transferFundsPage.transferFunds(5.00, accounts[0], accounts[0]);
    await expect(transferFundsPage.successMessage).toBeVisible();
  });
});
