import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.errorMessage = page.locator('.error');
    this.registerLink = page.locator('a[href^="register.htm"]');
    this.forgotPasswordLink = page.locator('a[href^="lookup.htm"]');
  }

  async login(username?: string, password?: string): Promise<void> {
    if (username !== undefined) await this.fillInput(this.usernameInput, username);
    if (password !== undefined) await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
    await this.waitForPageLoad();
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  async clickRegister(): Promise<void> {
    await this.clickElement(this.registerLink);
    await this.waitForPageLoad();
  }

  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
    await this.waitForPageLoad();
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible(this.usernameInput) && await this.isVisible(this.passwordInput);
  }

  async isUsernameInputVisible(): Promise<boolean> {
    return await this.isVisible(this.usernameInput);
  }

  async isPasswordInputVisible(): Promise<boolean> {
    return await this.isVisible(this.passwordInput);
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.loginButton);
  }
}
