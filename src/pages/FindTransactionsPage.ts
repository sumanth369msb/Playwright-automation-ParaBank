import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Transaction } from '../types';
import { parseCurrency } from '../utils';

export class FindTransactionsPage extends BasePage {
  readonly accountDropdown: Locator;
  readonly transactionIdInput: Locator;
  readonly findByIdButton: Locator;
  readonly dateInput: Locator;
  readonly findByDateButton: Locator;
  readonly dateRangeFromInput: Locator;
  readonly dateRangeToInput: Locator;
  readonly findByDateRangeButton: Locator;
  readonly amountInput: Locator;
  readonly findByAmountButton: Locator;
  readonly transactionTable: Locator;
  readonly transactionRows: Locator;

  constructor(page: Page) {
    super(page);
    this.accountDropdown = page.locator('#accountId');
    this.transactionIdInput = page.locator('#criteria\\.transactionId');
    this.findByIdButton = page.locator('button[ng-click="criteria.searchType = \'ID\'"]');
    this.dateInput = page.locator('#criteria\\.onDate');
    this.findByDateButton = page.locator('button[ng-click="criteria.searchType = \'DATE\'"]');
    this.dateRangeFromInput = page.locator('#criteria\\.fromDate');
    this.dateRangeToInput = page.locator('#criteria\\.toDate');
    this.findByDateRangeButton = page.locator('button[ng-click="criteria.searchType = \'DATE_RANGE\'"]');
    this.amountInput = page.locator('#criteria\\.amount');
    this.findByAmountButton = page.locator('button[ng-click="criteria.searchType = \'AMOUNT\'"]');
    this.transactionTable = page.locator('#transactionTable');
    this.transactionRows = page.locator('#transactionTable tbody tr.ng-scope');
  }

  async findByTransactionId(id: string): Promise<void> {
    await this.fillInput(this.transactionIdInput, id);
    await this.clickElement(this.findByIdButton);
    await this.waitForNetworkIdle();
  }

  async findByDate(date: string): Promise<void> {
    await this.fillInput(this.dateInput, date);
    await this.clickElement(this.findByDateButton);
    await this.waitForNetworkIdle();
  }

  async findByDateRange(from: string, to: string): Promise<void> {
    await this.fillInput(this.dateRangeFromInput, from);
    await this.fillInput(this.dateRangeToInput, to);
    await this.clickElement(this.findByDateRangeButton);
    await this.waitForNetworkIdle();
  }

  async findByAmount(amount: number): Promise<void> {
    await this.fillInput(this.amountInput, amount.toString());
    await this.clickElement(this.findByAmountButton);
    await this.waitForNetworkIdle();
  }

  async getResults(): Promise<Transaction[]> {
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

  async findById(id: string): Promise<void> {
    await this.findByTransactionId(id);
  }
}
