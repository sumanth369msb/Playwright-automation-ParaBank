import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { LOAN_STATUS } from '../utils';

export class RequestLoanPage extends BasePage {
  readonly amountInput: Locator;
  readonly downPaymentInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly applyButton: Locator;
  readonly loanStatusLabel: Locator;
  readonly newAccountIdLink: Locator;

  constructor(page: Page) {
    super(page);
    this.amountInput = page.locator('#amount');
    this.downPaymentInput = page.locator('#downPayment');
    this.fromAccountDropdown = page.locator('#fromAccountId');
    this.applyButton = page.locator('input[value="Apply Now"]');
    this.loanStatusLabel = page.locator('#loanStatus');
    this.newAccountIdLink = page.locator('#newAccountId');
  }

  async requestLoan(amount: number, downPayment: number, fromAccount: string): Promise<void> {
    await this.waitForNetworkIdle();
    await this.fillInput(this.amountInput, amount.toString());
    await this.fillInput(this.downPaymentInput, downPayment.toString());
    await this.selectDropdown(this.fromAccountDropdown, fromAccount);
    await this.clickElement(this.applyButton);
    await this.waitForNetworkIdle();
  }

  async getLoanStatus(): Promise<string> {
    return await this.getText(this.loanStatusLabel);
  }

  async getNewAccountId(): Promise<string> {
    return await this.getText(this.newAccountIdLink);
  }

  async isApproved(): Promise<boolean> {
    const status = await this.getLoanStatus();
    return status === LOAN_STATUS.APPROVED;
  }

  async isDenied(): Promise<boolean> {
    const status = await this.getLoanStatus();
    return status === LOAN_STATUS.DENIED;
  }

  async applyForLoan(amount: number, downPayment: number, fromAccount: string): Promise<void> {
    await this.requestLoan(amount, downPayment, fromAccount);
  }
}
