import { request, APIRequestContext } from '@playwright/test';
import { BASE_URL } from './constants';

export async function createAccount(customerId: string, accountType: number, fromAccountId: string): Promise<string> {
  const apiContext: APIRequestContext = await request.newContext({ baseURL: BASE_URL });
  const response = await apiContext.post(`/parabank/services/bank/createAccount?customerId=${customerId}&newAccountType=${accountType}&fromAccountId=${fromAccountId}`);
  
  if (!response.ok()) {
    throw new Error(`Failed to create account: ${response.status()}`);
  }
  
  const responseBody = await response.text();
  // Assuming the API returns the new account ID in the XML response.  Parsing would depend on exact response structure.
  // For ParaBank demo, we might need an XML parser, or simple regex if we know the structure.
  const match = responseBody.match(/<id>(\d+)<\/id>/);
  if (match && match[1]) {
     return match[1];
  }
  throw new Error('Could not parse account ID from response');
}

export async function getAccountDetails(accountId: string) {
  const apiContext = await request.newContext({ baseURL: BASE_URL });
  const response = await apiContext.get(`/parabank/services/bank/accounts/${accountId}`);
  if (!response.ok()) {
      throw new Error(`Failed to get account details: ${response.status()}`);
  }
  return await response.text();
}

export async function cleanupTestData() {
  const apiContext = await request.newContext({ baseURL: BASE_URL });
  await apiContext.post('/parabank/services/bank/cleanDB');
}
