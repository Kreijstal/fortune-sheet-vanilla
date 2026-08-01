#!/usr/bin/env node
/**
 * One-shot converter: @fortune-sheet/core TypeScript -> JavaScript + JSDoc.
 *
 * Strategy:
 *   1. tsc already emitted clean .js (type-only imports elided) and .d.ts.
 *   2. This script reads each .d.ts and generates JSDoc comments:
 *      - exported types/interfaces  -> @typedef blocks (@property style)
 *      - exported functions         -> @param / @returns comments
 *      - exported consts            -> @type comments
 *      - exported classes           -> @class comments with constructor params
 *   3. Every name imported by the .d.ts gets a typedef re-export in the .js
 *      (`@typedef {import("./x.js").Name} Name`) so bare type names resolve.
 *   4. Unused runtime imports in the emitted .js are removed (counting only
 *      actual code, ignoring comments/strings).
 *   5. index.js gets a re-export typedef block for every exported type, so
 *      `import("@fortune-sheet/core").Context` still resolves in IDEs.
 *
 * Run: node packages/core/convert-to-jsdoc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const coreDir = path.dirname(fileURLToPath(import.meta.url));
const emitDir = path.join(coreDir, "ts-emit");
const srcDir = path.join(coreDir, "src");

// ---------------------------------------------------------------- helpers

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

function splitTop(str, sep) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(" || ch === "{" || ch === "[" || ch === "<") depth++;
    else if (ch === ")" || ch === "}" || ch === "]" || ch === ">") depth--;
    if (ch === sep && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function matchBracket(str, openIdx) {
  const open = str[openIdx];
  const close = { "(": ")", "{": "}", "[": "]" }[open];
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === open) depth++;
    else if (str[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return str.length - 1;
}

function findTopLevelColon(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(" || ch === "{" || ch === "[") depth++;
    else if (ch === ")" || ch === "}" || ch === "]") depth--;
    else if (ch === ":" && depth === 0) return i;
  }
  return -1;
}

function findTopLevelSemi(str) {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(" || ch === "{" || ch === "[" || ch === "<") depth++;
    else if (ch === ")" || ch === "}" || ch === "]" || ch === ">") depth--;
    else if (ch === ";" && depth === 0) return i;
  }
  return str.length;
}

/** recursive TS type -> JSDoc type (best effort) */
function tsTypeToJsdoc(s) {
  s = s.trim();
  if (s === "") return "any";

  // array sugar: T[] or (A | B)[] or (A | B)[][]
  if (s.endsWith("[]")) {
    const base = s.slice(0, -2).trim();
    return `Array<${tsTypeToJsdoc(base)}>`;
  }

  // parenthesized union: (A | B)
  if (s.startsWith("(")) {
    const close = matchBracket(s, 0);
    if (close === s.length - 1) {
      const inner = s.slice(1, -1);
      if (!inner.includes("=>")) return tsTypeToJsdoc(inner);
    }
  }

  // function type: (a: A, b: B) => Ret
  const fnMatch = s.match(/^\(([\s\S]*)\)\s*=>\s*([\s\S]+)$/);
  if (fnMatch) {
    const params = splitTop(fnMatch[1], ",")
      .map((p) => {
        const c = findTopLevelColon(p.trim());
        return c >= 0 ? tsTypeToJsdoc(p.trim().slice(c + 1)) : "any";
      })
      .join(", ");
    const ret = tsTypeToJsdoc(fnMatch[2]);
    return ret === "void" ? `function(${params})` : `function(${params}): ${ret}`;
  }

  // strip `readonly` modifiers
  s = s.replace(/\breadonly\s+/g, "");

  return s;
}

/** convert a TS parameter list to JSDoc @param lines (no indent) */
function paramsToJsdoc(sig) {
  const lines = [];
  if (!sig || sig.trim() === "") return lines;
  for (const raw of splitTop(sig, ",")) {
    const p = raw.trim();
    if (p === "" || p === "this") continue;
    if (p.startsWith("...")) {
      const rest = p.slice(3);
      const c = findTopLevelColon(rest);
      if (c >= 0) {
        const name = rest.slice(0, c).trim();
        let type = tsTypeToJsdoc(rest.slice(c + 1));
        type = type.replace(/^Array</, "").replace(/>$/, "");
        lines.push(` * @param {${type}} ...${name}`);
      } else {
        lines.push(` * @param {any} ...${rest.trim()}`);
      }
      continue;
    }
    if (p.startsWith("{") || p.startsWith("[")) {
      const c = findTopLevelColon(p);
      if (c >= 0) {
        lines.push(
          ` * @param {${tsTypeToJsdoc(p.slice(c + 1))}} ${p.slice(0, c).trim()}`
        );
      } else {
        lines.push(` * @param {Object} options`);
      }
      continue;
    }
    const colon = findTopLevelColon(p);
    let name = colon >= 0 ? p.slice(0, colon).trim() : p.trim();
    let type = colon >= 0 ? tsTypeToJsdoc(p.slice(colon + 1)) : "any";
    const eq = findTopLevelEq(name);
    if (eq >= 0) name = name.slice(0, eq).trim();
    let optional = false;
    if (name.endsWith("?")) {
      optional = true;
      name = name.slice(0, -1);
    }
    if (name === "") continue;
    lines.push(
      ` * @param {${type}} ${optional ? "[" + name + "]" : name}`
    );
  }
  return lines;
}

function findTopLevelEq(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(" || ch === "{" || ch === "[") depth++;
    else if (ch === ")" || ch === "}" || ch === "]") depth--;
    else if (ch === "=" && depth === 0) return i;
  }
  return -1;
}

// ------------------------------------------------------------ d.ts parsing

function parseDts(content) {
  const decls = [];
  const re =
    /export\s+(?:declare\s+)?(type|interface|function|class|const|let|var|enum)\s+([A-Za-z0-9_$]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const kind = m[1];
    const name = m[2];
    const after = content.slice(m.index + m[0].length);
    if (kind === "type") {
      const eqIdx = after.indexOf("=");
      if (eqIdx < 0) continue;
      const semi = findTopLevelSemi(after.slice(eqIdx + 1));
      decls.push({
        kind: "type",
        name,
        expr: after.slice(eqIdx + 1, eqIdx + 1 + semi),
      });
    } else if (kind === "interface") {
      const openIdx = after.indexOf("{");
      if (openIdx < 0) continue;
      const closeIdx = matchBracket(after, openIdx);
      decls.push({
        kind: "interface",
        name,
        body: after.slice(openIdx + 1, closeIdx),
      });
    } else if (kind === "function") {
      const paren = after.indexOf("(");
      if (paren < 0) continue;
      const closeParen = matchBracket(after, paren);
      const sig = after.slice(paren + 1, closeParen);
      const rest = after.slice(closeParen + 1);
      const semiIdx = findTopLevelSemi(rest);
      const afterSig = rest.slice(0, semiIdx).trim();
      decls.push({
        kind: "function",
        name,
        sig,
        ret: afterSig.startsWith(":") ? afterSig.slice(1).trim() : "void",
      });
    } else if (kind === "class") {
      const openIdx = after.indexOf("{");
      if (openIdx < 0) continue;
      const closeIdx = matchBracket(after, openIdx);
      const body = after.slice(openIdx + 1, closeIdx);
      const ctor = body.match(/constructor\s*\(([\s\S]*?)\)/);
      decls.push({ kind: "class", name, ctorSig: ctor ? ctor[1] : "" });
    } else if (kind === "const" || kind === "let" || kind === "var") {
      const colon = findTopLevelColon(after);
      let type = "any";
      if (colon >= 0) {
        const semi = findTopLevelSemi(after.slice(colon + 1));
        type = after.slice(colon + 1, colon + 1 + semi).trim();
      }
      decls.push({ kind: "const", name, type });
    } else if (kind === "enum") {
      decls.push({ kind: "enum", name });
    }
  }
  const imports = [];
  const imRe =
    /import\s+type\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']|import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
  let im;
  while ((im = imRe.exec(content)) !== null) {
    const names = (im[1] || im[3] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const from = im[2] || im[4];
    for (const n of names) {
      const [orig, alias] = n.split(/\s+as\s+/);
      imports.push({ name: (alias || orig).trim(), from: from.trim() });
    }
  }
  // non-exported types / interfaces used by exported signatures (e.g.
  // `type RefValues`) — give them local typedefs so names resolve.
  const localTypes = [];
  const localRe = /^(?:type|interface)\s+([A-Za-z0-9_$]+)\s*(?:<[^>]*>)?[\s=]*\{?/gm;
  let lm;
  while ((lm = localRe.exec(content)) !== null) {
    const name = lm[1];
    if (decls.some((d) => d.name === name)) continue;
    const lineStart = content.lastIndexOf("\n", lm.index) + 1;
    const line = content.slice(lineStart, content.indexOf("\n", lineStart) + 1);
    if (/^\s*export/.test(line)) continue;
    localTypes.push(name);
  }
  return { decls, imports, localTypes };
}

// --------------------------------------------------------- JSDoc rendering

function renderTypeBlock(name, expr) {
  const trimmed = expr.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const body = trimmed.slice(1, -1);
    const props = splitTop(body, ";");
    const lines = [`/**`, ` * @typedef {Object} ${name}`];
    for (const prop of props) {
      if (!prop.trim()) continue;
      const colon = findTopLevelColon(prop);
      if (colon < 0) continue;
      let pname = prop.slice(0, colon).trim();
      let ptype = tsTypeToJsdoc(prop.slice(colon + 1));
      if (pname.startsWith("readonly ")) pname = pname.slice(9).trim();
      let optional = false;
      if (pname.endsWith("?")) {
        optional = true;
        pname = pname.slice(0, -1);
      }
      const idx = pname.match(/^\[\s*(\w+)\s*:\s*(string|number)\s*\]$/);
      if (idx) {
        lines.push(
          ` * @property {Object.<${idx[2]}, ${ptype}>} ${pname}`
        );
        continue;
      }
      lines.push(
        ` * @property {${ptype}} ${optional ? "[" + pname + "]" : pname}`
      );
    }
    lines.push(` */`);
    return lines;
  }
  return [`/**`, ` * @typedef {${tsTypeToJsdoc(trimmed)}} ${name}`, ` */`];
}

function renderInterfaceBlock(name, body) {
  const props = splitTop(body, ";").filter((p) => p.trim());
  const lines = [`/**`, ` * @typedef {Object} ${name}`];
  for (const prop of props) {
    const p = prop.trim();
    if (p === "") continue;
    const methodMatch = p.match(
      /^([A-Za-z0-9_$?]+)\s*\(([\s\S]*)\)\s*(?::\s*([\s\S]+))?$/
    );
    if (methodMatch && !p.includes("=>")) {
      let mname = methodMatch[1].trim();
      const optional = mname.endsWith("?");
      if (optional) mname = mname.slice(0, -1);
      const ret = (methodMatch[3] || "void").trim();
      const paramTypes = splitTop(methodMatch[2], ",")
        .map((a) => {
          const c = findTopLevelColon(a.trim());
          return c >= 0 ? tsTypeToJsdoc(a.trim().slice(c + 1)) : "any";
        })
        .join(", ");
      const ftype =
        tsTypeToJsdoc(ret) === "void"
          ? `function(${paramTypes})`
          : `function(${paramTypes}): ${tsTypeToJsdoc(ret)}`;
      lines.push(
        ` * @property {${ftype}} ${optional ? "[" + mname + "]" : mname}`
      );
      continue;
    }
    const colon = findTopLevelColon(p);
    if (colon < 0) continue;
    let pname = p.slice(0, colon).trim();
    let ptype = tsTypeToJsdoc(p.slice(colon + 1));
    if (pname.startsWith("readonly ")) pname = pname.slice(9).trim();
    let optional = false;
    if (pname.endsWith("?")) {
      optional = true;
      pname = pname.slice(0, -1);
    }
    const idx = pname.match(/^\[\s*(\w+)\s*:\s*(string|number)\s*\]$/);
    if (idx) {
      lines.push(
        ` * @property {Object.<${idx[2]}, ${ptype}>} ${pname}`
      );
      continue;
    }
    lines.push(
      ` * @property {${ptype}} ${optional ? "[" + pname + "]" : pname}`
    );
  }
  lines.push(` */`);
  return lines;
}

function renderFnBlock(name, sig, ret) {
  const lines = [`/**`];
  lines.push(...paramsToJsdoc(sig));
  const r = tsTypeToJsdoc(ret || "void");
  if (r !== "void") lines.push(` * @returns {${r}}`);
  lines.push(` */`);
  if (lines.length === 2) return []; // nothing but the braces
  return lines;
}

function renderConstBlock(type) {
  return [`/**`, ` * @type {${tsTypeToJsdoc(type || "any")}}`, ` */`];
}

// ------------------------------------------------------ import cleanup

function stripCommentsAndStrings(code) {
  // char-level tokenizer: replaces comments and string/template literals with
  // spaces so identifier usage counts are accurate (regex-based stripping
  // cascades on unbalanced quotes inside comments, e.g. base64 in a URL).
  let out = "";
  let i = 0;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === "/" && next === "/") {
      while (i < n && code[i] !== "\n") i++;
      out += " ";
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      out += " ";
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < n) {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (code[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      out += " ";
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function cleanUnusedImports(code) {
  const importRe =
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["'][^"']+["'];?/g;
  let m;
  const stmts = [];
  while ((m = importRe.exec(code)) !== null) {
    stmts.push({
      full: m[0],
      names: m[1].split(",").map((s) => s.trim()).filter(Boolean),
    });
  }
  if (!stmts.length) return code;
  const stripped = stripCommentsAndStrings(code);
  for (const stmt of stmts) {
    const stmtStripped = stripCommentsAndStrings(stmt.full);
    const kept = [];
    for (const n of stmt.names) {
      const name = n.split(/\s+as\s+/).pop().trim();
      const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "g");
      const total = (stripped.match(re) || []).length;
      const inSelf = (stmtStripped.match(re) || []).length;
      if (total - inSelf > 0) kept.push(n);
    }
    if (kept.length !== stmt.names.length) {
      if (kept.length === 0) {
        code = code.replace(stmt.full, "");
      } else {
        const from = stmt.full.match(/from\s*(["'][^"']+["']);?$/)[1];
        const names =
          kept.length > 2
            ? `\n  ${kept.join(",\n  ")},\n`
            : ` ${kept.join(", ")} `;
        code = code.replace(stmt.full, `import {${names}} from ${from};`);
      }
    }
  }
  return code;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ------------------------------------------------------------------- main

const allTypeNames = [];
const typeDefinedIn = new Map(); // type name -> module that declares it
const seenTypedefs = new Set();

for (const dtsPath of walk(emitDir).filter((p) => p.endsWith(".d.ts"))) {
  const rel = path.relative(emitDir, dtsPath).replace(/\\/g, "/");
  const jsPath = path.join(emitDir, rel.replace(/\.d\.ts$/, ".js"));
  const targetJs = path.join(srcDir, rel.replace(/\.d\.ts$/, ".js"));
  if (!fs.existsSync(jsPath)) continue;

  const content = fs.readFileSync(dtsPath, "utf8");
  const { decls, imports, localTypes } = parseDts(content);

  let code = fs.readFileSync(jsPath, "utf8");
  const fromDir = path.dirname(rel);

  // 1. imports are NOT cleaned: tsc's emit already elides type-only imports
  //    and leftover value imports are real exports that esbuild resolves and
  //    tree-shakes. (Comment/string stripping is too fragile on regex-heavy
  //    code like this, so we leave imports exactly as tsc emitted them.)

  // 2. insert per-declaration JSDoc
  const typeBlocks = [];
  for (const d of decls) {
    if (d.kind === "type") {
      typeBlocks.push(renderTypeBlock(d.name, d.expr).join("\n"));
      allTypeNames.push(d.name);
      if (!typeDefinedIn.has(d.name)) typeDefinedIn.set(d.name, rel);
    } else if (d.kind === "interface") {
      typeBlocks.push(renderInterfaceBlock(d.name, d.body).join("\n"));
      allTypeNames.push(d.name);
      if (!typeDefinedIn.has(d.name)) typeDefinedIn.set(d.name, rel);
    } else if (d.kind === "function") {
      const block = renderFnBlock(d.name, d.sig, d.ret);
      if (!block.length) continue;
      const re = new RegExp(`(export\\s+(?:async\\s+)?function\\s+${escapeRegExp(d.name)}\\b)`);
      if (re.test(code)) {
        code = code.replace(re, `${block.join("\n")}\nexport function ${d.name}`);
      }
    } else if (d.kind === "class") {
      const lines = [`/**`, ` * @class ${d.name}`];
      const params = paramsToJsdoc(d.ctorSig);
      if (params.length) {
        lines.push(` * @constructor`);
        lines.push(...params);
      }
      lines.push(` */`);
      const re = new RegExp(`(export\\s+class\\s+${escapeRegExp(d.name)}\\b)`);
      if (re.test(code)) {
        code = code.replace(re, `${lines.join("\n")}\nexport class ${d.name}`);
      }
    } else if (d.kind === "const") {
      const block = renderConstBlock(d.type);
      const re = new RegExp(`(export\\s+const\\s+${escapeRegExp(d.name)}\\b)`);
      if (re.test(code)) {
        code = code.replace(re, `${block.join("\n")}\nexport const ${d.name}`);
      }
    }
  }

  // 2b. local (non-exported) types get typedefs too
  for (const name of localTypes) {
    // only add a placeholder typedef if the name isn't already declared
    const re = new RegExp(`@typedef[^\\n]*\\b${escapeRegExp(name)}\\b`);
    if (!re.test(code)) {
      typeBlocks.push(`/**\n * @typedef {Object} ${name}\n */`);
    }
  }

  // 3. append typedef blocks for exported types
  if (typeBlocks.length) {
    code += `\n${typeBlocks.join("\n\n")}\n`;
  }

  // 4. typedef re-exports for every imported type name
  const typedefLines = [];
  for (const imp of imports) {
    let from = imp.from;
    if (from.startsWith(".")) {
      from = path.posix.normalize(path.posix.join(fromDir, imp.from));
      if (from === "." || from === "") from = "./index";
      else if (from === "..") from = "../index";
      else if (!from.startsWith(".")) from = "./" + from;
      if (!from.endsWith(".js")) from += ".js";
    }
    typedefLines.push(` * @typedef {import("${from}").${imp.name}} ${imp.name}`);
    if (!seenTypedefs.has(imp.name)) {
      seenTypedefs.add(imp.name);
      allTypeNames.push(imp.name);
    }
  }
  if (typedefLines.length) {
    code += `\n/**\n${typedefLines.join("\n")}\n */\n`;
  }

  fs.writeFileSync(targetJs, code);
  console.log("converted", rel);
}

// 5. index.js: re-export typedefs for every exported type
const indexJs = path.join(srcDir, "index.js");
if (fs.existsSync(indexJs)) {
  let code = fs.readFileSync(indexJs, "utf8");
  const lines = [
    `/**`,
    ` * Re-exported types (JSDoc).`,
    ` * Use as: @param {import("@fortune-sheet/core").Context} ctx`,
  ];
  const seen = new Set();
  const sorted = [...typeDefinedIn.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [name, mod] of sorted) {
    if (seen.has(name)) continue;
    seen.add(name);
    const target = "./" + mod.replace(/\.d\.ts$/, ".js");
    lines.push(` * @typedef {import("${target}").${name}} ${name}`);
  }
  lines.push(` */`);
  code += `\n${lines.join("\n")}\n`;
  fs.writeFileSync(indexJs, code);
}

console.log("done. type names:", new Set(allTypeNames).size);
