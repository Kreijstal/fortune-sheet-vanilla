/**
 * Build script: bundles fortune-sheet-vanilla with esbuild.
 *
 * - dist/index.mjs                     — self-contained ESM module
 * - dist/fortune-sheet.vanilla.min.js  — single-file IIFE (global `FortuneSheet`)
 *
 * Everything (engine, formula parser, UI shell) lives under src/ and is
 * bundled straight from source — no pre-build step needed.
 */
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const shared = {
  bundle: true,
  logLevel: "info",
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' },
};

await esbuild.build({
  ...shared,
  entryPoints: [path.join(root, "src/index.js")],
  format: "esm",
  outfile: path.join(root, "dist/index.mjs"),
  minify: process.env.DEBUG ? false : true,
});

await esbuild.build({
  ...shared,
  entryPoints: [path.join(root, "src/standalone.js")],
  format: "iife",
  outfile: path.join(root, "dist/fortune-sheet.vanilla.min.js"),
  minify: process.env.DEBUG ? false : true,
});

// keep a copy next to the demo so it works with any static file server
fs.mkdirSync(path.join(root, "demo/dist"), { recursive: true });
fs.copyFileSync(
  path.join(root, "dist/fortune-sheet.vanilla.min.js"),
  path.join(root, "demo/dist/fortune-sheet.vanilla.min.js")
);

console.log("build ok ->", path.join(root, "dist"));
