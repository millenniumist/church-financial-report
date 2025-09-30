const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  console.log('Screenshot saved as screenshot.png');

  // Wait a bit to see the page
  await page.waitForTimeout(3000);

  // Get page content
  const content = await page.content();
  console.log('\n=== Page Title ===');
  console.log(await page.title());

  console.log('\n=== Checking for errors ===');
  const errorElement = await page.$('.bg-red-50');
  if (errorElement) {
    const errorText = await errorElement.textContent();
    console.log('Error found:', errorText);
  } else {
    console.log('No error banner found');
  }

  console.log('\n=== Checking for data ===');
  const incomeTable = await page.$('text=Income');
  const expensesTable = await page.$('text=Expenses');
  console.log('Income section found:', !!incomeTable);
  console.log('Expenses section found:', !!expensesTable);

  console.log('\nBrowser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
})();