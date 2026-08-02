import maxBy from 'lodash.maxby';
import { getSheetIndex } from './../utils/index.js';
import { SHEET_NOT_FOUND } from './errors.js';
/**
 * @type {Array<function(CellMatrix | undefined) => CellWithRowAndCol[];
export declare const celldataToData: (celldata: CellWithRowAndCol[], rowCount?: number, colCount?: number): CellMatrix;
export declare function getSheet(ctx: Context, options?: CommonOptions): Sheet;
export declare function getSheetWithLatestCelldata(ctx: Context, options?: CommonOptions): {
    celldata: CellWithRowAndCol[];
    name: string;
    config?: import("../types").SheetConfig;
    order?: number;
    color?: string;
    data?: CellMatrix;
    id?: string;
    images?: import("../types").Image[];
    zoomRatio?: number;
    column?: number;
    row?: number;
    addRows?: number;
    status?: number;
    hide?: number;
    luckysheet_select_save?: import("../types").Selection[];
    luckysheet_selection_range?: {
        row: number>}
 */
export const dataToCelldata = (data) => {
  const celldata = [];
  if (data == null) {
    return celldata;
  }
  for (let r = 0; r < data.length; r += 1) {
    for (let c = 0; c < data[r].length; c += 1) {
      const v = data[r][c];
      if (v != null) {
        celldata.push({ r, c, v });
      }
    }
  }
  return celldata;
};
/**
 * @type {Array<function(Array<CellWithRowAndCol>, number, number): CellMatrix;
export declare function getSheet(ctx: Context, options?: CommonOptions): Sheet;
export declare function getSheetWithLatestCelldata(ctx: Context, options?: CommonOptions): {
    celldata: CellWithRowAndCol>}
 */
export const celldataToData = (celldata, rowCount, colCount) => {
  const lastRow = maxBy(celldata, 'r');
  const lastCol = maxBy(celldata, 'c');
  let lastRowNum = (lastRow?.r ?? 0) + 1;
  let lastColNum = (lastCol?.c ?? 0) + 1;
  if (rowCount != null && colCount != null && rowCount > 0 && colCount > 0) {
    lastRowNum = Math.max(lastRowNum, rowCount);
    lastColNum = Math.max(lastColNum, colCount);
  }
  if (lastRowNum && lastColNum) {
    const expandedData = Array.from({ length: lastRowNum }, () =>
      Array.from({ length: lastColNum }, () => null)
    );
    celldata?.forEach((d) => {
      expandedData[d.r][d.c] = d.v;
    });
    return expandedData;
  }
  return null;
};
/**
 * @param {Context} ctx
 * @param {CommonOptions} [options]
 * @returns {Sheet}
 */
export function getSheet(ctx, options = {}) {
  const { index = getSheetIndex(ctx, options.id || ctx.currentSheetId) } =
    options;
  if (index == null) {
    throw SHEET_NOT_FOUND;
  }
  const sheet = ctx.luckysheetfile[index];
  if (sheet == null) {
    throw SHEET_NOT_FOUND;
  }
  return sheet;
}
/**
 * @param {Context} ctx
 * @param {CommonOptions} [options]
 * @returns {{
    celldata: CellWithRowAndCol[];
    name: string;
    config?: import("../types").SheetConfig;
    order?: number;
    color?: string;
    data?: CellMatrix;
    id?: string;
    images?: import("../types").Image[];
    zoomRatio?: number;
    column?: number;
    row?: number;
    addRows?: number;
    status?: number;
    hide?: number;
    luckysheet_select_save?: import("../types").Selection[];
    luckysheet_selection_range?: {
        row: number[];
        column: number[];
    }[];
    calcChain?: any[];
    defaultRowHeight?: number;
    defaultColWidth?: number;
    showGridLines?: number | boolean;
    pivotTable?: any;
    isPivotTable?: boolean;
    filter?: Record<string, any>;
    filter_select?: {
        row: number[];
        column: number[];
    };
    luckysheet_conditionformat_save?: any[];
    luckysheet_alternateformat_save?: any[];
    dataVerification?: any;
    hyperlink?: Record<string, {
        linkType: string;
        linkAddress: string;
    }>;
    dynamicArray_compute?: any;
    dynamicArray?: any[];
    frozen?: {
        type: "row" | "column" | "both" | "rangeRow" | "rangeColumn" | "rangeBoth";
        range?: {
            row_focus: number;
            column_focus: number;
        };
    };
}}
 */
export function getSheetWithLatestCelldata(ctx, options = {}) {
  const sheet = getSheet(ctx, options);
  return { ...sheet, celldata: dataToCelldata(sheet.data) };
}

/**
 * @typedef {Object} CommonOptions
 * @property {number} [index]
 * @property {string} [id]
 */

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").CellWithRowAndCol} CellWithRowAndCol
 * @typedef {import("./types.js").Sheet} Sheet
 */
