import cloneDeep from 'lodash.clonedeep';
import maxBy from 'lodash.maxby';
import { v4 as uuidv4 } from 'uuid';
import { dataToCelldata, getSheet } from './common.js';
import { getSheetIndex } from './../utils/index.js';
import {
  api,
  execfunction,
  insertUpdateFunctionGroup,
  locale,
} from '../index.js';
/**
 * @param {Context} ctx
 * @returns {Array<Sheet>}
 */
export function getAllSheets(ctx) {
  return ctx.luckysheetfile;
}
export { getSheet };
/**
 * @param {Context} draftCtx
 * @param {number} index
 * @param {Sheet} newData
 * @returns {CellMatrix | null}
 */
export function initSheetData(draftCtx, index, newData) {
  const { celldata, row, column } = newData;
  const lastRow = maxBy(celldata, 'r');
  const lastCol = maxBy(celldata, 'c');
  let lastRowNum = (lastRow?.r ?? 0) + 1;
  let lastColNum = (lastCol?.c ?? 0) + 1;
  if (row != null && column != null && row > 0 && column > 0) {
    lastRowNum = Math.max(lastRowNum, row);
    lastColNum = Math.max(lastColNum, column);
  } else {
    lastRowNum = Math.max(lastRowNum, draftCtx.defaultrowNum);
    lastColNum = Math.max(lastColNum, draftCtx.defaultcolumnNum);
  }
  if (lastRowNum && lastColNum) {
    const expandedData = Array.from({ length: lastRowNum }, () =>
      Array.from({ length: lastColNum }, () => null)
    );
    celldata?.forEach((d) => {
      expandedData[d.r][d.c] = d.v;
    });
    if (draftCtx.luckysheetfile[index] == null) {
      newData.data = expandedData;
      delete newData.celldata;
      draftCtx.luckysheetfile.push(newData);
    } else {
      draftCtx.luckysheetfile[index].data = expandedData;
      delete draftCtx.luckysheetfile[index].celldata;
    }
    return expandedData;
  }
  return null;
}
/**
 * @param {Context} ctx
 * @param {string} sheetId
 */
export function hideSheet(ctx, sheetId) {
  const index = getSheetIndex(ctx, sheetId);
  ctx.luckysheetfile[index].hide = 1;
  ctx.luckysheetfile[index].status = 0;
  const shownSheets = ctx.luckysheetfile.filter(
    (sheet) => sheet.hide === undefined || sheet?.hide !== 1
  );
  ctx.currentSheetId = shownSheets[0].id;
}
/**
 * @param {Context} ctx
 * @param {string} sheetId
 */
export function showSheet(ctx, sheetId) {
  const index = getSheetIndex(ctx, sheetId);
  ctx.luckysheetfile[index].hide = undefined;
}
function generateCopySheetName(ctx, sheetId) {
  const { info } = locale(ctx);
  const copyWord = `(${info.copy}`;
  const SheetIndex = getSheetIndex(ctx, sheetId);
  let sheetName = ctx.luckysheetfile[SheetIndex].name;
  const copy_i = sheetName.indexOf(copyWord);
  let index = 0;
  if (copy_i !== -1) {
    sheetName = sheetName.toString().substring(0, copy_i);
  }
  const nameCopy = sheetName + copyWord;
  const sheetNames = [];
  for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
    const fileName = ctx.luckysheetfile[i].name;
    sheetNames.push(fileName);
    const st_i = fileName.indexOf(nameCopy);
    if (st_i === 0) {
      index = index || 2;
      const ed_i = fileName.indexOf(')', st_i + nameCopy.length);
      const num = fileName.substring(st_i + nameCopy.length, ed_i);
      if (typeof num === 'number') {
        if (Number.parseInt(num, 10) >= index) {
          index = Number.parseInt(num, 10) + 1;
        }
      }
    }
  }
  let sheetCopyName;
  do {
    const postfix = `${copyWord + (index || '')})`;
    const lengthLimit = 31 - postfix.length;
    sheetCopyName = sheetName;
    if (sheetCopyName.length > lengthLimit) {
      sheetCopyName = `${sheetCopyName.slice(0, lengthLimit - 1)}…`;
    }
    sheetCopyName += postfix;
    index = (index || 1) + 1;
  } while (sheetNames.indexOf(sheetCopyName) !== -1);
  return sheetCopyName;
}
/**
 * @param {Context} ctx
 * @param {string} sheetId
 */
export function copySheet(ctx, sheetId) {
  const index = getSheetIndex(ctx, sheetId);
  const order = ctx.luckysheetfile[index].order + 1;
  const sheetName = generateCopySheetName(ctx, sheetId);
  const sheetData = cloneDeep(ctx.luckysheetfile[index]);
  delete sheetData.id;
  delete sheetData.status;
  sheetData.celldata = dataToCelldata(sheetData.data);
  delete sheetData.data;
  api.addSheet(
    ctx,
    undefined,
    uuidv4(),
    ctx.luckysheetfile[index].isPivotTable,
    sheetName,
    sheetData
  );
  const sheetOrderList = {};
  sheetOrderList[ctx.luckysheetfile[ctx.luckysheetfile.length - 1].id] = order;
  api.setSheetOrder(ctx, sheetOrderList);
}
function calculateSheetFromula(ctx, id, range) {
  const index = getSheetIndex(ctx, id);
  if (!ctx.luckysheetfile[index].data) return;
  if (!range) {
    range = {
      row: [0, ctx.luckysheetfile[index].data.length - 1],
      column: [0, ctx.luckysheetfile[index].data[0].length - 1],
    };
  }
  const rowCount = range.row[1] - range.row[0] + 1;
  const columnCount = range.column[1] - range.column[0] + 1;
  for (let _r = 0; _r < rowCount; _r += 1) {
    for (let _c = 0; _c < columnCount; _c += 1) {
      const r = range.row[0] + _r;
      const c = range.column[0] + _c;
      if (!ctx.luckysheetfile[index].data[r][c]?.f) {
        continue;
      }
      const result = execfunction(
        ctx,
        ctx.luckysheetfile[index].data[r][c]?.f,
        r,
        c,
        id
      );
      api.setCellValue(ctx, r, c, result[1], null);
      insertUpdateFunctionGroup(ctx, r, c, id);
    }
  }
}
/**
 * @param {Context} ctx
 * @param {string} [id]
 * @param {SingleRange} [range]
 */
export function calculateFormula(ctx, id, range) {
  if (id) {
    calculateSheetFromula(ctx, id, range);
    return;
  }
  ctx.luckysheetfile.forEach((sheet_obj) => {
    calculateSheetFromula(ctx, sheet_obj.id, range);
  });
}

/**
 * @typedef {import("./api/common.js").getSheet} getSheet
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").Sheet} Sheet
 * @typedef {import("./types.js").SingleRange} SingleRange
 */
