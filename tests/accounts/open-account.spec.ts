import { test, expect } from '../../src/fixtures/banking-fixtures';
import { ACCOUNT_TYPES } from '../../src/utils/constants';

test.describe('Accounts - Open New Account', () => {
  
  test.beforeEach(async ({ authenticatedPage, navigation }) => {
    await navigation.goToOpenNewAccount();
  });

  test('should open a new checking account @smoke @critical', async ({ openNewAccountPage }) => {
    await test.step('Select account type and minimum deposit account', async () => {
      await openNewAccountPage.selectAccountType(ACCOUNT_TYPES.CHECKING);
      await openNewAccountPage.selectFromAccount(0); // Select first available account
    });
    
    await test.step('Submit open account form', async () => {
      await openNewAccountPage.submit();
    });
    
    await test.step('Verify success', async () => {
      expect(await openNewAccountPage.isSuccessMessageVisible()).toBeTruthy();
    });
  });

  test('should open a new savings account @smoke', async ({ openNewAccountPage }) => {
    await test.step('Select savings account type', async () => {
      await openNewAccountPage.selectAccountType(ACCOUNT_TYPES.SAVINGS);
      await openNewAccountPage.selectFromAccount(0);
    });
    
    await test.step('Submit form', async () => {
      await openNewAccountPage.submit();
    });
    
    await test.step('Verify success', async () => {
      expect(await openNewAccountPage.isSuccessMessageVisible()).toBeTruthy();
    });
  });

  test('should display new account ID after creation @regression', async ({ openNewAccountPage }) => {
    await test.step('Create account', async () => {
      await openNewAccountPage.selectAccountType(ACCOUNT_TYPES.CHECKING);
      await openNewAccountPage.selectFromAccount(0);
      await openNewAccountPage.submit();
    });
    
    await test.step('Verify account ID format', async () => {
      const accountId = await openNewAccountPage.getNewAccountId();
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d+$/);
    });
  });

  test('should show success message after opening account @regression', async ({ openNewAccountPage }) => {
    await test.step('Create account', async () => {
      await openNewAccountPage.selectAccountType(ACCOUNT_TYPES.SAVINGS);
      await openNewAccountPage.selectFromAccount(0);
      await openNewAccountPage.submit();
    });
    
    await test.step('Verify success message text', async () => {
      const message = await openNewAccountPage.getSuccessMessageText();
      expect(message).toContain('Congratulations, your account is now open.');
    });
  });

  test('should navigate to new account details @smoke', async ({ openNewAccountPage, accountDetailsPage }) => {
    let newAccountId: string;
    
    await test.step('Create account and get ID', async () => {
      await openNewAccountPage.selectAccountType(ACCOUNT_TYPES.CHECKING);
      await openNewAccountPage.selectFromAccount(0);
      await openNewAccountPage.submit();
      newAccountId = await openNewAccountPage.getNewAccountId();
    });
    
    await test.step('Click new account ID link', async () => {
      await openNewAccountPage.clickNewAccountId();
    });
    
    await test.step('Verify navigation to details page', async () => {
      await accountDetailsPage.waitForLoad();
      expect(await accountDetailsPage.getAccountId()).toEqual(newAccountId);
    });
  });
});
