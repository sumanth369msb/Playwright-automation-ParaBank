import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiBillPayParams, ApiUpdateCustomerParams } from '../types/api.types';
import { PayeeInfo } from '../types/banking.types';
import { RequestPool, PoolTelemetry } from '../utils/request-pool';

/**
 * Enterprise Banking REST API Client for ParaBank.
 * Interacts with backend REST services under /parabank/services/bank.
 * Governed by a proactive RequestPool to eliminate rate limiting (HTTP 429).
 */
export class BankingAPI {
  private request: APIRequestContext;
  private pool: RequestPool;

  constructor(request: APIRequestContext, pool?: RequestPool) {
    this.request = request;
    this.pool = pool ?? RequestPool.getInstance();
  }

  /**
   * Retrieves real-time pool metrics (in-flight, remaining tokens, queued).
   */
  public getPoolTelemetry(): PoolTelemetry {
    return this.pool.getTelemetry();
  }

  // ==========================================
  // Database & Administrative Endpoints
  // ==========================================

  /**
   * Cleans and resets the database back to initial sample state.
   * POST /parabank/services/bank/cleanDB
   */
  async cleanDB(): Promise<APIResponse> {
    return await this.pool.execute(() => this.request.post('/parabank/services/bank/cleanDB'));
  }

  /**
   * Initializes the database with base demo records.
   * POST /parabank/services/bank/initializeDB
   */
  async initializeDB(): Promise<APIResponse> {
    return await this.pool.execute(() => this.request.post('/parabank/services/bank/initializeDB'));
  }

  // ==========================================
  // Authentication & Customer Management
  // ==========================================

  /**
   * Authenticates a user and retrieves customer profile information.
   * GET /parabank/services/bank/login/{username}/{password}
   */
  async login(username: string, password: string, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`, {
        headers: {
          Accept: 'application/xml',
          ...headers,
        },
      })
    );
  }

  /**
   * Retrieves customer profile by customer ID.
   * GET /parabank/services/bank/customers/{customerId}
   */
  async getCustomer(customerId: string | number, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/customers/${customerId}`, {
        headers: {
          Accept: 'application/xml',
          ...headers,
        },
      })
    );
  }

  /**
   * Updates customer profile details.
   * POST /parabank/services/bank/customers/update/{customerId}
   */
  async updateCustomer(customerId: string | number, params: Partial<ApiUpdateCustomerParams>): Promise<APIResponse> {
    const queryParams = new URLSearchParams();
    if (params.firstName) queryParams.append('firstName', params.firstName);
    if (params.lastName) queryParams.append('lastName', params.lastName);

    // Spring MVC parameter binding for nested Address object
    if (params.street) {
      queryParams.append('address.street', params.street);
      queryParams.append('street', params.street);
    }
    if (params.city) {
      queryParams.append('address.city', params.city);
      queryParams.append('city', params.city);
    }
    if (params.state) {
      queryParams.append('address.state', params.state);
      queryParams.append('state', params.state);
    }
    if (params.zipCode) {
      queryParams.append('address.zipCode', params.zipCode);
      queryParams.append('zipCode', params.zipCode);
    }
    if (params.phoneNumber) queryParams.append('phoneNumber', params.phoneNumber);
    if (params.ssn) queryParams.append('ssn', params.ssn);
    if (params.username) queryParams.append('username', params.username);
    if (params.password) queryParams.append('password', params.password);

    const url = `/parabank/services/bank/customers/update/${customerId}?${queryParams.toString()}`;
    return await this.pool.execute(() =>
      this.request.post(url, {
        headers: {
          Accept: 'application/xml, text/plain',
        },
      })
    );
  }

  // ==========================================
  // Account Management Endpoints
  // ==========================================

  /**
   * Retrieves all accounts owned by a specific customer.
   * GET /parabank/services/bank/customers/{customerId}/accounts
   */
  async getCustomerAccounts(customerId: string | number, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/customers/${customerId}/accounts`, {
        headers: {
          Accept: 'application/xml',
          ...headers,
        },
      })
    );
  }

  /**
   * Retrieves specific account details (balance, type, customerId).
   * GET /parabank/services/bank/accounts/{accountId}
   */
  async getAccountDetails(accountId: string | number, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/accounts/${accountId}`, {
        headers: {
          Accept: 'application/xml',
          ...headers,
        },
      })
    );
  }

  /**
   * Creates a new checking or savings account.
   * POST /parabank/services/bank/createAccount?customerId={id}&newAccountType={type}&fromAccountId={from}
   * @param accountType 0 = CHECKING, 1 = SAVINGS
   */
  async createAccount(customerId: string | number, accountType: number, fromAccountId: string | number): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.post(
        `/parabank/services/bank/createAccount?customerId=${customerId}&newAccountType=${accountType}&fromAccountId=${fromAccountId}`,
        {
          headers: {
            Accept: 'application/xml',
          },
        }
      )
    );
  }

  // ==========================================
  // Financial Operations: Transfer, Deposit, Withdraw & Bill Pay
  // ==========================================

  /**
   * Transfers funds between two internal accounts.
   * POST /parabank/services/bank/transfer?fromAccountId={from}&toAccountId={to}&amount={amount}
   */
  async transferFunds(fromAccountId: string | number, toAccountId: string | number, amount: number): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.post(
        `/parabank/services/bank/transfer?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`,
        {
          headers: {
            Accept: 'application/xml, text/plain',
          },
        }
      )
    );
  }

  /**
   * Deposits funds into an account.
   * POST /parabank/services/bank/deposit?accountId={accountId}&amount={amount}
   */
  async deposit(accountId: string | number, amount: number): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.post(
        `/parabank/services/bank/deposit?accountId=${accountId}&amount=${amount}`,
        {
          headers: {
            Accept: 'application/xml, text/plain',
          },
        }
      )
    );
  }

  /**
   * Withdraws funds from an account.
   * POST /parabank/services/bank/withdraw?accountId={accountId}&amount={amount}
   */
  async withdraw(accountId: string | number, amount: number): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.post(
        `/parabank/services/bank/withdraw?accountId=${accountId}&amount=${amount}`,
        {
          headers: {
            Accept: 'application/xml, text/plain',
          },
        }
      )
    );
  }

  /**
   * Executes a bill payment.
   * POST /parabank/services/bank/billpay?accountId={accountId}&amount={amount}
   * Payee details are passed via XML body payload per ParaBank WADL spec.
   */
  async billPay(
    accountId: string | number,
    amount: number,
    payee: PayeeInfo | ApiBillPayParams
  ): Promise<APIResponse> {
    const street = typeof payee.address === 'string' ? payee.address : payee.address.street;
    const city = 'city' in payee && payee.city ? payee.city : (typeof payee.address !== 'string' ? payee.address.city : '');
    const state = 'state' in payee && payee.state ? payee.state : (typeof payee.address !== 'string' ? payee.address.state : '');
    const zipCode = 'zipCode' in payee && payee.zipCode ? payee.zipCode : (typeof payee.address !== 'string' ? payee.address.zipCode : '');

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<payee>
  <name>${payee.name}</name>
  <address>
    <street>${street}</street>
    <city>${city}</city>
    <state>${state}</state>
    <zipCode>${zipCode}</zipCode>
  </address>
  <phoneNumber>${payee.phone}</phoneNumber>
  <accountNumber>${payee.accountNumber}</accountNumber>
</payee>`;

    return await this.pool.execute(() =>
      this.request.post(`/parabank/services/bank/billpay?accountId=${accountId}&amount=${amount}`, {
        headers: {
          'Content-Type': 'application/xml',
          Accept: 'application/xml, text/plain, application/json',
        },
        data: xmlPayload,
      })
    );
  }

  // ==========================================
  // Loan Management
  // ==========================================

  /**
   * Submits a loan application request.
   * POST /parabank/services/bank/requestLoan?customerId={customerId}&amount={amount}&downPayment={downPayment}&fromAccountId={fromAccountId}
   */
  async requestLoan(
    customerId: string | number,
    amount: number,
    downPayment: number,
    fromAccountId: string | number
  ): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.post(
        `/parabank/services/bank/requestLoan?customerId=${customerId}&amount=${amount}&downPayment=${downPayment}&fromAccountId=${fromAccountId}`,
        {
          headers: {
            Accept: 'application/xml',
          },
        }
      )
    );
  }

  // ==========================================
  // Transaction Inquiries & Search
  // ==========================================

  /**
   * Retrieves all transactions for an account.
   * GET /parabank/services/bank/accounts/{accountId}/transactions
   */
  async getAccountTransactions(accountId: string | number, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/accounts/${accountId}/transactions`, {
        headers: {
          Accept: 'application/xml',
          ...headers,
        },
      })
    );
  }

  /**
   * Retrieves single transaction details by transaction ID.
   * GET /parabank/services/bank/transactions/{transactionId}
   */
  async getTransactionById(transactionId: string | number, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/transactions/${transactionId}`, {
        headers: {
          Accept: 'application/xml',
          ...headers,
        },
      })
    );
  }

  /**
   * Finds transactions for an account on a specific date (MM-DD-YYYY).
   * GET /parabank/services/bank/accounts/{accountId}/transactions/onDate/{onDate}
   */
  async getTransactionsByDate(accountId: string | number, onDate: string): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/accounts/${accountId}/transactions/onDate/${onDate}`, {
        headers: {
          Accept: 'application/xml',
        },
      })
    );
  }

  /**
   * Finds transactions within a date range (fromDate to toDate, formatted MM-DD-YYYY).
   * GET /parabank/services/bank/accounts/{accountId}/transactions/fromDate/{fromDate}/toDate/{toDate}
   */
  async getTransactionsByDateRange(accountId: string | number, fromDate: string, toDate: string): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(
        `/parabank/services/bank/accounts/${accountId}/transactions/fromDate/${fromDate}/toDate/${toDate}`,
        {
          headers: {
            Accept: 'application/xml',
          },
        }
      )
    );
  }

  /**
   * Finds transactions matching an exact dollar amount.
   * GET /parabank/services/bank/accounts/{accountId}/transactions/amount/{amount}
   */
  async getTransactionsByAmount(accountId: string | number, amount: number): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(`/parabank/services/bank/accounts/${accountId}/transactions/amount/${amount}`, {
        headers: {
          Accept: 'application/xml',
        },
      })
    );
  }

  /**
   * Finds transactions by month and transaction type.
   * GET /parabank/services/bank/accounts/{accountId}/transactions/month/{month}/type/{type}
   */
  async getTransactionsByMonthAndType(
    accountId: string | number,
    month: string,
    type: 'All' | 'Debit' | 'Credit' | string
  ): Promise<APIResponse> {
    return await this.pool.execute(() =>
      this.request.get(
        `/parabank/services/bank/accounts/${accountId}/transactions/month/${month}/type/${type}`,
        {
          headers: {
            Accept: 'application/xml',
          },
        }
      )
    );
  }
}
