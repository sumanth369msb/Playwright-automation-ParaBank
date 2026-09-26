import { test, expect } from '../../src/fixtures/banking-fixtures';
import { generateUser } from '../../src/utils/test-data';

test.describe('Update Profile @regression @profile', () => {
  test.beforeEach(async ({ authenticatedPage, navigation }) => {
    await navigation.goToUpdateProfile();
  });

  test('should display current profile information', async ({ updateProfilePage }) => {
    await expect(updateProfilePage.firstNameInput).toHaveValue(/./);
  });

  test('should update profile information successfully @smoke', async ({ updateProfilePage }) => {
    const newUserData = generateUser();
    await updateProfilePage.updateProfile(newUserData);
    await expect(updateProfilePage.successMessage).toBeVisible();
  });

  test('should show success message after update', async ({ updateProfilePage }) => {
    const newUserData = generateUser();
    await updateProfilePage.updateProfile(newUserData);
    await expect(updateProfilePage.successMessage).toHaveText('Profile Updated');
  });

  test('should preserve updated information on reload', async ({ updateProfilePage, page }) => {
    const newUserData = generateUser();
    await updateProfilePage.updateProfile(newUserData);
    await page.reload();
    await expect(updateProfilePage.firstNameInput).toHaveValue(newUserData.firstName);
  });
});
