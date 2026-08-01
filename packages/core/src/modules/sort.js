import numeral from "numeral";
import _ from "lodash";
import { execfunction, functionCopy, update } from ".";
import { diff, getFlowdata, isdatetime, isRealNull, isRealNum, } from "..";
import { jfrefreshgrid } from "./refresh";
/**
 * @param {boolean} isAsc
 * @param {number} index
 * @param {Array<Array<Cell | null>>} data
 * @returns {{
    sortedData: Cell[][];
    rowOffsets: number[];
}}
 */
export function orderbydata(isAsc, index, data) {
    if (isAsc == null) {
        isAsc = true;
    }
    const a = (x, y) => {
        let x1 = x[index];
        let y1 = y[index];
        if (x[index] != null) {
            x1 = x[index].v;
        }
        if (y[index] != null) {
            y1 = y[index].v;
        }
        if (isRealNull(x1)) {
            return isAsc ? 1 : -1;
        }
        if (isRealNull(y1)) {
            return isAsc ? -1 : 1;
        }
        if (isdatetime(x1) && isdatetime(y1)) {
            return diff(x1, y1);
        }
        if (isRealNum(x1) && isRealNum(y1)) {
            const y1Value = numeral(y1).value();
            const x1Value = numeral(x1).value();
            if (y1Value == null || x1Value == null)
                return null;
            return x1Value - y1Value;
        }
        if (!isRealNum(x1) && !isRealNum(y1)) {
            return x1.localeCompare(y1, "zh");
        }
        if (!isRealNum(x1)) {
            return 1;
        }
        if (!isRealNum(y1)) {
            return -1;
        }
        return 0;
    };
    const d = (x, y) => a(y, x);
    const sortedData = _.clone(data);
    sortedData.sort(isAsc ? a : d);
    const rowOffsets = sortedData.map((r, i) => {
        const origIndex = _.findIndex(data, (origR) => origR === r);
        return i - origIndex;
    });
    return { sortedData, rowOffsets };
}
/**
 * @param {Context} ctx
 * @param {CellMatrix} sheetData
 * @param {CellMatrix} dataRange
 * @param {number} index
 * @param {boolean} isAsc
 * @param {number} str
 * @param {number} edr
 * @param {number} stc
 * @param {number} edc
 */
export function sortDataRange(ctx, sheetData, dataRange, index, isAsc, str, edr, stc, edc) {
    var _a;
    const { sortedData, rowOffsets } = orderbydata(isAsc, index, dataRange);
    for (let r = str; r <= edr; r += 1) {
        for (let c = stc; c <= edc; c += 1) {
            const cell = sortedData[r - str][c - stc];
            if (cell === null || cell === void 0 ? void 0 : cell.f) {
                const moveOffset = rowOffsets[r - str];
                let func = cell === null || cell === void 0 ? void 0 : cell.f;
                if (moveOffset > 0) {
                    func = `=${functionCopy(ctx, func, "down", moveOffset)}`;
                }
                else if (moveOffset < 0) {
                    func = `=${functionCopy(ctx, func, "up", -moveOffset)}`;
                }
                const funcV = execfunction(ctx, func, r, c, undefined, undefined, true);
                [, cell.v, cell.f] = funcV;
                cell.m = update(((_a = cell.ct) === null || _a === void 0 ? void 0 : _a.fa) || "General", cell.v);
            }
            sheetData[r][c] = cell;
        }
    }
    jfrefreshgrid(ctx, sheetData, [{ row: [str, edr], column: [stc, edc] }]);
}
/**
 * @param {Context} ctx
 * @param {boolean} isAsc
 * @param {number} [colIndex]
 */
export function sortSelection(ctx, isAsc, colIndex = 0) {
    var _a;
    if (ctx.allowEdit === false)
        return;
    if (ctx.luckysheet_select_save == null)
        return;
    if (ctx.luckysheet_select_save.length > 1) {
        return;
    }
    if (isAsc == null) {
        isAsc = true;
    }
    const flowdata = getFlowdata(ctx);
    const d = flowdata;
    if (d == null)
        return;
    const r1 = ctx.luckysheet_select_save[0].row[0];
    const r2 = ctx.luckysheet_select_save[0].row[1];
    const c1 = ctx.luckysheet_select_save[0].column[0];
    const c2 = ctx.luckysheet_select_save[0].column[1];
    let str = null;
    let edr;
    for (let r = r1; r <= r2; r += 1) {
        if (d[r] != null && d[r][c1] != null) {
            const cell = d[r][c1];
            if (cell == null)
                return;
            if (cell.mc != null || isRealNull(cell.v)) {
                continue;
            }
            if (str == null && /[\u4e00-\u9fa5]+/g.test(`${cell.v}`)) {
                str = r + 1;
                edr = r + 1;
                continue;
            }
            if (str == null) {
                str = r;
            }
            edr = r;
        }
    }
    if (str == null || str > r2) {
        return;
    }
    let hasMc = false;
    const data = [];
    if (edr == null)
        return;
    for (let r = str; r <= edr; r += 1) {
        const data_row = [];
        for (let c = c1; c <= c2; c += 1) {
            if (d[r][c] != null && ((_a = d[r][c]) === null || _a === void 0 ? void 0 : _a.mc) != null) {
                hasMc = true;
                break;
            }
            data_row.push(d[r][c]);
        }
        data.push(data_row);
    }
    if (hasMc) {
        return;
    }
    sortDataRange(ctx, d, data, colIndex, isAsc, str, edr, c1, c2);
}

/**
 * @typedef {import("./index.js").Cell} Cell
 * @typedef {import("./index.js").CellMatrix} CellMatrix
 * @typedef {import("./index.js").Context} Context
 */
