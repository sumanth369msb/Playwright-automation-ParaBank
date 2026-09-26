export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Account {
  id: string;
  type: string;
  balance: number;
  availableBalance: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Debit' | 'Credit';
}

export interface User {
  firstName: string;
  lastName: string;
  address: Address;
  phone: string;
  ssn: string;
}

export interface PayeeInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  accountNumber: string;
}

export interface LoanApplication {
  amount: number;
  downPayment: number;
  fromAccountId: string;
}

export interface TransferRequest {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
}

export interface BillPayment {
  payee: PayeeInfo;
  amount: number;
  fromAccountId: string;
}

export interface AccountActivity {
  accountId: string;
  period: string;
  type: string;
}

export interface RegistrationData extends User {
  username: string;
  password: string;
}

export interface ProfileData extends User {}

export interface TestCredentials {
  username: string;
  password: string;
}
