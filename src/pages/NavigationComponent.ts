import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NavigationComponent extends BasePage {
  readonly accountsOverviewLink: Locator;
  readonly transferFundsLink: Locator;
  readonly billPayLink: Locator;
  readonly findTransactionsLink: Locator;
  readonly updateInfoLink: Locator;
  readonly requestLoanLink: Locator;
  readonly logoutLink: Locator;
  readonly openNewAccountLink: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.accountsOverviewLink = page.locator('a[href="/parabank/overview.htm"]');
    this.transferFundsLink = page.locator('a[href="/parabank/transfer.htm"]');
    this.billPayLink = page.locator('a[href="/parabank/billpay.htm"]');
    this.findTransactionsLink = page.locator('a[href="/parabank/findtrans.htm"]');
    this.updateInfoLink = page.locator('a[href="/parabank/updateprofile.htm"]');
    this.requestLoanLink = page.locator('a[href="/parabank/requestloan.htm"]');
    this.logoutLink = page.locator('a[href="/parabank/logout.htm"]');
    this.openNewAccountLink = page.locator('a[href="/parabank/openaccount.htm"]');
    this.welcomeMessage = page.locator('.smallText');
  }

  async goToAccountsOverview(): Promise<void> {
    await this.clickElement(this.accountsOverviewLink);
    await this.waitForPageLoad();
  }

  async goToTransferFunds(): Promise<void> {
    await this.clickElement(this.transferFundsLink);
    await this.waitForPageLoad();
  }

  async goToBillPay(): Promise<void> {
    await this.clickElement(this.billPayLink);
    await this.waitForPageLoad();
  }

  async goToFindTransactions(): Promise<void> {
    await this.clickElement(this.findTransactionsLink);
    await this.waitForPageLoad();
  }

  async goToUpdateProfile(): Promise<void> {
    await this.clickElement(this.updateInfoLink);
    await this.waitForPageLoad();
  }

  async goToRequestLoan(): Promise<void> {
    await this.clickElement(this.requestLoanLink);
    await this.waitForPageLoad();
  }

  async goToOpenNewAccount(): Promise<void> {
    await this.clickElement(this.openNewAccountLink);
    await this.waitForPageLoad();
  }

  async logout(): Promise<void> {
    await this.clickElement(this.logoutLink);
    await this.waitForPageLoad();
  }

  async getWelcomeMessage(): Promise<string> {
    return await this.getText(this.welcomeMessage);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.logoutLink);
  }
}
