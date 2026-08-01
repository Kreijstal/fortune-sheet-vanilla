/**
 * Browser smoke test: serves the demo page and verifies the vanilla build
 * actually renders and responds to interactions.
 *
 * Run: node packages/vanilla/test/smoke.mjs
 */
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.join(here, "..", "demo");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let file = path.join(demoDir, url.pathname === "/" ? "index.html" : url.pathname);
  if (!file.startsWith(demoDir) && !file.startsWith(path.join(here, "..", "dist"))) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end("not found: " + url.pathname);
    return;
  }
  res.writeHead(200, {
    "content-type": MIME[path.extname(file)] || "application/octet-stream",
  });
  fs.createReadStream(file).pipe(res);
});

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/`;

const browser = await chromium.launch({
  // use a locally cached chromium (playwright version mismatch in this env)
  executablePath:
    process.env.PW_EXECUTABLE ||
    "/home/kreijstal/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") pageErrors.push(m.text());
});

try {
  await page.goto(url, { waitUntil: "networkidle" });

  // 1. canvas rendered
  const canvas = await page.waitForSelector("canvas.fortune-sheet-canvas", {
    timeout: 5000,
  });
  const canvasBox = await canvas.boundingBox();
  check("canvas mounted & sized", !!canvasBox && canvasBox.width > 200, JSON.stringify(canvasBox));

  // 2. first sheet's title rendered on canvas (no DOM assertion possible, but
  //    make sure the container is visible and tabs exist)
  const tabs = await page.locator(".luckysheet-sheets-item").count();
  check("two sheet tabs rendered", tabs === 2, `${tabs} tabs`);

  // 3. click cell B2 and type a value, then Enter.
  // Demo sets custom column widths: col0=130px, col1=110px → col1 spans
  // [130, 240) inside the cell area. Row index 1 spans [19, 38).
  const cellArea = await page.locator(".fortune-cell-area").boundingBox();
  const clickX = cellArea.x + 185; // inside B column
  const clickY = cellArea.y + 29; // inside row 2 (index 1)
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(100);

  await page.keyboard.type("Hello vanilla");
  await page.waitForTimeout(150);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);

  // read back via the exposed instance — B2 should now contain the typed text
  const b2 = await page.evaluate(() => {
    const sheetEl = document.getElementById("sheet");
    return sheetEl.__sheet ? sheetEl.__sheet.getData()[0].data?.[1]?.[1] : null;
  });
  check(
    "typed value committed to B2",
    !!b2 && JSON.stringify(b2).includes("Hello vanilla"),
    JSON.stringify(b2)
  );

  // 4. undo should remove it
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(200);
  const b2afterUndo = await page.evaluate(() => {
    const sheetEl = document.getElementById("sheet");
    return sheetEl.__sheet ? sheetEl.__sheet.getData()[0].data?.[1]?.[1] : null;
  });
  check("undo clears the cell", b2afterUndo == null, JSON.stringify(b2afterUndo));

  // 5. switch to sheet 2 via tab
  await page.locator(".luckysheet-sheets-item").nth(1).click();
  await page.waitForTimeout(200);
  const active = await page
    .locator(".luckysheet-sheets-item-active .luckysheet-sheets-item-name")
    .textContent();
  check("tab switch works", active === "Sheet 2", active);

  // 6. formulas compute (F4 total = 11500)
  const f4 = await page.evaluate(() =>
    document.getElementById("sheet").__sheet.getData()[0].data?.[5]?.[5]
  );
  check("formula =SUM(F4:F5) computes", f4?.v === 11500, JSON.stringify(f4));

  // 7. API: insert row + merge (on sheet 1)
  await page.locator(".luckysheet-sheets-item").nth(0).click();
  await page.waitForTimeout(200);
  const apiChecks = await page.evaluate(async () => {
    const s = document.getElementById("sheet").__sheet;
    const before = s.getData()[0].data.length;
    s.apiRef.insertRowOrColumn("row", 0, 1, "rightbottom");
    await new Promise((res) => setTimeout(res, 100));
    const after = s.getData()[0].data.length;
    s.apiRef.mergeCells([{ row: [6, 6], column: [1, 3] }], "merge-all");
    await new Promise((res) => setTimeout(res, 100));
    const merge = s.getData()[0].config?.merge?.["6_1"];
    return { before, after, merge: JSON.stringify(merge) };
  });
  check(
    "insertRowOrColumn + mergeCells APIs work",
    apiChecks.after === apiChecks.before + 1 &&
      apiChecks.merge.includes('"cs":3'),
    JSON.stringify(apiChecks)
  );

  // 8. wheel scroll changes scrollTop
  const cellAreaBox = await page.locator(".fortune-cell-area").boundingBox();
  await page.mouse.move(cellAreaBox.x + 300, cellAreaBox.y + 300);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(300);
  const scrollTop = await page.evaluate(
    () => document.getElementById("sheet").__sheet.store.ctx.scrollTop
  );
  check("wheel scrolling works", scrollTop > 0, `scrollTop=${scrollTop}`);

  await page.screenshot({ path: path.join(here, "screenshot.png") });

  check("no page errors", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 300));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
