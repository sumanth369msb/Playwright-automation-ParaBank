export const BASE_URL = 'https://parabank.parasoft.com';

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  EXTRA_LONG: 60000,
};

export const ERROR_MESSAGES = {
  INVALID_LOGIN: 'The username and password could not be verified.',
  REQUIRED_FIELD: 'is required',
  INSUFFICIENT_FUNDS: 'Insufficient funds.',
  EMPTY_FIELDS: 'Please enter a username and password.',
};

export const ACCOUNT_TYPES = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  LOAN: 'LOAN',
} as const;

export const TRANSACTION_TYPES = {
  ALL: 'All',
  CREDIT: 'Credit',
  DEBIT: 'Debit',
} as const;

export const LOAN_STATUS = {
  APPROVED: 'Approved',
  DENIED: 'Denied',
} as const;
