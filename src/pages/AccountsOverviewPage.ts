import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseCurrency } from '../utils';

export class AccountsOverviewPage extends BasePage {
  readonly accountsTable: Locator;
  readonly accountRows: Locator;
  readonly totalBalance: Locator;

  constructor(page: Page) {
    super(page);
    this.accountsTable = page.locator('#accountTable');
    this.accountRows = page.locator('#accountTable tbody tr.ng-scope');
    this.totalBalance = page.locator('#accountTable tbody tr:last-child td:nth-child(2) b.ng-binding');
  }

  async getAccountsList(): Promise<{ id: string; balance: string; availableAmount: string }[]> {
    await this.waitForElement(this.accountsTable);
    const rows = await this.accountRows.all();
    const accounts = [];

    for (const row of rows) {
      const id = await row.locator('td:nth-child(1) a').textContent();
      const balance = await row.locator('td:nth-child(2)').textContent();
      const availableAmount = await row.locator('td:nth-child(3)').textContent();
      
      if (id && balance) {
        accounts.push({
          id: id.trim(),
          balance: balance.trim(),
          availableAmount: availableAmount ? availableAmount.trim() : '',
        });
      }
    }
    return accounts;
  }

  async getAccountBalance(accountId: string): Promise<number> {
    const row = this.accountRows.filter({ hasText: accountId });
    const balanceText = await row.locator('td:nth-child(2)').textContent();
    return balanceText ? parseCurrency(balanceText) : 0;
  }

  async getTotalBalance(): Promise<number> {
    const totalText = await this.getText(this.totalBalance);
    return parseCurrency(totalText);
  }

  async clickAccount(accountId: string): Promise<void> {
    const accountLink = this.page.locator(`a[href="activity.htm?id=${accountId}"]`);
    await this.clickElement(accountLink);
    await this.waitForPageLoad();
  }

  async getAccountCount(): Promise<number> {
    await this.waitForElement(this.accountsTable);
    return await this.accountRows.count();
  }

  async isAccountsTableVisible(): Promise<boolean> {
    return await this.isVisible(this.accountsTable);
  }

  async getAllAccounts(): Promise<{ id: string; balance: string; availableAmount: string }[]> {
    return await this.getAccountsList();
  }

  async getAccountRowCount(): Promise<number> {
    return await this.getAccountCount();
  }
}
