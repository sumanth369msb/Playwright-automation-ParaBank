import { test as baseTest, expect } from '@playwright/test';
import {
  LoginPage,
  RegisterPage,
  AccountsOverviewPage,
  TransferFundsPage,
  BillPayPage,
  FindTransactionsPage,
  OpenNewAccountPage,
  RequestLoanPage,
  UpdateProfilePage,
  AccountDetailsPage,
  NavigationComponent,
} from '../pages';
import { BASE_URL, VALID_CREDENTIALS } from '../utils';

type BankingFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountsOverviewPage: AccountsOverviewPage;
  transferFundsPage: TransferFundsPage;
  billPayPage: BillPayPage;
  findTransactionsPage: FindTransactionsPage;
  openNewAccountPage: OpenNewAccountPage;
  requestLoanPage: RequestLoanPage;
  updateProfilePage: UpdateProfilePage;
  accountDetailsPage: AccountDetailsPage;
  navigation: NavigationComponent;
  authenticatedPage: void;
};

export const test = baseTest.extend<BankingFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  accountsOverviewPage: async ({ page }, use) => {
    await use(new AccountsOverviewPage(page));
  },
  transferFundsPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },
  billPayPage: async ({ page }, use) => {
    await use(new BillPayPage(page));
  },
  findTransactionsPage: async ({ page }, use) => {
    await use(new FindTransactionsPage(page));
  },
  openNewAccountPage: async ({ page }, use) => {
    await use(new OpenNewAccountPage(page));
  },
  requestLoanPage: async ({ page }, use) => {
    await use(new RequestLoanPage(page));
  },
  updateProfilePage: async ({ page }, use) => {
    await use(new UpdateProfilePage(page));
  },
  accountDetailsPage: async ({ page }, use) => {
    await use(new AccountDetailsPage(page));
  },
  navigation: async ({ page }, use) => {
    await use(new NavigationComponent(page));
  },
  authenticatedPage: async ({ page, loginPage }, use) => {
    await page.goto(`${BASE_URL}/parabank/index.htm`);
    await loginPage.login(VALID_CREDENTIALS.username, VALID_CREDENTIALS.password);
    await use();
  },
});

export { expect };
