import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseCurrency } from '../utils';
import { Transaction } from '../types';

export class AccountDetailsPage extends BasePage {
  readonly accountIdLabel: Locator;
  readonly accountTypeLabel: Locator;
  readonly balanceLabel: Locator;
  readonly availableBalanceLabel: Locator;
  readonly transactionTable: Locator;
  readonly transactionRows: Locator;
  readonly activityPeriodSelect: Locator;
  readonly typeSelect: Locator;
  readonly goButton: Locator;

  constructor(page: Page) {
    super(page);
    this.accountIdLabel = page.locator('#accountId');
    this.accountTypeLabel = page.locator('#accountType');
    this.balanceLabel = page.locator('#balance');
    this.availableBalanceLabel = page.locator('#availableBalance');
    this.transactionTable = page.locator('#transactionTable');
    this.transactionRows = page.locator('#transactionTable tbody tr.ng-scope');
    this.activityPeriodSelect = page.locator('#month');
    this.typeSelect = page.locator('#transactionType');
    this.goButton = page.locator('input[value="Go"]');
  }

  async getAccountNumber(): Promise<string> {
    return await this.getText(this.accountIdLabel);
  }

  async getAccountType(): Promise<string> {
    return await this.getText(this.accountTypeLabel);
  }

  async getBalance(): Promise<number> {
    const text = await this.getText(this.balanceLabel);
    return parseCurrency(text);
  }

  async getAvailableBalance(): Promise<number> {
    const text = await this.getText(this.availableBalanceLabel);
    return parseCurrency(text);
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.waitForElement(this.transactionTable);
    const rows = await this.transactionRows.all();
    const transactions: Transaction[] = [];

    for (const row of rows) {
      const date = await row.locator('td:nth-child(1)').textContent();
      const description = await row.locator('td:nth-child(2) a').textContent();
      const id = await row.locator('td:nth-child(2) a').getAttribute('href');
      const debitText = await row.locator('td:nth-child(3)').textContent();
      const creditText = await row.locator('td:nth-child(4)').textContent();
      
      const isDebit = debitText && debitText.trim().length > 0;
      const amountText = isDebit ? debitText : creditText;
      
      if (date && description && amountText) {
        transactions.push({
          id: id ? id.split('=')[1] : '',
          date: date.trim(),
          description: description.trim(),
          amount: parseCurrency(amountText.trim()),
          type: isDebit ? 'Debit' : 'Credit',
        });
      }
    }
    return transactions;
  }

  async filterByPeriod(period: string): Promise<void> {
    await this.selectDropdown(this.activityPeriodSelect, period);
    await this.clickElement(this.goButton);
    await this.waitForNetworkIdle();
  }

  async filterByType(type: string): Promise<void> {
    await this.selectDropdown(this.typeSelect, type);
    await this.clickElement(this.goButton);
    await this.waitForNetworkIdle();
  }

  async getTransactionCount(): Promise<number> {
    return await this.transactionRows.count();
  }

  async getAccountId(): Promise<string> {
    return await this.getAccountNumber();
  }

  async filterByDate(value: string): Promise<void> {
    await this.filterByPeriod(value);
  }
}
