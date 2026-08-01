import _ from 'lodash';
import { getdatabyselection, getFlowdata, getRangetxt } from '..';
import { normalizeSelection, rangeValueToHtml } from '../modules';
import { setCellFormat, setCellValue } from './cell';
import { getSheet } from './common';
import { INVALID_PARAMS } from './errors';
/**
 * @param {Context} ctx
 * @returns {Array<{
    row: number[];
    column: number[];
}>}
 */
export function getSelection(ctx) {
  return ctx.luckysheet_select_save?.map((selection) => ({
    row: selection.row,
    column: selection.column,
  }));
}
/**
 * @param {Context} ctx
 * @param {Range} [range]
 * @returns {Array<{
    r: number;
    c: number;
}>}
 */
export function getFlattenRange(ctx, range) {
  range = range || getSelection(ctx);
  const result = [];
  range?.forEach((ele) => {
    const rs = ele.row;
    const cs = ele.column;
    for (let r = rs[0]; r <= rs[1]; r += 1) {
      for (let c = cs[0]; c <= cs[1]; c += 1) {
        result.push({ r, c });
      }
    }
  });
  return result;
}
/**
 * @param {Context} ctx
 * @param {Array<{
    r: number;
    c: number;
}>} [range]
 * @returns {Array<Cell>}
 */
export function getCellsByFlattenRange(ctx, range) {
  range = range || getFlattenRange(ctx);
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return [];
  return range.map((item) => flowdata[item.r]?.[item.c]);
}
/**
 * @param {Context} ctx
 * @returns {Array<string>}
 */
export function getSelectionCoordinates(ctx) {
  const result = [];
  const rangeArr = _.cloneDeep(ctx.luckysheet_select_save);
  const sheetId = ctx.currentSheetId;
  rangeArr?.forEach((ele) => {
    const rangeText = getRangetxt(ctx, sheetId, {
      column: ele.column,
      row: ele.row,
    });
    result.push(rangeText);
  });
  return result;
}
/**
 * @param {Context} ctx
 * @param {Selection} range
 * @param {CommonOptions} [options]
 * @returns {Array<any>}
 */
export function getCellsByRange(ctx, range, options = {}) {
  const sheet = getSheet(ctx, options);
  if (!range || typeof range === 'object') {
    return getdatabyselection(ctx, range, sheet.id);
  }
  throw INVALID_PARAMS;
}
/**
 * @param {Context} ctx
 * @param {Range} range
 * @param {CommonOptions} [options]
 * @returns {string}
 */
export function getHtmlByRange(ctx, range, options = {}) {
  const sheet = getSheet(ctx, options);
  return rangeValueToHtml(ctx, sheet.id, range);
}
/**
 * @param {Context} ctx
 * @param {Range} range
 * @param {CommonOptions} options
 */
export function setSelection(ctx, range, options) {
  const sheet = getSheet(ctx, options);
  sheet.luckysheet_select_save = normalizeSelection(ctx, range);
  if (ctx.currentSheetId === sheet.id) {
    ctx.luckysheet_select_save = sheet.luckysheet_select_save;
  }
}
/**
 * @param {Context} ctx
 * @param {Array<Array<any>>} data
 * @param {SingleRange} range
 * @param {HTMLDivElement | null} cellInput
 * @param {CommonOptions} [options]
 */
export function setCellValuesByRange(
  ctx,
  data,
  range,
  cellInput,
  options = {}
) {
  if (data == null) {
    throw INVALID_PARAMS;
  }
  if (range instanceof Array) {
    throw new Error('setCellValuesByRange does not support multiple ranges');
  }
  if (!_.isPlainObject(range)) {
    throw INVALID_PARAMS;
  }
  const rowCount = range.row[1] - range.row[0] + 1;
  const columnCount = range.column[1] - range.column[0] + 1;
  if (data.length !== rowCount || data[0].length !== columnCount) {
    throw new Error('data size does not match range');
  }
  for (let i = 0; i < rowCount; i += 1) {
    for (let j = 0; j < columnCount; j += 1) {
      const row = range.row[0] + i;
      const column = range.column[0] + j;
      setCellValue(ctx, row, column, data[i][j], cellInput, options);
    }
  }
}
/**
 * @param {Context} ctx
 * @param {keyof Cell} attr
 * @param {any} value
 * @param {Range | SingleRange} range
 * @param {CommonOptions} [options]
 */
export function setCellFormatByRange(ctx, attr, value, range, options = {}) {
  if (_.isPlainObject(range)) {
    range = [range];
  }
  if (!_.isArray(range)) {
    throw INVALID_PARAMS;
  }
  range.forEach((singleRange) => {
    for (let r = singleRange.row[0]; r <= singleRange.row[1]; r += 1) {
      for (let c = singleRange.column[0]; c <= singleRange.column[1]; c += 1) {
        setCellFormat(ctx, r, c, attr, value, options);
      }
    }
  });
}

/**
 * @typedef {import("./index.js").Selection} Selection
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").Cell} Cell
 * @typedef {import("./types.js").Range} Range
 * @typedef {import("./types.js").SingleRange} SingleRange
 * @typedef {import("./api/common.js").CommonOptions} CommonOptions
 */
