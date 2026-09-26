import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await test.step("Navigating to Youtube", async() =>{
    await page.goto('https://www.youtube.com/');
  })

  await page.locator('.ytSearchboxComponentInputBox').click();
  await page.getByRole('combobox', { name: 'Search' }).fill('playwright tutorial with typescript');
  await page.getByRole('combobox', { name: 'Search' }).press('Enter');
  await page.getByRole('link', { name: 'Naveen AutomationLabs' }).click();
  await page.getByRole('heading', { name: 'Naveen AutomationLabs,' }).getByText('Naveen AutomationLabs').click();
  await expect(page.getByRole('heading', { name: 'Naveen AutomationLabs,' })).toContainText('Naveen AutomationLabs');
  await page.getByRole('tab', { name: 'Playlists' }).click();
  await page.getByRole('group').filter({ hasText: 'View full playlist' }).nth(2).click();
  // await page.getByRole('button', { name: 'Skip', exact: true }).click();
  // await page.getByRole('button', { name: 'Full screen keyboard shortcut' }).click();
  // await page.getByRole('button', { name: 'Exit full screen keyboard' }).click();
  // await page.locator('#movie_player').getByRole('button', { name: 'Settings' }).click();
  // await page.getByRole('menuitem', { name: 'Quality Auto (720p)' }).click();
  // await page.getByRole('menuitemradio', { name: '1080p HD' }).click();
  // await page.locator('#movie_player').click();
  await expect(page.locator('#title-row')).toContainText('LeetCode Q2: Longest Substring Without Repeating Characters Using Sliding Window and HashMap in Java');
});

test('test 3', async({page}) => {
  await page.goto('https://www.google.com');
  await page.getByRole('combobox',{name:'Search'}).fill('what is the distance between sun and earth');
  // await 
});