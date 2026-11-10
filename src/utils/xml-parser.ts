import { ApiAccount, ApiCustomer, ApiLoanResponse, ApiTransaction } from '../types/api.types';

/**
 * Extracts the inner text of the first occurrence of an XML tag,
 * handling optional XML namespace prefixes and attributes.
 */
export function extractXmlTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}\\b[^>]*>(.*?)</(?:[a-zA-Z0-9_-]+:)?${tag}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extracts inner text from all occurrences of a specific XML tag,
 * handling optional XML namespace prefixes and attributes.
 */
export function extractXmlTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}\\b[^>]*>(.*?)</(?:[a-zA-Z0-9_-]+:)?${tag}>`, 'gs');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

/**
 * Extracts all blocks enclosed by <tag>...</tag>,
 * handling optional XML namespace prefixes and attributes.
 */
export function extractXmlBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}\\b[^>]*>(.*?)</(?:[a-zA-Z0-9_-]+:)?${tag}>`, 'gs');
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Parses customer XML into an ApiCustomer object.
 */
export function parseCustomerXml(xml: string): ApiCustomer {
  const id = extractXmlTag(xml, 'id') || '';
  const firstName = extractXmlTag(xml, 'firstName') || '';
  const lastName = extractXmlTag(xml, 'lastName') || '';
  const street = extractXmlTag(xml, 'street') || undefined;
  const city = extractXmlTag(xml, 'city') || undefined;
  const state = extractXmlTag(xml, 'state') || undefined;
  const zipCode = extractXmlTag(xml, 'zipCode') || undefined;
  const phoneNumber = extractXmlTag(xml, 'phoneNumber') || undefined;
  const ssn = extractXmlTag(xml, 'ssn') || undefined;

  return { id, firstName, lastName, street, city, state, zipCode, phoneNumber, ssn };
}

/**
 * Parses single account XML into an ApiAccount object.
 */
export function parseAccountXml(xml: string): ApiAccount {
  const id = extractXmlTag(xml, 'id') || '';
  const customerId = extractXmlTag(xml, 'customerId') || '';
  const type = extractXmlTag(xml, 'type') || '';
  const balanceStr = extractXmlTag(xml, 'balance') || '0';
  const balance = parseFloat(balanceStr);

  return { id, customerId, type, balance };
}

/**
 * Parses a collection of accounts from accounts XML.
 */
export function parseAccountsXml(xml: string): ApiAccount[] {
  const accountBlocks = extractXmlBlocks(xml, 'account');
  if (accountBlocks.length === 0) {
    // If no explicit <account> wrapper blocks, check if the string itself is a single account
    const id = extractXmlTag(xml, 'id');
    if (id) {
      return [parseAccountXml(xml)];
    }
    return [];
  }
  return accountBlocks.map((block) => parseAccountXml(block));
}

/**
 * Parses single transaction XML into an ApiTransaction object.
 */
export function parseTransactionXml(xml: string): ApiTransaction {
  const id = extractXmlTag(xml, 'id') || '';
  const accountId = extractXmlTag(xml, 'accountId') || '';
  const type = extractXmlTag(xml, 'type') || '';
  const date = extractXmlTag(xml, 'date') || '';
  const amountStr = extractXmlTag(xml, 'amount') || '0';
  const description = extractXmlTag(xml, 'description') || '';

  return {
    id,
    accountId,
    type,
    date,
    amount: parseFloat(amountStr),
    description,
  };
}

/**
 * Parses collection of transactions XML.
 */
export function parseTransactionsXml(xml: string): ApiTransaction[] {
  const transactionBlocks = extractXmlBlocks(xml, 'transaction');
  return transactionBlocks.map((block) => parseTransactionXml(block));
}

/**
 * Parses loan response XML.
 */
export function parseLoanResponseXml(xml: string): ApiLoanResponse {
  const responseDate = extractXmlTag(xml, 'responseDate') || undefined;
  const loanProviderName = extractXmlTag(xml, 'loanProviderName') || undefined;
  const approvedStr = extractXmlTag(xml, 'approved') || 'false';
  const approved = approvedStr.toLowerCase() === 'true';
  const message = extractXmlTag(xml, 'message') || undefined;
  const accountId = extractXmlTag(xml, 'accountId') || undefined;

  return {
    responseDate,
    loanProviderName,
    approved,
    message,
    accountId,
  };
}
