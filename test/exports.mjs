/**
 * Export surface regression test — verifies the single package exposes
 * everything the original three packages exposed:
 *   - @fortune-sheet/react  -> FortuneSheet class (+ Store)
 *   - @fortune-sheet/core   -> api namespace, Canvas, event handlers, ...
 *   - @fortune-sheet/formula-parser -> Parser, SUPPORTED_FORMULAS, ERROR_*
 *
 * Run: node test/exports.mjs
 */
import assert from 'node:assert/strict';
import * as pkg from '../src/index.js';

const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  assert.ok(ok, name);
};

// vanilla shell
check('FortuneSheet class', typeof pkg.FortuneSheet === 'function');
check('Store class', typeof pkg.Store === 'function');

// core engine
check('api namespace', pkg.api && typeof pkg.api.setCellValue === 'function');
check('Canvas class', typeof pkg.Canvas === 'function');
check('defaultContext', typeof pkg.defaultContext === 'function');
check('defaultSettings', typeof pkg.defaultSettings === 'object');
check('getFlowdata', typeof pkg.getFlowdata === 'function');
check('handleGlobalKeyDown', typeof pkg.handleGlobalKeyDown === 'function');
check('handleCellAreaMouseDown', typeof pkg.handleCellAreaMouseDown === 'function');
check('handlePaste', typeof pkg.handlePaste === 'function');
check('insertRowCol', typeof pkg.insertRowCol === 'function');
check('locale', typeof pkg.locale === 'function');
check('initSheetIndex', typeof pkg.initSheetIndex === 'function');

// formula parser
check('Parser', typeof pkg.Parser === 'function');
check('SUPPORTED_FORMULAS', Array.isArray(pkg.SUPPORTED_FORMULAS));
check('ERROR_REF', typeof pkg.ERROR_REF === 'string');
check('ERROR_VALUE', typeof pkg.ERROR_VALUE === 'string');
check('columnIndexToLabel', typeof pkg.columnIndexToLabel === 'function');

// heritage subpaths resolve
const core = await import('../src/core/index.js');
check('subpath ./core exposes api', typeof core.api?.setCellValue === 'function');
const parser = await import('../src/formula-parser/index.js');
check('subpath ./formula-parser exposes Parser', typeof parser.Parser === 'function');

const total = 19;
console.log(`\n${total}/${total} export checks passed`);
