import { test, expect } from '../../src/fixtures/banking-fixtures';
import { generateUser } from '../../src/utils/test-data';
import { BASE_URL } from '../../src/utils/constants';

test.describe('Authentication - Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should register a new user successfully @smoke @critical', async ({ registerPage, loginPage }) => {
    const newUser = generateUser();
    
    await test.step('Navigate to registration', async () => {
      await loginPage.clickRegister();
      await registerPage.waitForLoad();
    });
    
    await test.step('Fill and submit registration form', async () => {
      await registerPage.fillRegistrationForm(newUser);
      await registerPage.submitRegistration();
    });
    
    await test.step('Verify successful registration message', async () => {
      const message = await registerPage.getSuccessMessage();
      expect(message).toContain('Your account was created successfully');
    });
  });

  test('should show error for duplicate username @regression', async ({ registerPage, loginPage, navigation }) => {
    const newUser = generateUser();
    
    await test.step('Navigate to registration and register user', async () => {
      await loginPage.clickRegister();
      await registerPage.fillRegistrationForm(newUser);
      await registerPage.submitRegistration();
      await navigation.logout();
    });
    
    await test.step('Attempt to register same user again', async () => {
      await loginPage.clickRegister();
      await registerPage.fillRegistrationForm(newUser);
      await registerPage.submitRegistration();
    });
    
    await test.step('Verify duplicate username error', async () => {
      const error = await registerPage.getUsernameError();
      expect(error).toContain('This username already exists');
    });
  });

  test('should show error for mismatched passwords @regression', async ({ registerPage, loginPage }) => {
    const newUser = generateUser();
    (newUser as any).confirmPassword = 'mismatchedPassword123';
    
    await test.step('Navigate to registration', async () => {
      await loginPage.clickRegister();
    });
    
    await test.step('Fill registration form with mismatched passwords', async () => {
      await registerPage.fillRegistrationForm(newUser);
      await registerPage.submitRegistration();
    });
    
    await test.step('Verify password mismatch error', async () => {
      const error = await registerPage.getPasswordMatchError();
      expect(error).toContain('Passwords did not match');
    });
  });

  test('should show error for missing required fields @regression', async ({ registerPage, loginPage }) => {
    await test.step('Navigate to registration', async () => {
      await loginPage.clickRegister();
    });
    
    await test.step('Submit empty registration form', async () => {
      await registerPage.submitRegistration();
    });
    
    await test.step('Verify required field errors', async () => {
      await expect(registerPage.getFirstNameError()).toBeVisible();
      await expect(registerPage.getLastNameError()).toBeVisible();
      await expect(registerPage.getAddressError()).toBeVisible();
      await expect(registerPage.getCityError()).toBeVisible();
    });
  });

  test('should navigate from login to registration page @smoke', async ({ loginPage, registerPage }) => {
    await test.step('Click register link on login page', async () => {
      await loginPage.clickRegister();
    });
    
    await test.step('Verify registration page loads', async () => {
      await registerPage.waitForLoad();
      expect(await registerPage.isLoaded()).toBeTruthy();
    });
  });
});
