import { RegistrationData, Address, PayeeInfo, TestCredentials } from '../types';

/**
 * Valid test credentials for ParaBank (default: john/demo).
 */
export const VALID_CREDENTIALS: TestCredentials = {
  username: 'john',
  password: 'demo',
};

/**
 * CREDENTIALS object used by login tests.
 */
export const CREDENTIALS = {
  VALID_USER: VALID_CREDENTIALS,
};

/**
 * Generate a unique test user.
 */
export function generateUser(): RegistrationData {
  const timestamp = Date.now();
  return {
    firstName: `Test`,
    lastName: `User${timestamp}`,
    address: generateAddress(),
    phone: generatePhoneNumber(),
    ssn: generateSSN(),
    username: `testuser_${timestamp}`,
    password: 'Password123!',
  };
}

/**
 * Generate a test address.
 */
export function generateAddress(): Address {
  return {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
  };
}

/**
 * Generate a random SSN.
 */
export function generateSSN(): string {
  const a = Math.floor(Math.random() * 900) + 100;
  const b = Math.floor(Math.random() * 90) + 10;
  const c = Math.floor(Math.random() * 9000) + 1000;
  return `${a}-${b}-${c}`;
}

/**
 * Generate a random phone number.
 */
export function generatePhoneNumber(): string {
  const a = Math.floor(Math.random() * 900) + 100;
  const b = Math.floor(Math.random() * 9000) + 1000;
  return `555-${a}-${b}`;
}

/**
 * Generate a random dollar amount.
 */
export function generateRandomAmount(min: number = 10, max: number = 500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate payee info for bill payment tests.
 */
export function generatePayeeInfo(): PayeeInfo {
  const timestamp = Date.now();
  return {
    name: `Test Payee ${timestamp}`,
    address: '456 Oak Avenue',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    phone: generatePhoneNumber(),
    accountNumber: `${Math.floor(Math.random() * 90000) + 10000}`,
  };
}

