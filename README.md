# fortune-sheet-vanilla

A **single-package, React-free, TypeScript-free fork of
[FortuneSheet](https://github.com/ruilisi/fortune-sheet)** — an Excel /
Google Sheets-style spreadsheet for the browser.

Everything is in one npm package: the canvas engine, the formula parser, and
a no-framework UI shell. No React, no TypeScript, no build step required to
use it — just a `<script>` tag or `npm install`.

## About this fork

**Upstream:** [`ruilisi/fortune-sheet`](https://github.com/ruilisi/fortune-sheet)
is a drop-in JavaScript spreadsheet library (canvas rendering, formulas,
undo/redo, collaboration ops). It is itself a TypeScript rewrite of
[Luckysheet](https://github.com/mengshukeji/Luckysheet) by
[Ruilisi](https://github.com/ruilisi) (xiemala), and is MIT-licensed.

**Basis:** cut from upstream at commit
[`9434660`](https://github.com/ruilisi/fortune-sheet/commit/9434660) (upstream
`HEAD` at fork time). That commit and everything before it is unmodified
upstream history; the fork's own commits start at `8ffd07d`.

**What this fork changed:**

1. **Removed React.** The upstream UI shell (`@fortune-sheet/react` — Workbook,
   Sheet, SheetOverlay, Toolbar, dialogs, storybook) is gone.
2. **Added a vanilla wrapper.** The engine is mounted from plain JavaScript:
   `new FortuneSheet(el, { data })`.
3. **Dropped TypeScript.** The engine was converted from TS to
   **JavaScript with JSDoc types** — IDE autocomplete still works via the
   `@typedef`/`@param` annotations, but there are zero `.ts` files.
4. **Merged into one package.** Upstream's monorepo (`core` + `formula-parser`
   + `react`) became a single npm package, and its entry re-exports
   **everything** the original packages exposed:

   ```
   src/
   ├── index.js            — public API (FortuneSheet class) + full engine + parser
   ├── store.js … events.js, sync.js, renderer.js, api.js, standalone.js
   ├── core/               — the engine: canvas, data model, events, formulas
   └── formula-parser/     — formula parser (from upstream)
   ```

## Quick start (script tag)

```html
<div id="sheet" style="position:absolute; inset:0"></div>

<script src="dist/fortune-sheet.vanilla.min.js"></script>
<script>
  const sheet = new FortuneSheet(document.getElementById("sheet"), {
    data: [
      {
        name: "Sheet1",
        celldata: [
          { r: 0, c: 0, v: { v: "hello", bl: 1 } },
          { r: 0, c: 1, v: { v: 42, m: "42" } },
          { r: 1, c: 1, v: { v: 84, f: "=B1*2", m: "84" } },
        ],
      },
    ],
    allowEdit: true,
  });
</script>
```

## Or via npm

```bash
npm install fortune-sheet-vanilla
```

```js
import { FortuneSheet } from "fortune-sheet-vanilla";
const sheet = new FortuneSheet(document.getElementById("sheet"), { data });
```

## Or via esm.sh (no install)

The repo is served by [esm.sh](https://esm.sh) directly from GitHub, so you
can import it in any browser ESM module with zero setup:

```js
import { FortuneSheet } from "https://esm.sh/gh/Kreijstal/fortune-sheet-vanilla";
```

Run `node test/esmsh.mjs` to verify compatibility (network + pushed commit
required). Note: the CJS `@formulajs/formulajs` package is served by esm.sh
with its ~450 formula functions on the namespace's `.default` — the parser
handles both that shape and bundler-style named exports.

## What the package exposes

The main entry re-exports **all three original packages**, so nothing is hidden:

```js
import {
  // the vanilla shell
  FortuneSheet, Store,
  // the engine (@fortune-sheet/core): api namespace, Canvas, event handlers, …
  api, Canvas, defaultContext, defaultSettings, handleGlobalKeyDown,
  handlePaste, insertRowCol, …,
  // the formula parser (@fortune-sheet/formula-parser)
  Parser, SUPPORTED_FORMULAS, ERROR_REF, ERROR_VALUE, columnIndexToLabel, …,
} from "fortune-sheet-vanilla";
```

Heritage subpaths work too, mirroring the original package split:

```js
import { api } from "fortune-sheet-vanilla/core"; // the engine
import { Parser } from "fortune-sheet-vanilla/formula-parser"; // the parser
```

The instance also exposes the engine API at runtime as `sheet.apiRef.*` (same
method names as the upstream React `Workbook` ref).

## What works

- Canvas rendering (cells, headers, grid lines, frozen panes)
- Mouse selection, drag-select, fill handle, move-cells drag
- In-cell editing (double-click or just type), formulas with live recalculation
- Keyboard navigation (arrows, Tab, Enter, F2, Delete, Ctrl+C/V/Z/Y)
- Copy / paste (from Excel or other sheets too), undo / redo
- Multiple sheets: tabs, add sheet (`+`), rename (double-click a tab)
- Row/column headers with click-to-select, corner → select all
- Wheel scrolling, scrollbars, window resize
- Stat bar (count / sum / average / max / min of the selection)
- The full engine API: `setCellValue`, `mergeCells`, `insertRowOrColumn`,
  `deleteRowOrColumn`, `freeze`, `setSelection`, `getCellsByRange`, …
  (see `sheet.apiRef`), plus zoom via `Ctrl + + / -`

## API

| method | description |
| --- | --- |
| `new FortuneSheet(container, options)` | mount the sheet |
| `sheet.getData()` | full workbook data (expanded `data` matrices) |
| `sheet.getSheetData()` | currently active sheet |
| `sheet.setData(data)` | replace the workbook data |
| `sheet.undo()` / `sheet.redo()` | undo / redo |
| `sheet.apiRef.*` | the engine API (same as upstream's Workbook ref) |
| `sheet.setContext(recipe, options)` | low-level immer producer access |
| `sheet.destroy()` | unbind events and remove DOM |

Options are the upstream `Settings` (`data`, `row`, `column`, `allowEdit`,
`lang`, `rowHeaderWidth`, `columnHeaderHeight`, `generateSheetId`, `hooks`,
`onChange`, `onOp`, …). Toolbar/formula-bar settings are accepted but ignored
— this build renders its own minimal chrome.

## Building & testing

```bash
yarn           # install
yarn build     # bundles dist/index.mjs + dist/fortune-sheet.vanilla.min.js
yarn demo      # build + serve the demo at http://localhost:8080
yarn test      # headless-browser smoke test (10 checks)
```bash
node test/exports.mjs # export-surface regression (19 checks)
node test/smoke.mjs   # headless-browser smoke test (10 checks)
```
```

The bundles inline `lodash`, `immer`, `dayjs`, `numeral`, `uuid`,
`@formulajs/formulajs` and `tiny-emitter` — fully self-contained. The source
itself is plain ESM and also works directly in Node.

## Not (yet) ported

The React toolbar and dialogs (font/border pickers, conditional formatting,
data validation, custom sort, images, comments, …). The engine functions for
all of those exist in `src/core` and are reachable through `apiRef` — only
their React UI shells were dropped.

## License

MIT — this fork inherits the upstream [MIT license](LICENSE). Upstream
`ruilisi/fortune-sheet` is MIT; the formula engine derives from
[handsoncode/formula-parser](https://github.com/handsontable/formula-parser).
