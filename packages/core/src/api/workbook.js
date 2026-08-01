import _ from 'lodash';
import {
  addSheet as addSheetInternal,
  deleteSheet as deleteSheetInternal,
  updateSheet as updateSheetInternal,
} from '../modules';
import { getSheet } from './common';
import { INVALID_PARAMS } from './errors';
/**
 * @param {Context} ctx
 * @param {Required<Settings>} [settings]
 * @param {string} [newSheetID]
 * @param {boolean} [isPivotTable]
 * @param {string | undefined} [sheetname]
 * @param {Sheet | undefined} [sheetData]
 */
export function addSheet(
  ctx,
  settings,
  newSheetID,
  isPivotTable = false,
  sheetname = undefined,
  sheetData = undefined
) {
  addSheetInternal(
    ctx,
    settings,
    newSheetID,
    isPivotTable,
    sheetname,
    sheetData
  );
}
/**
 * @param {Context} ctx
 * @param {CommonOptions} [options]
 */
export function deleteSheet(ctx, options = {}) {
  const sheet = getSheet(ctx, options);
  deleteSheetInternal(ctx, sheet.id);
}
/**
 * @param {Context} ctx
 * @param {Array<Sheet>} data
 */
export function updateSheet(ctx, data) {
  updateSheetInternal(ctx, data);
}
/**
 * @param {Context} ctx
 * @param {CommonOptions} [options]
 */
export function activateSheet(ctx, options = {}) {
  const sheet = getSheet(ctx, options);
  ctx.currentSheetId = sheet.id;
}
/**
 * @param {Context} ctx
 * @param {string} name
 * @param {CommonOptions} [options]
 */
export function setSheetName(ctx, name, options = {}) {
  const sheet = getSheet(ctx, options);
  sheet.name = name;
}
/**
 * @param {Context} ctx
 * @param {Record<string, number>} orderList
 */
export function setSheetOrder(ctx, orderList) {
  ctx.luckysheetfile?.forEach((sheet) => {
    if (sheet.id in orderList) {
      sheet.order = orderList[sheet.id];
    }
  });
  // re-order starting from 0
  _.sortBy(ctx.luckysheetfile, ['order']).forEach((sheet, i) => {
    sheet.order = i;
  });
}
/**
 * @param {Context} ctx
 * @param {HTMLDivElement | null} scrollbarX
 * @param {HTMLDivElement | null} scrollbarY
 * @param {{
    scrollLeft?: number;
    scrollTop?: number;
    targetRow?: number;
    targetColumn?: number;
}} options
 */
export function scroll(ctx, scrollbarX, scrollbarY, options) {
  if (options.scrollLeft != null) {
    if (!_.isNumber(options.scrollLeft)) {
      throw INVALID_PARAMS;
    }
    if (scrollbarX) {
      scrollbarX.scrollLeft = options.scrollLeft;
    }
  } else if (options.targetColumn != null) {
    if (!_.isNumber(options.targetColumn)) {
      throw INVALID_PARAMS;
    }
    const col_pre =
      options.targetColumn <= 0
        ? 0
        : ctx.visibledatacolumn[options.targetColumn - 1];
    if (scrollbarX) {
      scrollbarX.scrollLeft = col_pre;
    }
  }
  if (options.scrollTop != null) {
    if (!_.isNumber(options.scrollTop)) {
      throw INVALID_PARAMS;
    }
    if (scrollbarY) {
      scrollbarY.scrollTop = options.scrollTop;
    }
  } else if (options.targetRow != null) {
    if (!_.isNumber(options.targetRow)) {
      throw INVALID_PARAMS;
    }
    const row_pre =
      options.targetRow <= 0 ? 0 : ctx.visibledatarow[options.targetRow - 1];
    if (scrollbarY) {
      scrollbarY.scrollTop = row_pre;
    }
  }
}

/**
 * @typedef {import("./index.js").Context} Context
 * @typedef {import("./index.js").Sheet} Sheet
 * @typedef {import("./settings.js").Settings} Settings
 * @typedef {import("./api/common.js").CommonOptions} CommonOptions
 */
