import _ from 'lodash';
import { deleteRowCol, insertRowCol } from '../modules';
import { getSheet } from './common';
import { INVALID_PARAMS } from './errors';
import { getSheetIndex } from '../utils';
/**
 * @param {Context} ctx
 * @param {"row" | "column" | "both"} type
 * @param {{
    row: number;
    column: number;
}} range
 * @param {CommonOptions} [options]
 */
export function freeze(ctx, type, range, options = {}) {
  const sheet = getSheet(ctx, options);
  const typeMap = {
    row: 'rangeRow',
    column: 'rangeColumn',
    both: 'rangeBoth',
  };
  const innerType = typeMap[type];
  sheet.frozen = {
    type: innerType,
    range: {
      column_focus: range.column,
      row_focus: range.row,
    },
  };
}
/**
 * @param {Context} ctx
 * @param {"row" | "column"} type
 * @param {number} index
 * @param {number} count
 * @param {"lefttop" | "rightbottom"} direction
 * @param {CommonOptions} [options]
 */
export function insertRowOrColumn(
  ctx,
  type,
  index,
  count,
  direction,
  options = {}
) {
  if (
    !['row', 'column'].includes(type) ||
    !_.isNumber(index) ||
    !_.isNumber(count) ||
    !['lefttop', 'rightbottom'].includes(direction)
  ) {
    throw INVALID_PARAMS;
  }
  const sheet = getSheet(ctx, options);
  try {
    insertRowCol(ctx, {
      type,
      index,
      count,
      direction,
      id: sheet.id,
    });
  } catch (e) {
    console.error(e);
  }
}
/**
 * @param {Context} ctx
 * @param {"row" | "column"} type
 * @param {number} start
 * @param {number} end
 * @param {CommonOptions} [options]
 */
export function deleteRowOrColumn(ctx, type, start, end, options = {}) {
  if (
    !['row', 'column'].includes(type) ||
    !_.isNumber(start) ||
    !_.isNumber(end)
  ) {
    throw INVALID_PARAMS;
  }
  const sheet = getSheet(ctx, options);
  deleteRowCol(ctx, { type, start, end, id: sheet.id });
}
/**
 * @param {Context} ctx
 * @param {Array<string>} rowColInfo
 * @param {"row" | "column"} type
 */
export function hideRowOrColumn(ctx, rowColInfo, type) {
  if (!['row', 'column'].includes(type)) {
    throw INVALID_PARAMS;
  }
  if (!ctx || !ctx.config) return;
  const index = getSheetIndex(ctx, ctx.currentSheetId);
  if (type === 'row') {
    /* TODO: 工作表保护判断
        if (
          !checkProtectionAuthorityNormal(Store.currentSheetIndex, "formatRows")
        ) {
          return ;
        } */
    const rowhidden = ctx.config.rowhidden ?? {};
    rowColInfo.forEach((r) => {
      rowhidden[r] = 0;
    });
    /* 保存撤销,luck中保存撤销用以下方式实现，而在本项目中不需要另外处理
          if(Store.clearjfundo){
            let redo = {};
            redo["type"] = "showHidRows";
            redo["sheetIndex"] = Store.currentSheetIndex;
            redo["config"] = $.extend(true, {}, Store.config);
            redo["curconfig"] = cfg;
    
            Store.jfundo.length  = 0;
            Store.jfredo.push(redo);
        } */
    ctx.config.rowhidden = rowhidden;
    // const rowLen = ctx.luckysheetfile[index].data!.length;
    /**
     * 计算要隐藏的行是否是最后一列
     * 符合最后一列的条件：要隐藏的index===表格的长度-1 或者
     * 记录隐藏数组里面的数-1===要隐藏的index
     */
  } else if (type === 'column') {
    // 隐藏列
    const colhidden = ctx.config.colhidden ?? {};
    rowColInfo.forEach((r) => {
      colhidden[r] = 0;
    });
    ctx.config.colhidden = colhidden;
    // const columnLen = ctx.luckysheetfile[index].data![0].length;
  }
  ctx.luckysheetfile[index].config = ctx.config;
}
/**
 * @param {Context} ctx
 * @param {Array<string>} rowColInfo
 * @param {"row" | "column"} type
 */
export function showRowOrColumn(ctx, rowColInfo, type) {
  if (!['row', 'column'].includes(type)) {
    throw INVALID_PARAMS;
  }
  if (!ctx || !ctx.config) return;
  const index = getSheetIndex(ctx, ctx.currentSheetId);
  if (type === 'row') {
    /* TODO: 工作表保护判断
        if (
          !checkProtectionAuthorityNormal(Store.currentSheetIndex, "formatRows")
        ) {
          return ;
        } */
    const rowhidden = ctx.config.rowhidden ?? {};
    rowColInfo.forEach((r) => {
      delete rowhidden[r];
    });
    /* 保存撤销,luck中保存撤销用以下方式实现，而在本项目中不需要另外处理
          if(Store.clearjfundo){
            let redo = {};
            redo["type"] = "showHidRows";
            redo["sheetIndex"] = Store.currentSheetIndex;
            redo["config"] = $.extend(true, {}, Store.config);
            redo["curconfig"] = cfg;
    
            Store.jfundo.length  = 0;
            Store.jfredo.push(redo);
        } */
    ctx.config.rowhidden = rowhidden;
    // const rowLen = ctx.luckysheetfile[index].data!.length;
    /**
     * 计算要隐藏的行是否是最后一列
     * 符合最后一列的条件：要隐藏的index===表格的长度-1 或者
     * 记录隐藏数组里面的数-1===要隐藏的index
     */
  } else if (type === 'column') {
    // 隐藏列
    const colhidden = ctx.config.colhidden ?? {};
    rowColInfo.forEach((r) => {
      delete colhidden[r];
    });
    ctx.config.colhidden = colhidden;
    // const columnLen = ctx.luckysheetfile[index].data![0].length;
  }
  ctx.luckysheetfile[index].config = ctx.config;
}
/**
 * @param {Context} ctx
 * @param {Record<string, number>} rowInfo
 * @param {CommonOptions} [options]
 * @param {boolean} [custom]
 */
export function setRowHeight(ctx, rowInfo, options = {}, custom = false) {
  if (!_.isPlainObject(rowInfo)) {
    throw INVALID_PARAMS;
  }
  const sheet = getSheet(ctx, options);
  const cfg = sheet.config || {};
  if (cfg.rowlen == null) {
    cfg.rowlen = {};
  }
  _.forEach(rowInfo, (len, r) => {
    if (Number(r) >= 0) {
      if (Number(len) >= 0) {
        cfg.rowlen[Number(r)] = Number(len);
        if (custom && _.isUndefined(cfg.customHeight)) {
          cfg.customHeight = { [r]: 1 };
        } else if (custom) {
          cfg.customHeight[r] = 1;
        }
      }
    }
  });
  sheet.config = cfg;
  if (ctx.currentSheetId === sheet.id) {
    ctx.config = cfg;
  }
  // server.saveParam("cg", file.id, cfg.rowlen, { k: "rowlen" });
}
/**
 * @param {Context} ctx
 * @param {Record<string, number>} columnInfo
 * @param {CommonOptions} [options]
 * @param {boolean} [custom]
 */
export function setColumnWidth(ctx, columnInfo, options = {}, custom = false) {
  if (!_.isPlainObject(columnInfo)) {
    throw INVALID_PARAMS;
  }
  const sheet = getSheet(ctx, options);
  const cfg = sheet.config || {};
  if (cfg.columnlen == null) {
    cfg.columnlen = {};
  }
  _.forEach(columnInfo, (len, c) => {
    if (Number(c) >= 0) {
      if (Number(len) >= 0) {
        cfg.columnlen[Number(c)] = Number(len);
        if (custom && _.isUndefined(cfg.customWidth)) {
          cfg.customWidth = { [c]: 1 };
        } else if (custom) {
          cfg.customWidth[c] = 1;
        }
      }
    }
  });
  sheet.config = cfg;
  if (ctx.currentSheetId === sheet.id) {
    ctx.config = cfg;
  }
  // server.saveParam("cg", file.id, cfg.columnlen, { k: "columnlen" });
}
/**
 * @param {Context} ctx
 * @param {Array<number>} rows
 * @param {CommonOptions} [options]
 * @returns {Record<number, number>}
 */
export function getRowHeight(ctx, rows, options = {}) {
  if (!_.isArray(rows) || rows.length === 0) {
    throw INVALID_PARAMS;
  }
  const sheet = getSheet(ctx, options);
  const cfg = sheet.config || {};
  const rowlen = cfg.rowlen || {};
  const rowlenObj = {};
  rows.forEach((item) => {
    if (Number(item) >= 0) {
      const size = rowlen[Number(item)] || ctx.defaultrowlen;
      rowlenObj[Number(item)] = size;
    }
  });
  return rowlenObj;
}
/**
 * @param {Context} ctx
 * @param {Array<number>} columns
 * @param {CommonOptions} [options]
 * @returns {Record<number, number>}
 */
export function getColumnWidth(ctx, columns, options = {}) {
  if (!_.isArray(columns) || columns.length === 0) {
    throw INVALID_PARAMS;
  }
  const sheet = getSheet(ctx, options);
  const cfg = sheet.config || {};
  const columnlen = cfg.columnlen || {};
  const columnlenObj = {};
  columns.forEach((item) => {
    if (Number(item) >= 0) {
      const size = columnlen[Number(item)] || ctx.defaultcollen;
      columnlenObj[Number(item)] = size;
    }
  });
  return columnlenObj;
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./api/common.js").CommonOptions} CommonOptions
 */
