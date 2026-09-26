import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransferFundsPage extends BasePage {
  readonly amountInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly toAccountDropdown: Locator;
  readonly transferButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.amountInput = page.locator('#amount');
    this.fromAccountDropdown = page.locator('#fromAccountId');
    this.toAccountDropdown = page.locator('#toAccountId');
    this.transferButton = page.locator('input[value="Transfer"]');
    this.successMessage = page.locator('div[ng-if="showResult"] h1.title');
    this.errorMessage = page.locator('.error');
  }

  async transferFunds(amount: number, fromAccount: string, toAccount: string): Promise<void> {
    await this.waitForNetworkIdle();
    await this.fillInput(this.amountInput, amount.toString());
    await this.selectDropdown(this.fromAccountDropdown, fromAccount);
    await this.selectDropdown(this.toAccountDropdown, toAccount);
    await this.clickElement(this.transferButton);
    await this.waitForNetworkIdle();
  }

  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  async getAvailableAccounts(): Promise<string[]> {
    await this.waitForElement(this.fromAccountDropdown);
    const options = await this.fromAccountDropdown.locator('option').allTextContents();
    return options;
  }
}
