/**
 * Build script: bundles @fortune-sheet/vanilla with esbuild.
 *
 * - dist/index.mjs                  — self-contained ESM module
 * - dist/fortune-sheet.vanilla.min.js — single-file IIFE (global `FortuneSheet`)
 * - demo/dist/main.js               — the demo page bundle
 *
 * @fortune-sheet/core and @fortune-sheet/formula-parser are bundled from
 * source (no pre-built dist needed).
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const pkg = path.join(root, "packages", "vanilla");

// Resolve workspace packages straight to their sources so we never need to
// build core/formula-parser beforehand.
const workspaceAliasPlugin = {
  name: "workspace-alias",
  setup(build) {
    const alias = (from, to) =>
      build.onResolve({ filter: new RegExp(`^${from}$`) }, () => ({
        path: path.join(root, "packages", to),
      }));
    alias("@fortune-sheet/core", "core/src/index.js");
    alias("@fortune-sheet/formula-parser", "formula-parser/src/index.js");
  },
};

const shared = {
  bundle: true,
  logLevel: "info",
  legalComments: "none",
  plugins: [workspaceAliasPlugin],
  define: { "process.env.NODE_ENV": '"production"' },
};

await esbuild.build({
  ...shared,
  entryPoints: [path.join(pkg, "src/index.js")],
  format: "esm",
  outfile: path.join(pkg, "dist/index.mjs"),
  minify: process.env.DEBUG ? false : true,
});

await esbuild.build({
  ...shared,
  entryPoints: [path.join(pkg, "src/standalone.js")],
  format: "iife",
  outfile: path.join(pkg, "dist/fortune-sheet.vanilla.min.js"),
  minify: process.env.DEBUG ? false : true,
});

// keep a copy next to the demo so it works with any static file server
import fs from "node:fs";
fs.mkdirSync(path.join(pkg, "demo/dist"), { recursive: true });
fs.copyFileSync(
  path.join(pkg, "dist/fortune-sheet.vanilla.min.js"),
  path.join(pkg, "demo/dist/fortune-sheet.vanilla.min.js")
);

console.log("build ok ->", path.join(pkg, "dist"));
