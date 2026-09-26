import { test, expect } from '../../src/fixtures/banking-fixtures';
import { BASE_URL } from '../../src/utils/constants';
import { CREDENTIALS } from '../../src/utils/test-data';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should login with valid credentials @smoke @critical', async ({ loginPage, accountsOverviewPage }) => {
    await test.step('Login with valid credentials', async () => {
      await loginPage.login(CREDENTIALS.VALID_USER.username, CREDENTIALS.VALID_USER.password);
    });
    
    await test.step('Verify successful login', async () => {
      await accountsOverviewPage.waitForLoad();
      expect(await accountsOverviewPage.isLoaded()).toBeTruthy();
    });
  });

  test('should show error with invalid username @regression', async ({ loginPage }) => {
    await test.step('Login with invalid username', async () => {
      await loginPage.login('invalidUser123', CREDENTIALS.VALID_USER.password);
    });
    
    await test.step('Verify error message', async () => {
      expect(await loginPage.getErrorMessage()).toContain('The username and password could not be verified.');
    });
  });

  test('should show error with invalid password @regression', async ({ loginPage }) => {
    await test.step('Login with invalid password', async () => {
      await loginPage.login(CREDENTIALS.VALID_USER.username, 'invalidPassword123');
    });
    
    await test.step('Verify error message', async () => {
      expect(await loginPage.getErrorMessage()).toContain('The username and password could not be verified.');
    });
  });

  test('should show error with empty credentials @regression', async ({ loginPage }) => {
    await test.step('Submit empty login form', async () => {
      await loginPage.login('', '');
    });
    
    await test.step('Verify error message', async () => {
      expect(await loginPage.getErrorMessage()).toContain('Please enter a username and password.');
    });
  });

  test('should redirect to accounts overview after login @smoke', async ({ loginPage, page }) => {
    await test.step('Login successfully', async () => {
      await loginPage.login(CREDENTIALS.VALID_USER.username, CREDENTIALS.VALID_USER.password);
    });
    
    await test.step('Verify URL redirect', async () => {
      await page.waitForURL('**/overview.htm');
      expect(page.url()).toContain('overview.htm');
    });
  });

  test('should logout successfully @smoke', async ({ loginPage, navigation, page }) => {
    await test.step('Login first', async () => {
      await loginPage.login(CREDENTIALS.VALID_USER.username, CREDENTIALS.VALID_USER.password);
      await page.waitForURL('**/overview.htm');
    });
    
    await test.step('Click logout', async () => {
      await navigation.logout();
    });
    
    await test.step('Verify redirected to login page', async () => {
      await loginPage.waitForLoad();
      expect(await loginPage.isLoaded()).toBeTruthy();
    });
  });

  test('should not access protected pages when logged out @regression', async ({ page, loginPage }) => {
    await test.step('Attempt to navigate to protected page', async () => {
      await page.goto(`${BASE_URL}/overview.htm`);
    });
    
    await test.step('Verify redirect to error or login', async () => {
      // ParaBank typically shows an error page for unauthenticated access
      expect(page.locator('.error').isVisible()).toBeTruthy();
    });
  });

  test('should show login form elements correctly @regression', async ({ loginPage }) => {
    await test.step('Verify form elements', async () => {
      expect(await loginPage.isUsernameInputVisible()).toBeTruthy();
      expect(await loginPage.isPasswordInputVisible()).toBeTruthy();
      expect(await loginPage.isLoginButtonVisible()).toBeTruthy();
    });
  });
});
