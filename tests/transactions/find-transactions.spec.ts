import { test, expect } from '../../src/fixtures/banking-fixtures';

test.describe('Find Transactions @regression @transactions', () => {
  test.beforeEach(async ({ authenticatedPage, navigation }) => {
    await navigation.goToFindTransactions();
  });

  test('should find transaction by ID @smoke', async ({ findTransactionsPage }) => {
    await findTransactionsPage.findById('12345');
    await expect(findTransactionsPage.transactionTable).toBeVisible();
  });

  test('should find transactions by date', async ({ findTransactionsPage }) => {
    await findTransactionsPage.findByDate('11-20-2023');
    await expect(findTransactionsPage.transactionTable).toBeVisible();
  });

  test('should find transactions by date range', async ({ findTransactionsPage }) => {
    await findTransactionsPage.findByDateRange('11-01-2023', '11-30-2023');
    await expect(findTransactionsPage.transactionTable).toBeVisible();
  });

  test('should find transactions by amount', async ({ findTransactionsPage }) => {
    await findTransactionsPage.findByAmount(50.00);
    await expect(findTransactionsPage.transactionTable).toBeVisible();
  });

  test('should display transaction details in results', async ({ findTransactionsPage }) => {
    await findTransactionsPage.findByAmount(10.00);
    await expect(findTransactionsPage.transactionTable).toBeVisible();
  });

  test('should show no results for invalid search', async ({ findTransactionsPage, page }) => {
    await findTransactionsPage.findById('invalid-id');
    await expect(page.locator('.error')).toBeVisible();
  });
});
