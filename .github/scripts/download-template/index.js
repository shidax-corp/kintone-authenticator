import { promises as fs } from 'node:fs';
import path from 'node:path';
import playwright from 'playwright';

const DOMAIN = process.env.DOMAIN;
const APP_ID = process.env.APP_ID;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const APP_NAME = process.env.APP_NAME || 'kintone Authenticator';
const APP_DESCRIPTION = process.env.APP_DESCRIPTION || '';

if (!DOMAIN || !APP_ID || !USERNAME || !PASSWORD) {
  console.error(
    'Error: Please set DOMAIN, APP_ID, USERNAME, and PASSWORD environment variables.'
  );
  process.exit(1);
}

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    `https://${DOMAIN}/k/admin/app/flow?app=${APP_ID}#section=settings`
  );

  // ログイン
  await page.type('input[name="username"]', USERNAME);
  await page.type('input[name="password"]', PASSWORD);
  await page.click('input[type="submit"]');
  await page.waitForNavigation();

  // 「アプリをテンプレートとしてダウンロード」をクリック
  await page.click(
    'button.gaia-argoui-admin-app-flow-settings-item-templatedownloaditem-button'
  );
  await page.waitForSelector('button[name="ok"]', { visible: true });

  // テンプレート名と説明を入力
  await page.type(
    'input.gaia-argoui-admin-app-flow-settings-templatedownload-templatedownloaddialog-templatename-input',
    APP_NAME
  );
  await page.type(
    'textarea.gaia-argoui-admin-app-flow-settings-templatedownload-templatedownloaddialog-templatedescription-textarea',
    APP_DESCRIPTION
  );

  // ダウンロードフォルダを準備
  const dir = path.join(process.cwd(), 'downloads');
  await fs.mkdir(dir, { recursive: true });

  // ダウンロード
  const download = page.waitForEvent('download');
  await page.click('button[name="ok"]');
  await (await download).saveAs(path.join(dir, 'template.zip'));

  await browser.close();
})();
