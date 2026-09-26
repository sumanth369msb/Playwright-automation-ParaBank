import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class OpenNewAccountPage extends BasePage {
  readonly accountTypeDropdown: Locator;
  readonly fromAccountDropdown: Locator;
  readonly openButton: Locator;
  readonly successMessage: Locator;
  readonly newAccountIdLink: Locator;

  constructor(page: Page) {
    super(page);
    this.accountTypeDropdown = page.locator('#type');
    this.fromAccountDropdown = page.locator('#fromAccountId');
    this.openButton = page.locator('input[value="Open New Account"]');
    this.successMessage = page.locator('div[ng-if="showResult"] h1.title');
    this.newAccountIdLink = page.locator('#newAccountId');
  }

  async openAccount(type: 'CHECKING' | 'SAVINGS', fromAccountId: string): Promise<void> {
    await this.waitForNetworkIdle();
    const typeValue = type === 'CHECKING' ? '0' : '1';
    await this.selectDropdown(this.accountTypeDropdown, typeValue);
    await this.selectDropdown(this.fromAccountDropdown, fromAccountId);
    await this.clickElement(this.openButton);
    await this.waitForNetworkIdle();
  }

  async getNewAccountId(): Promise<string> {
    return await this.getText(this.newAccountIdLink);
  }

  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  async selectAccountType(type: 'CHECKING' | 'SAVINGS'): Promise<void> {
    const typeValue = type === 'CHECKING' ? '0' : '1';
    await this.selectDropdown(this.accountTypeDropdown, typeValue);
  }

  async selectFromAccount(index: number): Promise<void> {
    await this.fromAccountDropdown.selectOption({ index });
  }

  async submit(): Promise<void> {
    await this.clickElement(this.openButton);
    await this.waitForNetworkIdle();
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.successMessage);
  }

  async getSuccessMessageText(): Promise<string> {
    return await this.getSuccessMessage();
  }

  async clickNewAccountId(): Promise<void> {
    await this.clickElement(this.newAccountIdLink);
    await this.waitForPageLoad();
  }
}
