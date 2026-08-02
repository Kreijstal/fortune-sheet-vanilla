#!/usr/bin/env node
/**
 * Converts `import _ from 'lodash-es'` (whole-module default import) into
 * explicit single-function imports, e.g.:
 *
 *   import { cloneDeep, isNil, map } from 'lodash-es';
 *   ... map(arr, fn) ...            // was _.map(arr, fn)
 *
 * Only the methods actually used in each file are imported, and `_.method`
 * call sites are rewritten to `method` in code positions only (comments and
 * strings are left untouched, since they may legitimately contain `_.foo`).
 *
 * Run: node scripts/lodash-single-imports.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dry = process.argv.includes('--dry');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const isIdChar = (c) => c !== undefined && /[A-Za-z0-9_$]/.test(c);

/**
 * Walks code and returns:
 *   { methods: Set<name>, uses: [{start, end, name}], bareUnderscore: bool }
 * Template literals are handled including ${...} expressions (we skip to the
 * matching backtick, treating ${ } as code).
 */
function analyze(code) {
  const methods = new Set();
  const uses = [];
  let bareUnderscore = false;
  let i = 0;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === '/' && next === '/') {
      while (i < n && code[i] !== '\n') i++;
    } else if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
    } else if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n) {
        if (code[i] === '\\') i += 2;
        else if (code[i] === q) { i++; break; }
        else i++;
      }
    } else if (ch === '`') {
      // template literal: track ${ } expressions as code, skip plain text
      i++;
      while (i < n) {
        if (code[i] === '\\') i += 2;
        else if (code[i] === '`') { i++; break; }
        else if (code[i] === '$' && code[i + 1] === '{') {
          // nested: recurse on the expression, then continue
          const exprEnd = findExpressionEnd(code, i + 2);
          const sub = analyze(code.slice(i + 2, exprEnd));
          for (const m of sub.methods) methods.add(m);
          for (const u of sub.uses) uses.push({ start: u.start + i + 2, end: u.end + i + 2, name: u.name });
          if (sub.bareUnderscore) bareUnderscore = true;
          i = exprEnd;
        } else i++;
      }
    } else if (isIdChar(ch)) {
      // read whole identifier
      let j = i;
      while (j < n && isIdChar(code[j])) j++;
      const ident = code.slice(i, j);
      if (ident === '_') {
        if (code[j] === '.') {
          let k = j + 1;
          let m = '';
          while (k < n && /[A-Za-z0-9_$]/.test(code[k])) { m += code[k]; k++; }
          if (m) {
            methods.add(m);
            uses.push({ start: i, end: k, name: m });
          }
          i = k;
        } else {
          bareUnderscore = true;
          i = j;
        }
      } else {
        i = j;
      }
    } else i++;
  }
  return { methods, uses, bareUnderscore };
}

/** find the index just past the closing `}` of a ${...} expression.
 * String/comment/template aware so braces inside literals don't count. */
function findExpressionEnd(code, start) {
  let depth = 0;
  let i = start;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === '/' && next === '/') {
      while (i < n && code[i] !== '\n') i++;
    } else if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
    } else if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n) {
        if (code[i] === '\\') i += 2;
        else if (code[i] === q) { i++; break; }
        else i++;
      }
    } else if (ch === '`') {
      i++;
      while (i < n) {
        if (code[i] === '\\') i += 2;
        else if (code[i] === '`') { i++; break; }
        else if (code[i] === '$' && code[i + 1] === '{') i = findExpressionEnd(code, i + 2);
        else i++;
      }
    } else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    } else i++;
  }
  return n;
}

let totalFiles = 0;
for (const file of walk(path.join(root, 'src'))) {
  let code = fs.readFileSync(file, 'utf8');
  if (!/from 'lodash-es'/.test(code)) continue;

  const { methods, uses, bareUnderscore } = analyze(code);
  totalFiles++;

  if (bareUnderscore) {
    console.log('SKIP (bare _ usage):', path.relative(root, file));
    continue;
  }

  const sorted = [...methods].sort();

  // 1. replace the import statement
  const importRe = /import\s+_\s+from\s+'lodash-es';\n?/;
  if (!importRe.test(code)) {
    console.log('SKIP (unrecognized import):', path.relative(root, file));
    continue;
  }
  const names = sorted.length
    ? sorted.length > 2
      ? `{\n  ${sorted.join(',\n  ')},\n}`
      : `{ ${sorted.join(', ')} }`
    : '';
  const newImport = sorted.length
    ? `import ${names} from 'lodash-es';\n`
    : '';
  code = code.replace(importRe, newImport);

  // 2. rewrite `_.method` -> `method` at code positions (backwards so
  //    offsets stay valid)
  for (const u of [...uses].sort((a, b) => b.start - a.start)) {
    code = code.slice(0, u.start) + u.name + code.slice(u.end);
  }

  if (!dry) fs.writeFileSync(file, code);
  console.log(
    `${dry ? '[dry] ' : ''}${path.relative(root, file)}: ${sorted.join(', ')}`
  );
}
console.log(`\n${dry ? 'would convert' : 'converted'} ${totalFiles} files`);
