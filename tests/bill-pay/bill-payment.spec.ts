import { test, expect } from '../../src/fixtures/banking-fixtures';
import { generatePayeeInfo, generateRandomAmount } from '../../src/utils/test-data';

test.describe('Bill Payment @regression @billpay', () => {
  test.beforeEach(async ({ authenticatedPage, navigation }) => {
    await navigation.goToBillPay();
  });

  test('should pay a bill successfully @smoke', async ({ billPayPage }) => {
    const payee = generatePayeeInfo();
    const amount = generateRandomAmount(20, 100);
    const accounts = await billPayPage.getAvailableAccounts();
    await billPayPage.payBill(payee, amount, accounts[0]);
    await expect(billPayPage.successMessage).toBeVisible();
  });

  test('should show success message with payee name', async ({ billPayPage }) => {
    const payee = generatePayeeInfo();
    const accounts = await billPayPage.getAvailableAccounts();
    await billPayPage.payBill(payee, 10.00, accounts[0]);
    const msg = await billPayPage.getSuccessMessage();
    expect(msg).toContain(payee.name);
  });

  test('should show success message with correct amount', async ({ billPayPage }) => {
    const payee = generatePayeeInfo();
    const amount = 55.50;
    const accounts = await billPayPage.getAvailableAccounts();
    await billPayPage.payBill(payee, amount, accounts[0]);
    const msg = await billPayPage.getSuccessMessage();
    expect(msg).toMatch(new RegExp(`\\$?55.50`));
  });

  test('should validate required payee fields', async ({ billPayPage, page }) => {
    await billPayPage.submitPayment();
    await expect(page.locator('.error').first()).toBeVisible();
  });

  test('should verify account number match validation', async ({ billPayPage, page }) => {
    const payee = generatePayeeInfo();
    await billPayPage.fillPayeeInfo(payee);
    await billPayPage.verifyAccountInput.fill('different123');
    await billPayPage.submitPayment();
    await expect(page.locator('#validationModel-verifyAccount-mismatch, #validationModel-verifyAccount-invalid').first()).toBeVisible();
  });

  test('should pay bill with minimum amount', async ({ billPayPage }) => {
    const payee = generatePayeeInfo();
    const accounts = await billPayPage.getAvailableAccounts();
    await billPayPage.payBill(payee, 0.01, accounts[0]);
    await expect(billPayPage.successMessage).toBeVisible();
  });

  test('should display available accounts for payment', async ({ billPayPage }) => {
    await expect(billPayPage.fromAccountDropdown).toBeVisible();
  });
});
