import { test, expect } from '../../src/fixtures/banking-fixtures';
import { generateRandomAmount } from '../../src/utils/test-data';

test.describe('Loan Requests @regression @loans', () => {
  test.beforeEach(async ({ authenticatedPage, navigation }) => {
    await navigation.goToRequestLoan();
  });

  test('should submit a loan application @smoke', async ({ requestLoanPage, page }) => {
    const accounts = await page.locator('#fromAccountId option').allTextContents();
    await requestLoanPage.applyForLoan(1000, 100, accounts[0] || '1');
    await expect(requestLoanPage.loanStatusLabel).toBeVisible();
  });

  test('should display loan decision (approved/denied)', async ({ requestLoanPage, page }) => {
    const accounts = await page.locator('#fromAccountId option').allTextContents();
    await requestLoanPage.applyForLoan(500, 50, accounts[0] || '1');
    await expect(requestLoanPage.loanStatusLabel).toBeVisible();
  });

  test('should show new account for approved loans', async ({ requestLoanPage, page }) => {
    const accounts = await page.locator('#fromAccountId option').allTextContents();
    await requestLoanPage.applyForLoan(1000, 100, accounts[0] || '1');
    await expect(requestLoanPage.newAccountIdLink).toBeVisible();
  });

  test('should handle insufficient down payment', async ({ requestLoanPage, page }) => {
    const accounts = await page.locator('#fromAccountId option').allTextContents();
    await requestLoanPage.applyForLoan(100000, 1, accounts[0] || '1');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('should display loan application form correctly', async ({ requestLoanPage }) => {
    await expect(requestLoanPage.amountInput).toBeVisible();
    await expect(requestLoanPage.downPaymentInput).toBeVisible();
    await expect(requestLoanPage.fromAccountDropdown).toBeVisible();
  });
});
