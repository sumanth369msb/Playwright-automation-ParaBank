import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { RegistrationData } from '../types';

export class RegisterPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input[id="customer.firstName"]');
    this.lastNameInput = page.locator('input[id="customer.lastName"]');
    this.streetInput = page.locator('input[id="customer.address.street"]');
    this.cityInput = page.locator('input[id="customer.address.city"]');
    this.stateInput = page.locator('input[id="customer.address.state"]');
    this.zipCodeInput = page.locator('input[id="customer.address.zipCode"]');
    this.phoneInput = page.locator('input[id="customer.phoneNumber"]');
    this.ssnInput = page.locator('input[id="customer.ssn"]');
    this.usernameInput = page.locator('input[id="customer.username"]');
    this.passwordInput = page.locator('input[id="customer.password"]');
    this.confirmPasswordInput = page.locator('input[id="repeatedPassword"]');
    this.registerButton = page.locator('input[value="Register"]');
    this.successMessage = page.locator('#rightPanel p').first();
    this.errorMessages = page.locator('.error');
  }

  async register(userData: RegistrationData): Promise<void> {
    await this.fillPersonalInfo(userData);
    await this.fillContactInfo(userData);
    await this.fillLoginInfo(userData);
    await this.clickElement(this.registerButton);
    await this.waitForPageLoad();
  }

  async fillPersonalInfo(userData: RegistrationData): Promise<void> {
    await this.fillInput(this.firstNameInput, userData.firstName);
    await this.fillInput(this.lastNameInput, userData.lastName);
    await this.fillInput(this.ssnInput, userData.ssn);
  }

  async fillContactInfo(userData: RegistrationData): Promise<void> {
    await this.fillInput(this.streetInput, userData.address.street);
    await this.fillInput(this.cityInput, userData.address.city);
    await this.fillInput(this.stateInput, userData.address.state);
    await this.fillInput(this.zipCodeInput, userData.address.zipCode);
    await this.fillInput(this.phoneInput, userData.phone);
  }

  async fillLoginInfo(userData: RegistrationData): Promise<void> {
    await this.fillInput(this.usernameInput, userData.username);
    await this.fillInput(this.passwordInput, userData.password);
    await this.fillInput(this.confirmPasswordInput, userData.password);
  }

  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  async getErrorMessages(): Promise<string[]> {
    return await this.errorMessages.allTextContents();
  }

  async fillRegistrationForm(userData: RegistrationData): Promise<void> {
    await this.fillPersonalInfo(userData);
    await this.fillContactInfo(userData);
    
    await this.fillInput(this.usernameInput, userData.username);
    await this.fillInput(this.passwordInput, userData.password);
    await this.fillInput(this.confirmPasswordInput, (userData as any).confirmPassword || userData.password);
  }

  async submitRegistration(): Promise<void> {
    await this.clickElement(this.registerButton);
    await this.waitForPageLoad();
  }

  async getUsernameError(): Promise<string> {
    return await this.getText(this.page.locator('span[id="customer.username.errors"]'));
  }

  async getPasswordMatchError(): Promise<string> {
    return await this.getText(this.page.locator('span[id="repeatedPassword.errors"]'));
  }

  getFirstNameError(): Locator {
    return this.page.locator('span[id="customer.firstName.errors"]');
  }

  getLastNameError(): Locator {
    return this.page.locator('span[id="customer.lastName.errors"]');
  }

  getAddressError(): Locator {
    return this.page.locator('span[id="customer.address.street.errors"]');
  }

  getCityError(): Locator {
    return this.page.locator('span[id="customer.address.city.errors"]');
  }
}
