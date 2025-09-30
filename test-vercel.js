const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Vercel deployment...');

  // Listen to console logs from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    await page.goto('https://cc-financial-40th5pcs0-millenniumists-projects.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('\n=== Page Title ===');
    console.log(await page.title());

    // Wait a bit for data to load
    await page.waitForTimeout(3000);

    console.log('\n=== Checking for errors ===');
    const errorElement = await page.$('.text-destructive');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('Error found:', errorText);

      // Get the full error card content
      const errorCard = await page.$('text=เกิดข้อผิดพลาด');
      if (errorCard) {
        const fullError = await page.evaluate(() => {
          const card = document.querySelector('[class*="max-w"]');
          return card ? card.textContent : 'Could not get full error';
        });
        console.log('Full error message:', fullError);
      }
    } else {
      console.log('No error found - checking if data loaded');

      // Check if data loaded
      const incomeTotal = await page.$('text=/รายรับรวม/');
      console.log('Income section found:', !!incomeTotal);

      if (incomeTotal) {
        const amount = await page.$eval('text=/฿[0-9,]+/', el => el.textContent);
        console.log('Amount displayed:', amount);
      }
    }

    console.log('\n=== Taking screenshot ===');
    await page.screenshot({ path: 'vercel-screenshot.png', fullPage: true });
    console.log('Screenshot saved as vercel-screenshot.png');

    console.log('\nBrowser will stay open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('Error testing page:', error.message);
  }

  await browser.close();
})();