// Bug-reproduction test: added-sheet data + Escape-to-cancel.
// Usage: node test/_bug2-tmp.mjs [url]
import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath:
    process.env.PW_EXECUTABLE ||
    "/home/kreijstal/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
const url = process.argv[2] || "http://localhost:9000/";
await page.goto(url);
await page.waitForTimeout(url.includes("9000") ? 12000 : 1500);

const r = {};
await page.evaluate(() => {
  const s = document.getElementById("sheet").__sheet;
  s.apiRef.addSheet();
});
await page.waitForTimeout(400);
await page.locator(".luckysheet-sheets-item").last().click();
await page.waitForTimeout(500);
r.addedSheetData = await page.evaluate(() => {
  const s = document.getElementById("sheet").__sheet;
  const idx = s.getData().length - 1;
  const sh = s.getData()[idx];
  return { hasData: Array.isArray(sh.data), rows: sh.data?.length };
});
const ca = await page.locator(".fortune-cell-area").boundingBox();
await page.mouse.click(ca.x + 185, ca.y + 40);
await page.waitForTimeout(300);
r.selectionAfterClick = await page.evaluate(() => {
  const s = document.getElementById("sheet").__sheet;
  return JSON.stringify(s.store.ctx.luckysheet_select_save?.map((x) => x.row));
});
await page.keyboard.type("hello");
await page.waitForTimeout(300);
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
r.cellAfterEnter = await page.evaluate(() => {
  const s = document.getElementById("sheet").__sheet;
  const idx = s.getData().length - 1;
  return JSON.stringify(s.getData()[idx].data?.[1]?.[1]);
});
// escape on sheet 1
await page.locator(".luckysheet-sheets-item").nth(0).click();
await page.waitForTimeout(400);
await page.mouse.dblclick(ca.x + 60, ca.y + 30);
await page.waitForTimeout(300);
await page.keyboard.type("esc-test");
await page.waitForTimeout(200);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
r.escapeCancel = await page.evaluate(() => {
  const s = document.getElementById("sheet").__sheet;
  return {
    cellUpdate: JSON.stringify(s.store.ctx.luckysheetCellUpdate),
    editorText: document.getElementById("luckysheet-rich-text-editor")?.innerText,
  };
});
console.log(JSON.stringify(r, null, 1));
console.log("errors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
const ok =
  r.addedSheetData?.hasData &&
  r.selectionAfterClick?.includes("[1,1]") &&
  r.cellAfterEnter?.includes("hello") &&
  r.escapeCancel?.cellUpdate === "[]";
console.log(ok ? "BUGS FIXED" : "STILL BROKEN");
process.exit(ok ? 0 : 1);
