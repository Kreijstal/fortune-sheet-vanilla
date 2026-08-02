import _ from 'lodash-es';
import {
  delFunctionGroup,
  dropCellCache,
  functionHTMLGenerate,
  getTypeItemHide,
  setCellValue as setCellValueInternal,
  updateCell,
  updateDropCell,
  updateFormatCell,
} from './../modules/index.js';
import { getSheet } from './common.js';
import { SHEET_NOT_FOUND } from './errors.js';
import SSF from './../modules/ssf.js';
/**
 * @param {Context} ctx
 * @param {number} row
 * @param {number} column
 * @param {CommonOptions & {
    type?: keyof Cell;
}} [options]
 * @returns {any}
 */
export function getCellValue(ctx, row, column, options = {}) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error('row or column cannot be null or undefined');
  }
  const sheet = getSheet(ctx, options);
  const { type = 'v' } = options;
  const targetSheetData = sheet.data;
  if (!targetSheetData) {
    throw SHEET_NOT_FOUND;
  }
  const cellData = targetSheetData[row][column];
  let ret;
  if (cellData && _.isPlainObject(cellData)) {
    ret = cellData[type];
    if (type === 'f' && ret != null) {
      ret = functionHTMLGenerate(ret);
    } else if (type === 'f') {
      ret = cellData.v;
    } else if (cellData && cellData.ct && cellData.ct.fa === 'yyyy-MM-dd') {
      ret = cellData.m;
    } else if (cellData.ct?.t === 'inlineStr') {
      ret = cellData.ct.s.reduce((prev, cur) => prev + (cur.v ?? ''), '');
    }
  }
  if (ret === undefined) {
    ret = null;
  }
  return ret;
}
/**
 * @param {Context} ctx
 * @param {number} row
 * @param {number} column
 * @param {any} value
 * @param {HTMLDivElement | null} cellInput
 * @param {CommonOptions} [options]
 */
export function setCellValue(ctx, row, column, value, cellInput, options = {}) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error('row or column cannot be null or undefined');
  }
  const sheet = getSheet(ctx, options);
  const { data } = sheet;
  // if (data.length === 0) {
  //   data = sheetmanage.buildGridData(file);
  // }
  // luckysheetformula.updatecell(row, column, value);
  const formatList = {
    // ct:1, //celltype,Cell value format: text, time, etc.
    bg: 1,
    ff: 1,
    fc: 1,
    bl: 1,
    it: 1,
    fs: 1,
    cl: 1,
    un: 1,
    vt: 1,
    ht: 1,
    mc: 1,
    tr: 1,
    tb: 1,
    // v: 1, //Original value
    // m: 1, //Display value
    rt: 1,
    // f: 1, //formula
    qp: 1, // quotePrefix, show number as string
  };
  if (value == null || value.toString().length === 0) {
    delFunctionGroup(ctx, row, column);
    setCellValueInternal(ctx, row, column, data, value);
  } else if (value instanceof Object) {
    const curv = {};
    if (data?.[row]?.[column] == null) {
      data[row][column] = {};
    }
    const cell = data[row][column];
    if (value.f != null && value.v == null) {
      curv.f = value.f;
      if (value.ct != null) {
        curv.ct = value.ct;
      }
      updateCell(ctx, row, column, cellInput, curv); // update formula value
    } else {
      if (value.ct != null) {
        curv.ct = value.ct;
      }
      if (value.f != null) {
        curv.f = value.f;
      }
      if (value.v != null) {
        curv.v = value.v;
      } else {
        curv.v = cell.v;
      }
      if (value.m != null) {
        curv.m = value.m;
      }
      delFunctionGroup(ctx, row, column);
      setCellValueInternal(ctx, row, column, data, curv); // update text value
    }
    _.forEach(value, (v, attr) => {
      if (attr in formatList) {
        updateFormatCell(ctx, data, attr, v, row, row, column, column); // change range format
      } else {
        cell[attr] = v;
      }
    });
    data[row][column] = cell;
  } else {
    if (
      value.toString().substr(0, 1) === '=' ||
      value.toString().substr(0, 5) === '<span'
    ) {
      updateCell(ctx, row, column, cellInput, value); // update formula value or convert inline string html to object
    } else {
      delFunctionGroup(ctx, row, column);
      setCellValueInternal(ctx, row, column, data, value);
    }
  }
}
/**
 * @param {Context} ctx
 * @param {number} row
 * @param {number} column
 * @param {CommonOptions} [options]
 */
export function clearCell(ctx, row, column, options = {}) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error('row or column cannot be null or undefined');
  }
  const sheet = getSheet(ctx, options);
  const cell = sheet.data?.[row]?.[column];
  if (cell && _.isPlainObject(cell)) {
    delete cell.m;
    delete cell.v;
    if (cell.f != null) {
      delete cell.f;
      delFunctionGroup(ctx, row, column, sheet.id);
      delete cell.spl;
    }
  }
}
/**
 * @param {Context} ctx
 * @param {number} row
 * @param {number} column
 * @param {keyof Cell} attr
 * @param {any} value
 * @param {CommonOptions} [options]
 */
export function setCellFormat(ctx, row, column, attr, value, options = {}) {
  if (!_.isNumber(row) || !_.isNumber(column)) {
    throw new Error('row or column cannot be null or undefined');
  }
  if (!attr) {
    throw new Error('attr cannot be null or undefined');
  }
  const sheet = getSheet(ctx, options);
  const targetSheetData = sheet.data;
  // if (targetSheetData.length === 0) {
  //   targetSheetData = sheetmanage.buildGridData(sheet);
  // }
  const cellData = targetSheetData?.[row]?.[column] || {};
  const cfg = sheet.config || {};
  // 特殊格式
  if (attr === 'ct' && (!value || value.fa == null || value.t == null)) {
    throw new Error(
      "'fa' and 't' should be present in value when attr is 'ct'"
    );
  } else if (attr === 'ct' && !_.isNil(cellData.v)) {
    cellData.m = SSF.format(value.fa, cellData.v); // auto generate mask
  }
  if (attr === 'bd') {
    if (cfg.borderInfo == null) {
      cfg.borderInfo = [];
    }
    const borderInfo = {
      rangeType: 'range',
      borderType: 'border-all',
      color: '#000',
      style: '1',
      range: [
        {
          column: [column, column],
          row: [row, row],
        },
      ],
      ...value,
    };
    cfg.borderInfo.push(borderInfo);
  } else {
    cellData[attr] = value;
  }
  targetSheetData[row][column] = cellData;
  sheet.config = cfg;
  ctx.config = cfg;
}
/**
 * @param {Context} ctx
 * @param {SingleRange} copyRange
 * @param {SingleRange} applyRange
 * @param {"up" | "down" | "left" | "right"} direction
 */
export function autoFillCell(ctx, copyRange, applyRange, direction) {
  dropCellCache.copyRange = copyRange;
  dropCellCache.applyRange = applyRange;
  dropCellCache.direction = direction;
  const typeItemHide = getTypeItemHide(ctx);
  if (
    !typeItemHide[0] &&
    !typeItemHide[1] &&
    !typeItemHide[2] &&
    !typeItemHide[3] &&
    !typeItemHide[4] &&
    !typeItemHide[5] &&
    !typeItemHide[6]
  ) {
    dropCellCache.applyType = '0';
  } else {
    dropCellCache.applyType = '1';
  }
  updateDropCell(ctx);
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").Cell} Cell
 * @typedef {import("./types.js").SingleRange} SingleRange
 * @typedef {import("./api/common.js").CommonOptions} CommonOptions
 */
