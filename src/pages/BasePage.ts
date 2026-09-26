import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for network and DOM to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the current page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get the current page URL
   */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Take a full page screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible' });
  }

  /**
   * Click an element
   */
  async clickElement(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /**
   * Fill an input field
   */
  async fillInput(selector: string | Locator, value: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible' });
    await locator.fill(value);
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string | Locator): Promise<string> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) || '';
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isVisible();
  }

  /**
   * Check if an element is enabled
   */
  async isEnabled(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isEnabled();
  }

  /**
   * Select an option from a dropdown by value
   */
  async selectDropdown(selector: string | Locator, value: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }

  /**
   * Wait for a dialog and get its message, then accept it
   */
  async getAlertText(): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
  }

  /**
   * Wait for a dialog and accept it
   */
  async acceptAlert(): Promise<void> {
    this.page.once('dialog', dialog => dialog.accept());
  }

  /**
   * Wait for network idle state
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to be fully loaded (alias for waitForPageLoad).
   * Used by tests as a semantic signal that the page is ready.
   */
  async waitForLoad(): Promise<void> {
    await this.waitForPageLoad();
  }

  /**
   * Check if the page is loaded by verifying DOM content is ready.
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
