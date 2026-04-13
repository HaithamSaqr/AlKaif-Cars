const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, 'screenshots');

const pages = [
  { name: '01-homepage', url: '/', wait: 2000 },
  { name: '02-cars', url: '/cars', wait: 1500 },
  { name: '03-brands', url: '/brands', wait: 1000 },
  { name: '04-admin-login', url: '/admin/login', wait: 1000, noAuth: true },
  { name: '05-admin-dashboard', url: '/admin', wait: 1000 },
  { name: '06-admin-cars', url: '/admin/cars', wait: 1000 },
  { name: '07-admin-requests', url: '/admin/purchase-requests', wait: 1000 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Login to admin first
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', 'admin');
  await page.type('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  console.log('Logged in to admin');

  for (const p of pages) {
    try {
      await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, p.wait || 1000));
      const filePath = path.join(OUT, `${p.name}.png`);
      await page.screenshot({ path: filePath, type: 'png' });
      console.log(`Captured: ${p.name}`);
    } catch (e) {
      console.log(`Failed ${p.name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log('Done!');
})();
