export interface ApiCustomer {
  id: string;
  firstName: string;
  lastName: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  ssn?: string;
}

export interface ApiAccount {
  id: string;
  customerId: string;
  type: 'CHECKING' | 'SAVINGS' | 'LOAN' | string;
  balance: number;
}

export interface ApiTransaction {
  id: string;
  accountId: string;
  type: 'Debit' | 'Credit' | string;
  date: string;
  amount: number;
  description: string;
}

export interface ApiLoanResponse {
  responseDate?: string;
  loanProviderName?: string;
  approved: boolean;
  message?: string;
  accountId?: string;
}

export interface ApiUpdateCustomerParams {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  ssn: string;
  username?: string;
  password?: string;
}

export interface ApiBillPayParams {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  accountNumber: string;
}
