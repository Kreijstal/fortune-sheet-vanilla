#!/usr/bin/env node
/**
 * Adds explicit `.js` (or `/index.js`) extensions to relative import/export
 * specifiers — Node ESM requires them, so each package can be used standalone
 * (not just via a bundler).
 *
 * Handles: `from './x'`, `from '../x'`, `from '..'`, `from '.'`,
 * `export * from './x'`, `export { a } from './x'`.
 *
 * Run: node scripts/fix-imports.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dry = process.argv.includes('--dry');

const targets = ['src/core', 'src/formula-parser'];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function resolveSpecifier(spec, baseDir) {
  if (spec.endsWith('.js') || spec.endsWith('.mjs')) return null;
  const abs = path.resolve(baseDir, spec);
  for (const cand of [abs + '.js', abs + '.mjs', path.join(abs, 'index.js')]) {
    if (fs.existsSync(cand)) {
      return './' + path.relative(baseDir, cand).split(path.sep).join('/');
    }
  }
  return null; // unresolved — leave untouched
}

let changed = 0;
let warnings = [];
for (const target of targets) {
  for (const file of walk(path.join(root, target))) {
    let code = fs.readFileSync(file, 'utf8');
    const baseDir = path.dirname(file);
    let orig = code;

    // from './x' / from '../x' / from './x.js' (already fine)
    code = code.replace(
      /(\bfrom\s+["'])(\.\.?\/[^"']+)(["'])/g,
      (m, pre, spec, post) => {
        const fixed = resolveSpecifier(spec, baseDir);
        if (!fixed) {
          warnings.push(`${path.relative(root, file)}: unresolved '${spec}'`);
          return m;
        }
        if (fixed !== spec) changed++;
        return pre + fixed + post;
      }
    );

    // from '..' / from '.'
    code = code.replace(
      /(\bfrom\s+["'])(\.\.?)(["'])/g,
      (m, pre, spec, post) => {
        const fixed =
          spec === '..' ? './index.js' : './index.js';
        if (fixed !== spec) changed++;
        return pre + fixed + post;
      }
    );

    if (code !== orig) {
      if (!dry) fs.writeFileSync(file, code);
    }
  }
}

console.log(
  dry ? `[dry-run] would fix ${changed} specifiers` : `fixed ${changed} specifiers`
);
if (warnings.length) {
  console.log('warnings:');
  for (const w of [...new Set(warnings)].slice(0, 20)) console.log(' -', w);
}
