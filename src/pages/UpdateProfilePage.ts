import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProfileData } from '../types';

export class UpdateProfilePage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly updateButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input[id="customer.firstName"]');
    this.lastNameInput = page.locator('input[id="customer.lastName"]');
    this.streetInput = page.locator('input[id="customer.address.street"]');
    this.cityInput = page.locator('input[id="customer.address.city"]');
    this.stateInput = page.locator('input[id="customer.address.state"]');
    this.zipCodeInput = page.locator('input[id="customer.address.zipCode"]');
    this.phoneInput = page.locator('input[id="customer.phoneNumber"]');
    this.updateButton = page.locator('input[value="Update Profile"]');
    this.successMessage = page.locator('div[ng-if="showResult"] h1.title');
  }

  async updateProfile(profileData: Partial<ProfileData>): Promise<void> {
    if (profileData.firstName) await this.fillInput(this.firstNameInput, profileData.firstName);
    if (profileData.lastName) await this.fillInput(this.lastNameInput, profileData.lastName);
    if (profileData.address?.street) await this.fillInput(this.streetInput, profileData.address.street);
    if (profileData.address?.city) await this.fillInput(this.cityInput, profileData.address.city);
    if (profileData.address?.state) await this.fillInput(this.stateInput, profileData.address.state);
    if (profileData.address?.zipCode) await this.fillInput(this.zipCodeInput, profileData.address.zipCode);
    if (profileData.phone) await this.fillInput(this.phoneInput, profileData.phone);
    
    await this.clickElement(this.updateButton);
    await this.waitForNetworkIdle();
  }

  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  async getCurrentValues(): Promise<Partial<ProfileData>> {
    return {
      firstName: await this.firstNameInput.inputValue(),
      lastName: await this.lastNameInput.inputValue(),
      address: {
        street: await this.streetInput.inputValue(),
        city: await this.cityInput.inputValue(),
        state: await this.stateInput.inputValue(),
        zipCode: await this.zipCodeInput.inputValue(),
      },
      phone: await this.phoneInput.inputValue(),
    };
  }
}
