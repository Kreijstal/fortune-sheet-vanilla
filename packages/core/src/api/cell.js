import _ from "lodash";
import { delFunctionGroup, dropCellCache, functionHTMLGenerate, getTypeItemHide, setCellValue as setCellValueInternal, updateCell, updateDropCell, updateFormatCell, } from "../modules";
import { getSheet } from "./common";
import { SHEET_NOT_FOUND } from "./errors";
import SSF from "../modules/ssf";
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
    var _a;
    if (!_.isNumber(row) || !_.isNumber(column)) {
        throw new Error("row or column cannot be null or undefined");
    }
    const sheet = getSheet(ctx, options);
    const { type = "v" } = options;
    const targetSheetData = sheet.data;
    if (!targetSheetData) {
        throw SHEET_NOT_FOUND;
    }
    const cellData = targetSheetData[row][column];
    let ret;
    if (cellData && _.isPlainObject(cellData)) {
        ret = cellData[type];
        if (type === "f" && ret != null) {
            ret = functionHTMLGenerate(ret);
        }
        else if (type === "f") {
            ret = cellData.v;
        }
        else if (cellData && cellData.ct && cellData.ct.fa === "yyyy-MM-dd") {
            ret = cellData.m;
        }
        else if (((_a = cellData.ct) === null || _a === void 0 ? void 0 : _a.t) === "inlineStr") {
            ret = cellData.ct.s.reduce((prev, cur) => { var _a; return prev + ((_a = cur.v) !== null && _a !== void 0 ? _a : ""); }, "");
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
    var _a;
    if (!_.isNumber(row) || !_.isNumber(column)) {
        throw new Error("row or column cannot be null or undefined");
    }
    const sheet = getSheet(ctx, options);
    const { data } = sheet;
    const formatList = {
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
        rt: 1,
        qp: 1,
    };
    if (value == null || value.toString().length === 0) {
        delFunctionGroup(ctx, row, column);
        setCellValueInternal(ctx, row, column, data, value);
    }
    else if (value instanceof Object) {
        const curv = {};
        if (((_a = data === null || data === void 0 ? void 0 : data[row]) === null || _a === void 0 ? void 0 : _a[column]) == null) {
            data[row][column] = {};
        }
        const cell = data[row][column];
        if (value.f != null && value.v == null) {
            curv.f = value.f;
            if (value.ct != null) {
                curv.ct = value.ct;
            }
            updateCell(ctx, row, column, cellInput, curv);
        }
        else {
            if (value.ct != null) {
                curv.ct = value.ct;
            }
            if (value.f != null) {
                curv.f = value.f;
            }
            if (value.v != null) {
                curv.v = value.v;
            }
            else {
                curv.v = cell.v;
            }
            if (value.m != null) {
                curv.m = value.m;
            }
            delFunctionGroup(ctx, row, column);
            setCellValueInternal(ctx, row, column, data, curv);
        }
        _.forEach(value, (v, attr) => {
            if (attr in formatList) {
                updateFormatCell(ctx, data, attr, v, row, row, column, column);
            }
            else {
                cell[attr] = v;
            }
        });
        data[row][column] = cell;
    }
    else {
        if (value.toString().substr(0, 1) === "=" ||
            value.toString().substr(0, 5) === "<span") {
            updateCell(ctx, row, column, cellInput, value);
        }
        else {
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
    var _a, _b;
    if (!_.isNumber(row) || !_.isNumber(column)) {
        throw new Error("row or column cannot be null or undefined");
    }
    const sheet = getSheet(ctx, options);
    const cell = (_b = (_a = sheet.data) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[column];
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
    var _a;
    if (!_.isNumber(row) || !_.isNumber(column)) {
        throw new Error("row or column cannot be null or undefined");
    }
    if (!attr) {
        throw new Error("attr cannot be null or undefined");
    }
    const sheet = getSheet(ctx, options);
    const targetSheetData = sheet.data;
    const cellData = ((_a = targetSheetData === null || targetSheetData === void 0 ? void 0 : targetSheetData[row]) === null || _a === void 0 ? void 0 : _a[column]) || {};
    const cfg = sheet.config || {};
    if (attr === "ct" && (!value || value.fa == null || value.t == null)) {
        throw new Error("'fa' and 't' should be present in value when attr is 'ct'");
    }
    else if (attr === "ct" && !_.isNil(cellData.v)) {
        cellData.m = SSF.format(value.fa, cellData.v);
    }
    if (attr === "bd") {
        if (cfg.borderInfo == null) {
            cfg.borderInfo = [];
        }
        const borderInfo = {
            rangeType: "range",
            borderType: "border-all",
            color: "#000",
            style: "1",
            range: [
                {
                    column: [column, column],
                    row: [row, row],
                },
            ],
            ...value,
        };
        cfg.borderInfo.push(borderInfo);
    }
    else {
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
    if (!typeItemHide[0] &&
        !typeItemHide[1] &&
        !typeItemHide[2] &&
        !typeItemHide[3] &&
        !typeItemHide[4] &&
        !typeItemHide[5] &&
        !typeItemHide[6]) {
        dropCellCache.applyType = "0";
    }
    else {
        dropCellCache.applyType = "1";
    }
    updateDropCell(ctx);
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").Cell} Cell
 * @typedef {import("./types.js").SingleRange} SingleRange
 * @typedef {import("./api/common.js").CommonOptions} CommonOptions
 */
