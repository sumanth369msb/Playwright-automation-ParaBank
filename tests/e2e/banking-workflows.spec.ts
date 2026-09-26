import { test, expect } from '../../src/fixtures/banking-fixtures';
import { generatePayeeInfo, generateRandomAmount, generateUser } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';

test.describe('Banking Workflows @e2e @critical', () => {
  test('should complete full banking workflow: login → open account → transfer → bill pay → logout', async ({ authenticatedPage, navigation, openNewAccountPage, transferFundsPage, billPayPage, page }) => {
    await test.step('Open new account', async () => {
      await navigation.goToOpenNewAccount();
      await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
      await openNewAccountPage.selectAccountType('SAVINGS');
      await openNewAccountPage.selectFromAccount(0);
      await openNewAccountPage.submit();
    });

    await test.step('Transfer funds', async () => {
      await navigation.goToTransferFunds();
      await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
      const accounts = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
      const fromAccount = accounts[0];
      const toAccount = accounts[0];
      await transferFundsPage.transferFunds(10.00, fromAccount, toAccount);
    });

    await test.step('Pay bill', async () => {
      await navigation.goToBillPay();
      const payee = generatePayeeInfo();
      await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
      const accounts = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
      const fromAccount = accounts[0];
      await billPayPage.payBill(payee, 5.00, fromAccount);
    });

    await test.step('Logout', async () => {
      await navigation.logout();
    });
  });

  test('should register and perform first transaction', async ({ registerPage, navigation, transferFundsPage, page }) => {
    await test.step('Register', async () => {
      await page.goto(`${BASE_URL}/register.htm`);
      const user = generateUser();
      await registerPage.register(user);
    });

    await test.step('First transaction', async () => {
      await navigation.goToTransferFunds();
      await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
      const accounts = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
      const fromAccount = accounts[0];
      const toAccount = accounts[0];
      await transferFundsPage.transferFunds(1.00, fromAccount, toAccount);
      await expect(transferFundsPage.successMessage).toBeVisible();
    });
  });

  test('should manage multiple accounts with transfers', async ({ authenticatedPage, navigation, openNewAccountPage, transferFundsPage, page }) => {
    await navigation.goToOpenNewAccount();
    await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
    await openNewAccountPage.selectAccountType('SAVINGS');
    await openNewAccountPage.selectFromAccount(0);
    await openNewAccountPage.submit();
    
    await navigation.goToTransferFunds();
    await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
    const accounts = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
    const fromAccount = accounts[0];
    const toAccount = accounts[0];
    await transferFundsPage.transferFunds(15.00, fromAccount, toAccount);
    await expect(transferFundsPage.successMessage).toBeVisible();
  });

  test('should apply for loan and use new account', async ({ authenticatedPage, navigation, requestLoanPage, transferFundsPage, page }) => {
    await navigation.goToRequestLoan();
    await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
    const accountsForLoan = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
    const fromAccountForLoan = accountsForLoan[0];
    await requestLoanPage.applyForLoan(5000, 500, fromAccountForLoan);
    
    await navigation.goToTransferFunds();
    await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
    const accounts = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
    const fromAccount = accounts[0];
    const toAccount = accounts[0];
    await transferFundsPage.transferFunds(100.00, fromAccount, toAccount);
  });

  test('should complete bill payment lifecycle with verification', async ({ authenticatedPage, navigation, billPayPage, findTransactionsPage, page }) => {
    const payee = generatePayeeInfo();
    const amount = generateRandomAmount(10, 50);
    
    await navigation.goToBillPay();
    await page.waitForSelector('[name="fromAccountId"] option, #fromAccountId option', { state: 'attached' });
    const accounts = await page.locator('[name="fromAccountId"] option, #fromAccountId option').allTextContents();
    const fromAccount = accounts[0];
    await billPayPage.payBill(payee, amount, fromAccount);
    
    await navigation.goToFindTransactions();
    await findTransactionsPage.findByAmount(amount);
    await expect(findTransactionsPage.transactionTable).toBeVisible();
  });
});
