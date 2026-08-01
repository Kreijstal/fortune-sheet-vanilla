import _ from "lodash";
import { colLocationByIndex, getSheetIndex, rowLocationByIndex, } from "..";
function cutVolumn(arr, cutindex) {
    if (cutindex <= 0) {
        return arr;
    }
    const ret = arr.slice(cutindex);
    return ret;
}
function frozenTofreezen(ctx, cache, sheetId) {
    const file = ctx.luckysheetfile[getSheetIndex(ctx, sheetId)];
    const { frozen } = file;
    if (frozen == null) {
        delete cache.freezen;
        return;
    }
    const freezen = {};
    let { range } = frozen;
    if (!range) {
        range = {
            row_focus: 0,
            column_focus: 0,
        };
    }
    let { type } = frozen;
    if (type === "row") {
        type = "rangeRow";
    }
    else if (type === "column") {
        type = "rangeColumn";
    }
    else if (type === "both") {
        type = "rangeBoth";
    }
    if (type === "rangeRow" || type === "rangeBoth") {
        const scrollTop = 0;
        let row_st = _.sortedIndex(ctx.visibledatarow, scrollTop);
        const { row_focus } = range;
        if (row_focus > row_st) {
            row_st = row_focus;
        }
        if (row_st === -1) {
            row_st = 0;
        }
        const top = ctx.visibledatarow[row_st] - 2 - scrollTop + ctx.columnHeaderHeight;
        const freezenhorizontaldata = [
            ctx.visibledatarow[row_st],
            row_st + 1,
            scrollTop,
            cutVolumn(ctx.visibledatarow, row_st + 1),
            top,
        ];
        freezen.horizontal = {
            freezenhorizontaldata,
            top,
        };
    }
    if (type === "rangeColumn" || type === "rangeBoth") {
        const scrollLeft = 0;
        let col_st = _.sortedIndex(ctx.visibledatacolumn, scrollLeft);
        const { column_focus } = range;
        if (column_focus > col_st) {
            col_st = column_focus;
        }
        if (col_st === -1) {
            col_st = 0;
        }
        const left = ctx.visibledatacolumn[col_st] - 2 - scrollLeft + ctx.rowHeaderWidth;
        const freezenverticaldata = [
            ctx.visibledatacolumn[col_st],
            col_st + 1,
            scrollLeft,
            cutVolumn(ctx.visibledatacolumn, col_st + 1),
            left,
        ];
        freezen.vertical = {
            freezenverticaldata,
            left,
        };
    }
    cache.freezen || (cache.freezen = {});
    cache.freezen[ctx.currentSheetId] = freezen;
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} cache
 * @param {string} sheetId
 */
export function initFreeze(ctx, cache, sheetId) {
    frozenTofreezen(ctx, cache, sheetId);
}
/**
 * @param {Context} ctx
 * @param {Freezen | undefined} freeze
 */
export function scrollToFrozenRowCol(ctx, freeze) {
    var _a, _b;
    const select_save = ctx.luckysheet_select_save;
    if (!select_save)
        return;
    let row;
    const { row_focus } = select_save[0];
    if (row_focus === select_save[0].row[0]) {
        [, row] = select_save[0].row;
    }
    else if (row_focus === select_save[0].row[1]) {
        [row] = select_save[0].row;
    }
    let column;
    const { column_focus } = select_save[0];
    if (column_focus === select_save[0].column[0]) {
        [, column] = select_save[0].column;
    }
    else if (column_focus === select_save[0].column[1]) {
        [column] = select_save[0].column;
    }
    const freezenverticaldata = (_a = freeze === null || freeze === void 0 ? void 0 : freeze.vertical) === null || _a === void 0 ? void 0 : _a.freezenverticaldata;
    const freezenhorizontaldata = (_b = freeze === null || freeze === void 0 ? void 0 : freeze.horizontal) === null || _b === void 0 ? void 0 : _b.freezenhorizontaldata;
    if (freezenverticaldata != null && column != null) {
        let freezen_colindex = freezenverticaldata[1];
        const offset = _.sortedIndex(freezenverticaldata[3], ctx.scrollLeft);
        const top = freezenverticaldata[4];
        freezen_colindex += offset;
        if (column >= ctx.visibledatacolumn.length) {
            column = ctx.visibledatacolumn.length - 1;
        }
        if (freezen_colindex >= ctx.visibledatacolumn.length) {
            freezen_colindex = ctx.visibledatacolumn.length - 1;
        }
        const column_px = ctx.visibledatacolumn[column];
        const freezen_px = ctx.visibledatacolumn[freezen_colindex];
        if (column_px <= freezen_px + top) {
            ctx.scrollLeft = 0;
        }
    }
    if (freezenhorizontaldata != null && row != null) {
        let freezen_rowindex = freezenhorizontaldata[1];
        const offset = _.sortedIndex(freezenhorizontaldata[3], ctx.scrollTop);
        const left = freezenhorizontaldata[4];
        freezen_rowindex += offset;
        if (row >= ctx.visibledatarow.length) {
            row = ctx.visibledatarow.length - 1;
        }
        if (freezen_rowindex >= ctx.visibledatarow.length) {
            freezen_rowindex = ctx.visibledatarow.length - 1;
        }
        const row_px = ctx.visibledatarow[row];
        const freezen_px = ctx.visibledatarow[freezen_rowindex];
        if (row_px <= freezen_px + left) {
            ctx.scrollTop = 0;
        }
    }
}
/**
 * @param {Context} ctx
 * @returns {number}
 */
export function getFrozenHandleTop(ctx) {
    var _a, _b, _c, _d, _e, _f;
    const idx = getSheetIndex(ctx, ctx.currentSheetId);
    if (idx == null)
        return ctx.scrollTop;
    const sheet = ctx.luckysheetfile[idx];
    if (((_a = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _a === void 0 ? void 0 : _a.type) === "row" ||
        ((_b = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _b === void 0 ? void 0 : _b.type) === "rangeRow" ||
        ((_c = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _c === void 0 ? void 0 : _c.type) === "rangeBoth" ||
        ((_d = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _d === void 0 ? void 0 : _d.type) === "both") {
        return (rowLocationByIndex(((_f = (_e = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _e === void 0 ? void 0 : _e.range) === null || _f === void 0 ? void 0 : _f.row_focus) || 0, ctx.visibledatarow)[1] + ctx.scrollTop);
    }
    return ctx.scrollTop;
}
/**
 * @param {Context} ctx
 * @returns {number}
 */
export function getFrozenHandleLeft(ctx) {
    var _a, _b, _c, _d, _e, _f;
    const idx = getSheetIndex(ctx, ctx.currentSheetId);
    if (idx == null)
        return ctx.scrollLeft;
    const sheet = ctx.luckysheetfile[idx];
    if (((_a = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _a === void 0 ? void 0 : _a.type) === "column" ||
        ((_b = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _b === void 0 ? void 0 : _b.type) === "rangeColumn" ||
        ((_c = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _c === void 0 ? void 0 : _c.type) === "rangeBoth" ||
        ((_d = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _d === void 0 ? void 0 : _d.type) === "both") {
        return (colLocationByIndex(((_f = (_e = sheet === null || sheet === void 0 ? void 0 : sheet.frozen) === null || _e === void 0 ? void 0 : _e.range) === null || _f === void 0 ? void 0 : _f.column_focus) || 0, ctx.visibledatacolumn)[1] -
            2 +
            ctx.scrollLeft);
    }
    return ctx.scrollLeft;
}

/**
 * @typedef {import("./index.js").Context} Context
 * @typedef {import("./index.js").Freezen} Freezen
 * @typedef {import("./index.js").GlobalCache} GlobalCache
 */
