import _ from "lodash";
import { deleteRowCol, insertRowCol } from "../modules";
import { getSheet } from "./common";
import { INVALID_PARAMS } from "./errors";
import { getSheetIndex } from "../utils";
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
        row: "rangeRow",
        column: "rangeColumn",
        both: "rangeBoth",
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
export function insertRowOrColumn(ctx, type, index, count, direction, options = {}) {
    if (!["row", "column"].includes(type) ||
        !_.isNumber(index) ||
        !_.isNumber(count) ||
        !["lefttop", "rightbottom"].includes(direction)) {
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
    }
    catch (e) {
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
    if (!["row", "column"].includes(type) ||
        !_.isNumber(start) ||
        !_.isNumber(end)) {
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
    var _a, _b;
    if (!["row", "column"].includes(type)) {
        throw INVALID_PARAMS;
    }
    if (!ctx || !ctx.config)
        return;
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    if (type === "row") {
        const rowhidden = (_a = ctx.config.rowhidden) !== null && _a !== void 0 ? _a : {};
        rowColInfo.forEach((r) => {
            rowhidden[r] = 0;
        });
        ctx.config.rowhidden = rowhidden;
    }
    else if (type === "column") {
        const colhidden = (_b = ctx.config.colhidden) !== null && _b !== void 0 ? _b : {};
        rowColInfo.forEach((r) => {
            colhidden[r] = 0;
        });
        ctx.config.colhidden = colhidden;
    }
    ctx.luckysheetfile[index].config = ctx.config;
}
/**
 * @param {Context} ctx
 * @param {Array<string>} rowColInfo
 * @param {"row" | "column"} type
 */
export function showRowOrColumn(ctx, rowColInfo, type) {
    var _a, _b;
    if (!["row", "column"].includes(type)) {
        throw INVALID_PARAMS;
    }
    if (!ctx || !ctx.config)
        return;
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    if (type === "row") {
        const rowhidden = (_a = ctx.config.rowhidden) !== null && _a !== void 0 ? _a : {};
        rowColInfo.forEach((r) => {
            delete rowhidden[r];
        });
        ctx.config.rowhidden = rowhidden;
    }
    else if (type === "column") {
        const colhidden = (_b = ctx.config.colhidden) !== null && _b !== void 0 ? _b : {};
        rowColInfo.forEach((r) => {
            delete colhidden[r];
        });
        ctx.config.colhidden = colhidden;
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
                }
                else if (custom) {
                    cfg.customHeight[r] = 1;
                }
            }
        }
    });
    sheet.config = cfg;
    if (ctx.currentSheetId === sheet.id) {
        ctx.config = cfg;
    }
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
                }
                else if (custom) {
                    cfg.customWidth[c] = 1;
                }
            }
        }
    });
    sheet.config = cfg;
    if (ctx.currentSheetId === sheet.id) {
        ctx.config = cfg;
    }
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
