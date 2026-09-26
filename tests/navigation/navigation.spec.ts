import { test, expect } from '../../src/fixtures/banking-fixtures';
import { BASE_URL } from '../../src/utils/constants';

test.describe('Navigation @regression @navigation', () => {
  test('should display all navigation links when logged in', async ({ authenticatedPage, navigation }) => {
    await expect(navigation.accountsOverviewLink).toBeVisible();
    await expect(navigation.transferFundsLink).toBeVisible();
    await expect(navigation.billPayLink).toBeVisible();
  });

  test('should navigate to each section correctly', async ({ authenticatedPage, navigation, page }) => {
    await navigation.goToTransferFunds();
    await expect(page).toHaveURL(/transfer/);
    
    await navigation.goToBillPay();
    await expect(page).toHaveURL(/billpay/);
  });

  test('should show welcome message with username', async ({ authenticatedPage, navigation }) => {
    await expect(navigation.welcomeMessage).toBeVisible();
  });

  test('should hide navigation links when logged out', async ({ loginPage, navigation, page }) => {
    await page.goto(BASE_URL);
    await expect(navigation.logoutLink).not.toBeVisible();
  });

  test('should display correct page titles', async ({ authenticatedPage, navigation, page }) => {
    await navigation.goToAccountsOverview();
    expect(await page.title()).toContain('ParaBank');
  });
});
