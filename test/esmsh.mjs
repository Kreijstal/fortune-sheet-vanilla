/**
 * esm.sh compatibility test.
 *
 * Loads the package from https://esm.sh (GitHub route, latest pushed commit)
 * in a real browser and exercises the major features, checking for errors.
 *
 * NOTE: network-dependent, and the commit must be pushed first (esm.sh builds
 * from the GitHub repo).
 *
 * Run: node test/esmsh.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

const html = `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
  <div id="sheet" style="position:absolute;inset:20px"></div>
  <script type="module">
    import { FortuneSheet } from 'https://esm.sh/gh/Kreijstal/fortune-sheet-vanilla@${hash}';
    window.__full = { steps: {} };
    const log = (k, v) => { window.__full.steps[k] = v; };
    try {
      const sheet = new FortuneSheet(document.getElementById('sheet'), {
        data: [{
          name: 'S1',
          celldata: [
            { r: 1, c: 0, v: { v: 1234.567, m: '1234.567' } },
            { r: 2, c: 0, v: { v: '=A2*2', m: '2469.134' } },
          ],
        }],
      });
      window.__sheet = sheet;
      log('instantiated', true);
      sheet.apiRef.setCellValue(1, 0, 0.25);
      sheet.apiRef.setCellFormat(1, 0, 'ct', { fa: '0.00%', t: 'n' });
      await new Promise(r => setTimeout(r, 300));
      log('numeralFormat', sheet.getData()[0].data?.[1]?.[0]?.m);
      sheet.apiRef.setCellValue(5, 0, 21);
      sheet.apiRef.setCellValue(6, 0, 21);
      sheet.apiRef.setCellValue(7, 0, { f: '=SUM(A6:A7)' });
      await new Promise(r => setTimeout(r, 600));
      log('formula', sheet.getData()[0].data?.[7]?.[0]?.v);
      sheet.apiRef.setCellValue(8, 0, { v: 43845, m: '43845', ct: { fa: 'yyyy/m/d', t: 'n' } });
      await new Promise(r => setTimeout(r, 300));
      log('dateSet', true);
      sheet.apiRef.addSheet();
      await new Promise(r => setTimeout(r, 300));
      log('addSheet', sheet.getData().length === 2);
      sheet.apiRef.activateSheet({ id: sheet.getData()[0].id });
      await new Promise(r => setTimeout(r, 300));
      sheet.apiRef.freeze('row', { row: 2, column: 0 });
      sheet.apiRef.insertRowOrColumn('row', 0, 1, 'rightbottom');
      sheet.apiRef.mergeCells([{ row: [2, 2], column: [0, 2] }], 'merge-all');
      sheet.apiRef.setSelection([{ row: [0, 1], column: [0, 1] }]);
      await new Promise(r => setTimeout(r, 400));
      log('freeze', !!sheet.getData()[0].frozen);
      log('merge', !!sheet.getData()[0].config?.merge?.['2_0']);
      log('selection', !!sheet.apiRef.getSelection());
      sheet.undo();
      await new Promise(r => setTimeout(r, 300));
      log('undo', true);
    } catch (e) {
      window.__full.error = String(e).slice(0, 500);
    }
  </script>
</body></html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});
await new Promise((r) => server.listen(0, r));

const browser = await chromium.launch({
  executablePath:
    process.env.PW_EXECUTABLE ||
    '/home/kreijstal/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell',
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 250)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 250));
});
page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url().slice(0, 100)));

console.log('esm.sh commit:', hash);
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForTimeout(14000);

const result = await page.evaluate(() => window.__full || { notReady: true });
console.log(JSON.stringify(result, null, 1));
console.log('errors:', errors.length ? '\n' + [...new Set(errors)].join('\n') : 'none');

await browser.close();
server.close();

const failed =
  !result.steps?.instantiated ||
  result.steps?.numeralFormat !== '25.00%' ||
  result.steps?.formula !== 42 ||
  result.steps?.freeze !== true ||
  result.steps?.merge !== true ||
  result.steps?.selection !== true ||
  errors.length > 0;
process.exit(failed ? 1 : 0);
