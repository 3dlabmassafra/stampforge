import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(msg.type() + ': ' + msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR: ' + err.toString());
  });

  await page.goto('http://localhost:8000', {waitUntil: 'networkidle0'});
  
  const fileInput = await page.$('#svg-input');
  await fileInput.uploadFile(path.join(__dirname, 'test_logo.svg'));
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
