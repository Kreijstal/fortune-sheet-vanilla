# fortune-sheet-vanilla

**React-free fork of [fortune-sheet](https://github.com/ruilisi/fortune-sheet)** — the
same spreadsheet engine (`@fortune-sheet/core`, canvas-based, formula engine,
undo/redo, collaboration ops), with the React UI shell replaced by a
no-framework wrapper.

```
packages/
├── core            @fortune-sheet/core            — the engine (unchanged, already React-free)
├── formula-parser  @fortune-sheet/formula-parser  — formula parser (unchanged)
└── vanilla         @fortune-sheet/vanilla         — NEW: plain-JS UI shell
```

Everything that was React-specific (`packages/react`, storybook, toolbar &
dialog components, react peer deps) has been **removed**.

## Quick start

```html
<div id="sheet" style="position:absolute; inset:0"></div>
<script src="packages/vanilla/dist/fortune-sheet.vanilla.min.js"></script>
<script>
  const sheet = new FortuneSheet(document.getElementById("sheet"), {
    data: [{ name: "Sheet1", celldata: [{ r: 0, c: 0, v: { v: "hi" } }] }],
  });
</script>
```

See [packages/vanilla/README.md](packages/vanilla/README.md) for the full API
and [packages/vanilla/demo](packages/vanilla/demo) for a runnable demo.

## How hard was "unreactifying" it?

Not very — because the hard part was already vanilla:

- `@fortune-sheet/core` + `@fortune-sheet/formula-parser` are pure TypeScript
  (zero React runtime deps). All the real work — canvas painting, the data
  model, mouse/keyboard/paste/copy handlers, formulas, undo/redo — lives
  there. (There was even a stray unused `import React` in core's settings.ts.)
- React was only the ~86-file UI shell: mount the canvas, wire DOM events to
  core handlers, re-render the DOM overlays (selection boxes, cell editor,
  scrollbars, tabs) when the immer-managed context changes.

So the fork replaces that shell with ~6 small vanilla modules
(`store.js`, `renderer.js`, `sync.js`, `events.js`, `api.js`, `index.js`).
The engine handlers (`handleCellAreaMouseDown`, `handleGlobalKeyDown`,
`handlePaste`, `handleGlobalWheel`, …) are called with the exact same
arguments as before — just without React in between.

## Commands

```bash
yarn install   # workspaces: core + formula-parser + vanilla
yarn build     # esbuild bundles → packages/vanilla/dist
yarn demo      # build + serve demo at http://localhost:8080
node packages/vanilla/test/smoke.mjs   # playwright smoke test (9 checks)
```

## Status / missing pieces

Working: rendering, selection, editing, formulas, copy/paste, undo/redo,
tabs (add/rename/switch), row/col header clicks, wheel scroll, resize,
stat bar, zoom, full core API surface via `apiRef`.

Not ported (engine functions exist but their React UI was dropped): toolbar,
formula bar, and dialogs (conditional formatting, data validation, custom
sort, images, comments, …).

## License

MIT (upstream is MIT).
