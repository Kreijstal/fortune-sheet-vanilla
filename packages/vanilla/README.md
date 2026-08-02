# @fortune-sheet/vanilla

A **React-free** spreadsheet component for the browser, forked from
[fortune-sheet](https://github.com/ruilisi/fortune-sheet) — a TypeScript
rewrite of [Luckysheet](https://github.com/mengshukeji/Luckysheet), MIT
licensed. This package is the UI shell from the
[fortune-sheet-vanilla](https://github.com/kreijstal/fortune-sheet-vanilla)
fork, which removed upstream's React layer and converted the engine to
plain JS + JSDoc.

The spreadsheet engine (`@fortune-sheet/core`) was already vanilla — it paints
everything onto a `<canvas>` and exposes plain event handlers. The only React
in the original project was the UI shell around it (mounting the canvas,
wiring events, re-rendering the overlays). This package replaces that shell
with **plain JavaScript and DOM**, so you can embed a full-featured Excel-like
grid with zero framework dependencies. The engine itself is plain JS too
(JSDoc types) — no TypeScript anywhere.

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
npm install @fortune-sheet/vanilla
```

```js
import { FortuneSheet } from "@fortune-sheet/vanilla";
const sheet = new FortuneSheet(document.getElementById("sheet"), { data });
```

## What works

- Canvas rendering (cells, headers, grid lines, frozen panes)
- Mouse selection, drag-select, fill handle, move-cells drag
- In-cell editing (double-click or just type), formulas with live recalculation
- Keyboard navigation (arrows, Tab, Enter, F2, Delete, Ctrl+C/V/Z/Y, Ctrl+Shift+F)
- Copy / paste (from Excel or other sheets too), undo / redo
- Multiple sheets: tabs, add sheet (`+`), rename (double-click a tab)
- Row/column headers with click-to-select-row/column, corner → select all
- Wheel scrolling, scrollbars, window resize
- Stat bar (count / sum / average / max / min of the selection)
- The full `@fortune-sheet/core` API: `setCellValue`, `mergeCells`,
  `insertRowOrColumn`, `deleteRowOrColumn`, `freeze`, `setSelection`,
  `getCellsByRange`, … (see `instance.apiRef`)
- Zoom via `Ctrl + + / -`

## Not (yet) ported

The React toolbar and dialogs (font/border pickers, conditional formatting,
data validation, custom sort, images, comments, …). The engine functions for
all of those exist in `@fortune-sheet/core` and are reachable through
`apiRef` — only their React UI shells are missing. If you need one, the
`packages/react` folder from upstream can be used as a reference to port it.

## API

| method | description |
| --- | --- |
| `new FortuneSheet(container, options)` | mount the sheet |
| `sheet.getData()` | full workbook data (expanded `data` matrices) |
| `sheet.getSheetData()` | currently active sheet |
| `sheet.setData(data)` | replace the workbook data |
| `sheet.undo()` / `sheet.redo()` | undo / redo |
| `sheet.apiRef.*` | everything from `@fortune-sheet/core`'s api |
| `sheet.setContext(recipe, options)` | low-level immer producer access |
| `sheet.destroy()` | unbind events and remove DOM |

Options are the same `Settings` as fortune-sheet (`data`, `row`, `column`,
`allowEdit`, `lang`, `rowHeaderWidth`, `columnHeaderHeight`,
`generateSheetId`, `hooks`, `onChange`, `onOp`, …). Toolbar/formula-bar
settings (`showToolbar`, `showFormulaBar`) are accepted but ignored — this
build renders its own minimal chrome.

## Building

```bash
yarn          # install (workspaces: core, formula-parser, vanilla)
yarn build    # bundles dist/index.mjs + dist/fortune-sheet.vanilla.min.js
yarn demo     # build + serve the demo at http://localhost:8080
node packages/vanilla/test/smoke.mjs   # headless-browser smoke test
```

The bundle inlines `@fortune-sheet/core`, `@fortune-sheet/formula-parser`,
`lodash` and `immer` — it is fully self-contained. No TypeScript toolchain is
involved: core is JavaScript with JSDoc types.

## License

MIT (inherited from upstream [fortune-sheet](https://github.com/ruilisi/fortune-sheet)).
