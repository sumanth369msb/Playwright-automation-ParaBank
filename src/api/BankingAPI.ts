import { APIRequestContext, expect } from '@playwright/test';

export class BankingAPI {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Cleans and resets the database back to initial state.
   */
  async cleanDB() {
    const response = await this.request.post('/parabank/services/bank/cleanDB');
    expect(response.ok()).toBeTruthy();
    return response;
  }

  /**
   * Logs in a user via the REST API.
   * GET /parabank/services/bank/login/{username}/{password}
   */
  async login(username: string, password: string) {
    return await this.request.get(`/parabank/services/bank/login/${username}/${password}`, {
      headers: { 'Accept': 'application/xml' } // ParaBank natively uses XML
    });
  }

  /**
   * Gets all accounts for a specific customer.
   * GET /parabank/services/bank/customers/{customerId}/accounts
   */
  async getCustomerAccounts(customerId: string) {
    return await this.request.get(`/parabank/services/bank/customers/${customerId}/accounts`, {
      headers: { 'Accept': 'application/xml' }
    });
  }

  /**
   * Gets details for a specific account.
   * GET /parabank/services/bank/accounts/{accountId}
   */
  async getAccountDetails(accountId: string) {
    return await this.request.get(`/parabank/services/bank/accounts/${accountId}`, {
      headers: { 'Accept': 'application/xml' }
    });
  }

  /**
   * Creates a new account.
   * POST /parabank/services/bank/createAccount?customerId={id}&newAccountType={type}&fromAccountId={from}
   * @param accountType 0 for CHECKING, 1 for SAVINGS
   */
  async createAccount(customerId: string, accountType: number, fromAccountId: string) {
    return await this.request.post(`/parabank/services/bank/createAccount?customerId=${customerId}&newAccountType=${accountType}&fromAccountId=${fromAccountId}`);
  }

  /**
   * Transfers funds between accounts.
   * POST /parabank/services/bank/transfer?fromAccountId={from}&toAccountId={to}&amount={amount}
   */
  async transferFunds(fromAccountId: string, toAccountId: string, amount: number) {
    return await this.request.post(`/parabank/services/bank/transfer?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`);
  }
}
