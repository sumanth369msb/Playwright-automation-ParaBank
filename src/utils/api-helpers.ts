import { request, APIRequestContext } from '@playwright/test';
import { BASE_URL } from './constants';
import { RequestPool } from './request-pool';

const pool = RequestPool.getInstance();

export async function createAccount(customerId: string, accountType: number, fromAccountId: string): Promise<string> {
  const apiContext: APIRequestContext = await request.newContext({ baseURL: BASE_URL });
  const response = await pool.execute(() =>
    apiContext.post(
      `/parabank/services/bank/createAccount?customerId=${customerId}&newAccountType=${accountType}&fromAccountId=${fromAccountId}`
    )
  );

  if (!response.ok()) {
    throw new Error(`Failed to create account: ${response.status()}`);
  }

  const responseBody = await response.text();
  const match = responseBody.match(/<id>(\d+)<\/id>/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('Could not parse account ID from response');
}

export async function getAccountDetails(accountId: string): Promise<string> {
  const apiContext: APIRequestContext = await request.newContext({ baseURL: BASE_URL });
  const response = await pool.execute(() =>
    apiContext.get(`/parabank/services/bank/accounts/${accountId}`)
  );
  if (!response.ok()) {
    throw new Error(`Failed to get account details: ${response.status()}`);
  }
  return await response.text();
}

export async function cleanupTestData(): Promise<void> {
  const apiContext: APIRequestContext = await request.newContext({ baseURL: BASE_URL });
  await pool.execute(() => apiContext.post('/parabank/services/bank/cleanDB'));
}
