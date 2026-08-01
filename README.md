# fortune-sheet-vanilla

**React-free fork of [fortune-sheet](https://github.com/ruilisi/fortune-sheet)** — the
same spreadsheet engine (`@fortune-sheet/core`, canvas-based, formula engine,
undo/redo, collaboration ops), with the React UI shell replaced by a
no-framework wrapper.

```
packages/
├── core            @fortune-sheet/core            — the engine, converted to plain JS + JSDoc
├── formula-parser  @fortune-sheet/formula-parser  — formula parser (already JS)
└── vanilla         @fortune-sheet/vanilla         — NEW: plain-JS UI shell
```

Everything that was React-specific (`packages/react`, storybook, toolbar &
dialog components, react peer deps) has been **removed**, and the remaining
TypeScript engine has been converted to **JavaScript with JSDoc types** —
zero TypeScript in the repo, but IDEs still get full autocomplete via the
`@typedef`/`@param` annotations (`import("@fortune-sheet/core").Context`
etc. resolves; verified with `tsc --checkJs`).

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

The engine itself was then converted from TypeScript to **JavaScript + JSDoc**
(`packages/core/convert-to-jsdoc.mjs` documents the conversion): tsc emitted
clean JS, and every exported type/interface/function signature was turned
into `@typedef` / `@param` / `@returns` comments. The whole repo is now pure
JS — no `.ts` files, no TS toolchain needed at build time (esbuild bundles it
directly).

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
