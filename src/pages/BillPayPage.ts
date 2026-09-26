import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { PayeeInfo } from '../types';

export class BillPayPage extends BasePage {
  readonly payeeNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly accountInput: Locator;
  readonly verifyAccountInput: Locator;
  readonly amountInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly sendPaymentButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.payeeNameInput = page.locator('input[name="payee.name"]');
    this.addressInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipCodeInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.accountInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.fromAccountDropdown = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.locator('input[value="Send Payment"]');
    this.successMessage = page.locator('#billpayResult h1, div[ng-show="showResult"] h1').first();
    this.errorMessage = page.locator('.error');
  }

  async payBill(payeeInfo: PayeeInfo, amount: number, fromAccount?: string): Promise<void> {
    await this.waitForNetworkIdle();
    await this.fillPayeeInfo(payeeInfo);
    await this.amountInput.click();
    await this.amountInput.clear();
    await this.amountInput.pressSequentially(amount.toFixed(2), { delay: 30 });

    if (fromAccount && fromAccount.length > 3) {
      try {
        await this.fromAccountDropdown.selectOption(fromAccount, { timeout: 3000 });
      } catch {
        await this.fromAccountDropdown.selectOption({ index: 0 }).catch(() => {});
      }
    } else {
      await this.fromAccountDropdown.selectOption({ index: 0 }).catch(() => {});
    }

    await this.clickElement(this.sendPaymentButton);
    await this.page.locator('#billpayResult, div[ng-show="showResult"]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await this.waitForNetworkIdle();
  }

  async fillPayeeInfo(payeeInfo: PayeeInfo): Promise<void> {
    await this.fillInput(this.payeeNameInput, payeeInfo.name);
    await this.fillInput(this.addressInput, payeeInfo.address);
    await this.fillInput(this.cityInput, payeeInfo.city);
    await this.fillInput(this.stateInput, payeeInfo.state);
    await this.fillInput(this.zipCodeInput, payeeInfo.zipCode);
    await this.fillInput(this.phoneInput, payeeInfo.phone);
    await this.fillInput(this.accountInput, payeeInfo.accountNumber);
    await this.fillInput(this.verifyAccountInput, payeeInfo.accountNumber);
  }

  async getSuccessMessage(): Promise<string> {
    const result = this.page.locator('#billpayResult, div[ng-show="showResult"]').first();
    await result.waitFor({ state: 'visible', timeout: 10000 });
    return (await result.textContent()) || '';
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  async submitPayment(): Promise<void> {
    await this.clickElement(this.sendPaymentButton);
    await this.waitForNetworkIdle();
  }

  async getAvailableAccounts(): Promise<string[]> {
    await this.waitForElement(this.fromAccountDropdown);
    await this.page.waitForFunction(
      () => {
        const el = document.querySelector('select[name="fromAccountId"]') as HTMLSelectElement | null;
        return el && el.options && el.options.length > 0;
      },
      { timeout: 10000 }
    ).catch(() => {});
    const options = await this.fromAccountDropdown.locator('option').allTextContents();
    return options.map(opt => opt.trim()).filter(opt => opt.length > 0);
  }
}

