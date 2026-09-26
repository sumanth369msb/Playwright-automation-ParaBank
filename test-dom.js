const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://parabank.parasoft.com/parabank/index.htm');
  await page.fill('input[name="username"]', 'john');
  await page.fill('input[name="password"]', 'demo');
  await page.click('input[value="Log In"]');
  await page.click('a[href*="openaccount.htm"]');
  await page.waitForTimeout(2000);
  try {
    await page.waitForSelector('#fromAccountId option', { timeout: 3000 });
    console.log("Visible passed!");
  } catch(e) {
    console.log("Visible failed:", e.message);
  }
  try {
    await page.waitForSelector('#fromAccountId option', { state: 'attached', timeout: 3000 });
    console.log("Attached passed!");
  } catch(e) {
    console.log("Attached failed:", e.message);
  }
  await browser.close();
})();
