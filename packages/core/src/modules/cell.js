import _ from "lodash";
import { getFlowdata } from "../context";
import { getSheetIndex, indexToColumnChar, rgbToHex } from "../utils";
import { checkCF, getComputeMap } from "./ConditionFormat";
import { getFailureText, validateCellData } from "./dataVerification";
import { genarate, update } from "./format";
import { delFunctionGroup, execfunction, execFunctionGroup, functionHTMLGenerate, getcellrange, iscelldata, isFormula, } from "./formula";
import { attrToCssName, convertSpanToShareString, isInlineStringCell, isInlineStringCT, } from "./inline-string";
import { isRealNull, isRealNum, valueIsError } from "./validation";
import { getCellTextInfo } from "./text";
import { setFormulaCellInfo } from "./formulaHelper";
/**
 * @param {Cell} cell
 * @param {keyof Cell} attr
 * @param {number} [defaultFontSize]
 * @returns {any}
 */
export function normalizedCellAttr(cell, attr, defaultFontSize = 10) {
    const tf = { bl: 1, it: 1, ff: 1, cl: 1, un: 1 };
    let value = cell === null || cell === void 0 ? void 0 : cell[attr];
    if (attr in tf || (attr === "fs" && isInlineStringCell(cell))) {
        value || (value = "0");
    }
    else if (["fc", "bg", "bc"].includes(attr)) {
        if (["fc", "bc"].includes(attr)) {
            value || (value = "#000000");
        }
        if ((value === null || value === void 0 ? void 0 : value.indexOf("rgba")) > -1) {
            value = rgbToHex(value);
        }
    }
    else if (attr.substring(0, 2) === "bs") {
        value || (value = "none");
    }
    else if (attr === "ht" || attr === "vt") {
        const defaultValue = attr === "ht" ? "1" : "0";
        value = !_.isNil(value) ? value.toString() : defaultValue;
        if (["0", "1", "2"].indexOf(value.toString()) === -1) {
            value = defaultValue;
        }
    }
    else if (attr === "fs") {
        value || (value = defaultFontSize.toString());
    }
    else if (attr === "tb" || attr === "tr") {
        value || (value = "0");
    }
    return value;
}
/**
 * @param {CellMatrix} data
 * @param {number} r
 * @param {number} c
 * @param {keyof Cell} attr
 * @returns {any}
 */
export function normalizedAttr(data, r, c, attr) {
    if (!data || !data[r]) {
        console.warn("cell (%d, %d) is null", r, c);
        return null;
    }
    const cell = data[r][c];
    if (!cell)
        return undefined;
    return normalizedCellAttr(cell, attr);
}
/**
 * @param {number} r
 * @param {number} c
 * @param {CellMatrix} data
 * @param {keyof Cell} [attr]
 * @returns {any}
 */
export function getCellValue(r, c, data, attr) {
    if (!attr) {
        attr = "v";
    }
    let d_value;
    if (!_.isNil(r) && !_.isNil(c)) {
        d_value = data[r][c];
    }
    else if (!_.isNil(r)) {
        d_value = data[r];
    }
    else if (!_.isNil(c)) {
        const newData = data[0].map((col, i) => {
            return data.map((row) => {
                return row[i];
            });
        });
        d_value = newData[c];
    }
    else {
        return data;
    }
    let retv = d_value;
    if (_.isPlainObject(d_value)) {
        const d = d_value;
        retv = d[attr];
        if (attr === "f" && !_.isNil(retv)) {
            retv = functionHTMLGenerate(retv);
        }
        else if (attr === "f") {
            retv = d.v;
        }
        else if (d && d.ct && d.ct.t === "d") {
            retv = d.m;
        }
    }
    if (retv === undefined) {
        retv = null;
    }
    return retv;
}
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {CellMatrix | null | undefined} d
 * @param {any} v
 */
export function setCellValue(ctx, r, c, d, v) {
    var _a, _b, _c, _d, _e, _f;
    if (_.isNil(d)) {
        d = getFlowdata(ctx);
    }
    if (!d)
        return;
    let cell = d[r][c];
    let vupdate;
    if (_.isPlainObject(v)) {
        if (_.isNil(cell)) {
            cell = v;
        }
        else {
            if (!_.isNil(v.f)) {
                cell.f = v.f;
            }
            else if ("f" in cell) {
                delete cell.f;
            }
            if (!_.isNil(v.ct)) {
                cell.ct = v.ct;
            }
        }
        if (_.isPlainObject(v.v)) {
            vupdate = v.v.v;
        }
        else {
            vupdate = v.v;
        }
    }
    else {
        vupdate = v;
    }
    if (isRealNull(vupdate)) {
        if (_.isPlainObject(cell)) {
            delete cell.m;
            delete cell.v;
        }
        else {
            cell = null;
        }
        d[r][c] = cell;
        return;
    }
    if (isRealNull(cell) ||
        ((_.isString(cell) || _.isNumber(cell)) && cell === v)) {
        cell = {};
    }
    if (!cell)
        return;
    const vupdateStr = vupdate.toString();
    if (vupdateStr.substr(0, 1) === "'") {
        cell.m = vupdateStr.substr(1);
        cell.ct = { fa: "@", t: "s" };
        cell.v = vupdateStr.substr(1);
        cell.qp = 1;
    }
    else if (cell.qp === 1) {
        cell.m = vupdateStr;
        cell.ct = { fa: "@", t: "s" };
        cell.v = vupdateStr;
    }
    else if (vupdateStr.toUpperCase() === "TRUE" &&
        (_.isNil((_a = cell.ct) === null || _a === void 0 ? void 0 : _a.fa) || ((_b = cell.ct) === null || _b === void 0 ? void 0 : _b.fa) !== "@")) {
        cell.m = "TRUE";
        cell.ct = { fa: "General", t: "b" };
        cell.v = true;
    }
    else if (vupdateStr.toUpperCase() === "FALSE" &&
        (_.isNil((_c = cell.ct) === null || _c === void 0 ? void 0 : _c.fa) || ((_d = cell.ct) === null || _d === void 0 ? void 0 : _d.fa) !== "@")) {
        cell.m = "FALSE";
        cell.ct = { fa: "General", t: "b" };
        cell.v = false;
    }
    else if (vupdateStr.substr(-1) === "%" &&
        isRealNum(vupdateStr.substring(0, vupdateStr.length - 1)) &&
        (_.isNil((_e = cell.ct) === null || _e === void 0 ? void 0 : _e.fa) || ((_f = cell.ct) === null || _f === void 0 ? void 0 : _f.fa) !== "@")) {
        cell.ct = { fa: "0%", t: "n" };
        cell.v = vupdateStr.substring(0, vupdateStr.length - 1) / 100;
        cell.m = vupdate;
    }
    else if (valueIsError(vupdate)) {
        cell.m = vupdateStr;
        if (!_.isNil(cell.ct)) {
            cell.ct.t = "e";
        }
        else {
            cell.ct = { fa: "General", t: "e" };
        }
        cell.v = vupdate;
    }
    else {
        if (!_.isNil(cell.f) &&
            isRealNum(vupdate) &&
            !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(vupdate)) {
            cell.v = parseFloat(vupdate);
            if (_.isNil(cell.ct)) {
                cell.ct = { fa: "General", t: "n" };
            }
            if (cell.v === Infinity || cell.v === -Infinity) {
                cell.m = cell.v.toString();
            }
            else {
                if (cell.v.toString().indexOf("e") > -1) {
                    let len;
                    if (cell.v.toString().split(".").length === 1) {
                        len = 0;
                    }
                    else {
                        len = cell.v.toString().split(".")[1].split("e")[0].length;
                    }
                    if (len > 5) {
                        len = 5;
                    }
                    cell.m = cell.v.toExponential(len).toString();
                }
                else {
                    const v_p = Math.round(cell.v * 1000000000) / 1000000000;
                    if (_.isNil(cell.ct)) {
                        const mask = genarate(v_p);
                        if (mask != null) {
                            cell.m = mask[0].toString();
                        }
                    }
                    else {
                        const mask = update(cell.ct.fa, v_p);
                        cell.m = mask.toString();
                    }
                }
            }
        }
        else if (!_.isNil(cell.ct) && cell.ct.fa === "@") {
            cell.m = vupdateStr;
            cell.v = vupdate;
        }
        else if (cell.ct != null && cell.ct.t === "d" && _.isString(vupdate)) {
            const mask = genarate(vupdate);
            if (mask[1].t !== "d" || mask[1].fa === cell.ct.fa) {
                [cell.m, cell.ct, cell.v] = mask;
            }
            else {
                [, , cell.v] = mask;
                cell.m = update(cell.ct.fa, cell.v);
            }
        }
        else if (!_.isNil(cell.ct) &&
            !_.isNil(cell.ct.fa) &&
            cell.ct.fa !== "General") {
            if (isRealNum(vupdate)) {
                vupdate = parseFloat(vupdate);
            }
            let mask = update(cell.ct.fa, vupdate);
            if (mask === vupdate) {
                mask = genarate(vupdate);
                cell.m = mask[0].toString();
                [, cell.ct, cell.v] = mask;
            }
            else {
                cell.m = mask.toString();
                cell.v = vupdate;
            }
        }
        else {
            if (isRealNum(vupdate) &&
                !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(vupdate)) {
                if (typeof vupdate === "string") {
                    const flag = vupdate
                        .split("")
                        .every((ele) => ele === "0" || ele === ".");
                    if (flag) {
                        vupdate = parseFloat(vupdate);
                    }
                }
                cell.v =
                    vupdate;
                cell.ct = { fa: "General", t: "n" };
                if (cell.v === Infinity || cell.v === -Infinity) {
                    cell.m = cell.v.toString();
                }
                else if (cell.v != null) {
                    const mask = genarate(cell.v);
                    if (mask) {
                        cell.m = mask[0].toString();
                    }
                }
            }
            else {
                const mask = genarate(vupdate);
                if (mask) {
                    cell.m = mask[0].toString();
                    [, cell.ct, cell.v] = mask;
                }
            }
        }
    }
    d[r][c] = cell;
}
/**
 * @param {number} r
 * @param {number} c
 * @param {CellMatrix} data
 * @param {keyof Cell} [attr]
 * @returns {any}
 */
export function getRealCellValue(r, c, data, attr) {
    let value = getCellValue(r, c, data, "m");
    if (_.isNil(value)) {
        value = getCellValue(r, c, data, attr);
        if (_.isNil(value)) {
            const ct = getCellValue(r, c, data, "ct");
            if (isInlineStringCT(ct)) {
                value = ct.s;
            }
        }
    }
    return value;
}
/**
 * @param {Context} ctx
 * @param {CellMatrix} d
 * @param {number} row_index
 * @param {number} col_index
 * @returns {{
    row: number[];
    column: number[];
}}
 */
export function mergeBorder(ctx, d, row_index, col_index) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!d || !d[row_index]) {
        console.warn("Merge info is null", row_index, col_index);
        return null;
    }
    const value = d[row_index][col_index];
    if (!value)
        return null;
    if (value === null || value === void 0 ? void 0 : value.mc) {
        const margeMaindata = value.mc;
        if (!margeMaindata) {
            console.warn("Merge info is null", row_index, col_index);
            return null;
        }
        col_index = margeMaindata.c;
        row_index = margeMaindata.r;
        if (_.isNil((_a = d === null || d === void 0 ? void 0 : d[row_index]) === null || _a === void 0 ? void 0 : _a[col_index])) {
            console.warn("Main merge Cell info is null", row_index, col_index);
            return null;
        }
        const col_rs = (_d = (_c = (_b = d[row_index]) === null || _b === void 0 ? void 0 : _b[col_index]) === null || _c === void 0 ? void 0 : _c.mc) === null || _d === void 0 ? void 0 : _d.cs;
        const row_rs = (_g = (_f = (_e = d[row_index]) === null || _e === void 0 ? void 0 : _e[col_index]) === null || _f === void 0 ? void 0 : _f.mc) === null || _g === void 0 ? void 0 : _g.rs;
        const mergeMain = (_j = (_h = d[row_index]) === null || _h === void 0 ? void 0 : _h[col_index]) === null || _j === void 0 ? void 0 : _j.mc;
        if (!mergeMain ||
            _.isNil(mergeMain === null || mergeMain === void 0 ? void 0 : mergeMain.rs) ||
            _.isNil(mergeMain === null || mergeMain === void 0 ? void 0 : mergeMain.cs) ||
            _.isNil(col_rs) ||
            _.isNil(row_rs)) {
            console.warn("Main merge info is null", mergeMain);
            return null;
        }
        let start_r;
        let end_r;
        let row;
        let row_pre;
        for (let r = row_index; r < mergeMain.rs + row_index; r += 1) {
            if (r === 0) {
                start_r = -1;
            }
            else {
                start_r = ctx.visibledatarow[r - 1] - 1;
            }
            end_r = ctx.visibledatarow[r];
            if (row_pre === undefined) {
                row_pre = start_r;
                row = end_r;
            }
            else if (row !== undefined) {
                row += end_r - start_r - 1;
            }
        }
        let start_c;
        let end_c;
        let col;
        let col_pre;
        for (let c = col_index; c < mergeMain.cs + col_index; c += 1) {
            if (c === 0) {
                start_c = 0;
            }
            else {
                start_c = ctx.visibledatacolumn[c - 1];
            }
            end_c = ctx.visibledatacolumn[c];
            if (col_pre === undefined) {
                col_pre = start_c;
                col = end_c;
            }
            else if (col !== undefined) {
                col += end_c - start_c;
            }
        }
        if (_.isNil(row_pre) || _.isNil(col_pre) || _.isNil(row) || _.isNil(col)) {
            console.warn("Main merge info row_pre or col_pre or row or col is null", mergeMain);
            return null;
        }
        return {
            row: [row_pre, row, row_index, row_index + row_rs - 1],
            column: [col_pre, col, col_index, col_index + col_rs - 1],
        };
    }
    return null;
}
function mergeMove(ctx, mc, columnseleted, rowseleted, s, top, height, left, width) {
    const row_st = mc.r;
    const row_ed = mc.r + mc.rs - 1;
    const col_st = mc.c;
    const col_ed = mc.c + mc.cs - 1;
    let ismatch = false;
    columnseleted[0] = Math.min(columnseleted[0], columnseleted[1]);
    rowseleted[0] = Math.min(rowseleted[0], rowseleted[1]);
    if ((columnseleted[0] <= col_st &&
        columnseleted[1] >= col_ed &&
        rowseleted[0] <= row_st &&
        rowseleted[1] >= row_ed) ||
        (!(columnseleted[1] < col_st || columnseleted[0] > col_ed) &&
            !(rowseleted[1] < row_st || rowseleted[0] > row_ed))) {
        const flowdata = getFlowdata(ctx);
        if (!flowdata)
            return null;
        const margeset = mergeBorder(ctx, flowdata, mc.r, mc.c);
        if (margeset) {
            const row = margeset.row[1];
            const row_pre = margeset.row[0];
            const col = margeset.column[1];
            const col_pre = margeset.column[0];
            if (!(columnseleted[1] < col_st || columnseleted[0] > col_ed)) {
                if (rowseleted[0] <= row_ed && rowseleted[0] >= row_st) {
                    height += top - row_pre;
                    top = row_pre;
                    rowseleted[0] = row_st;
                }
                if (rowseleted[1] >= row_st && rowseleted[1] <= row_ed) {
                    if (s.row_focus >= row_st && s.row_focus <= row_ed) {
                        height = row - top;
                    }
                    else {
                        height = row - top;
                    }
                    rowseleted[1] = row_ed;
                }
            }
            if (!(rowseleted[1] < row_st || rowseleted[0] > row_ed)) {
                if (columnseleted[0] <= col_ed && columnseleted[0] >= col_st) {
                    width += left - col_pre;
                    left = col_pre;
                    columnseleted[0] = col_st;
                }
                if (columnseleted[1] >= col_st && columnseleted[1] <= col_ed) {
                    if (s.column_focus >= col_st && s.column_focus <= col_ed) {
                        width = col - left;
                    }
                    else {
                        width = col - left;
                    }
                    columnseleted[1] = col_ed;
                }
            }
            ismatch = true;
        }
    }
    if (ismatch) {
        return [columnseleted, rowseleted, top, height, left, width];
    }
    return null;
}
/**
 * @param {Context} ctx
 * @param {Array<number>} columnseleted
 * @param {Array<number>} rowseleted
 * @param {Partial<Selection>} s
 * @param {number} top
 * @param {number} height
 * @param {number} left
 * @param {number} width
 * @returns {Array<Array<number | number>>}
 */
export function mergeMoveMain(ctx, columnseleted, rowseleted, s, top, height, left, width) {
    const mergesetting = ctx.config.merge;
    if (!mergesetting) {
        return null;
    }
    const mcset = Object.keys(mergesetting);
    rowseleted[1] = Math.max(rowseleted[0], rowseleted[1]);
    columnseleted[1] = Math.max(columnseleted[0], columnseleted[1]);
    let offloop = true;
    const mergeMoveData = {};
    while (offloop) {
        offloop = false;
        for (let i = 0; i < mcset.length; i += 1) {
            const key = mcset[i];
            const mc = mergesetting[key];
            if (key in mergeMoveData) {
                continue;
            }
            const changeparam = mergeMove(ctx, mc, columnseleted, rowseleted, s, top, height, left, width);
            if (changeparam != null) {
                mergeMoveData[key] = mc;
                [columnseleted, rowseleted, top, height, left, width] = changeparam;
                offloop = true;
            }
            else {
                delete mergeMoveData[key];
            }
        }
    }
    return [columnseleted, rowseleted, top, height, left, width];
}
/**
 * @param {Context} ctx
 */
export function cancelFunctionrangeSelected(ctx) {
    if (ctx.formulaCache.selectingRangeIndex === -1) {
        ctx.formulaRangeSelect = undefined;
    }
}
/**
 * @param {Context} ctx
 */
export function cancelNormalSelected(ctx) {
    cancelFunctionrangeSelected(ctx);
    ctx.luckysheetCellUpdate = [];
    ctx.formulaRangeHighlight = [];
    ctx.functionHint = null;
    ctx.formulaCache.rangestart = false;
    ctx.formulaCache.rangedrag_column_start = false;
    ctx.formulaCache.rangedrag_row_start = false;
}
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {HTMLDivElement | null} [$input]
 * @param {any} [value]
 * @param {CanvasRenderingContext2D} [canvas]
 */
export function updateCell(ctx, r, c, $input, value, canvas) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    let inputText = $input === null || $input === void 0 ? void 0 : $input.innerText;
    const inputHtml = $input === null || $input === void 0 ? void 0 : $input.innerHTML;
    const flowdata = getFlowdata(ctx);
    if (!flowdata)
        return;
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    const { dataVerification } = ctx.luckysheetfile[index];
    if (!_.isNil(dataVerification)) {
        const dvItem = dataVerification[`${r}_${c}`];
        if (!_.isNil(dvItem) &&
            dvItem.prohibitInput &&
            !validateCellData(ctx, dvItem, inputText)) {
            const failureText = getFailureText(ctx, dvItem);
            cancelNormalSelected(ctx);
            ctx.warnDialog = failureText;
            return;
        }
    }
    let curv = flowdata[r][c];
    const oldValue = _.cloneDeep(curv);
    const isPrevInline = isInlineStringCell(curv);
    let isCurInline = (inputText === null || inputText === void 0 ? void 0 : inputText.slice(0, 1)) !== "=" && (inputHtml === null || inputHtml === void 0 ? void 0 : inputHtml.substring(0, 5)) === "<span";
    let isCopyVal = false;
    if (!isCurInline && inputText && inputText.length > 0) {
        const splitArr = inputText
            .replace(/\r\n/g, "_x000D_")
            .replace(/&#13;&#10;/g, "_x000D_")
            .replace(/\r/g, "_x000D_")
            .replace(/\n/g, "_x000D_")
            .split("_x000D_");
        if (splitArr.length > 1 && inputHtml !== "<br>") {
            isCopyVal = true;
            isCurInline = true;
            inputText = splitArr.join("\r\n");
        }
    }
    if ((curv === null || curv === void 0 ? void 0 : curv.ct) && !value && !isCurInline && isPrevInline) {
        delete curv.ct.s;
        curv.ct.t = "g";
        curv.ct.fa = "General";
        value = "";
    }
    else if (isCurInline) {
        if (!_.isPlainObject(curv)) {
            curv = {};
        }
        curv || (curv = {});
        const fontSize = curv.fs || 10;
        if (!curv.ct) {
            curv.ct = {};
            curv.ct.fa = "General";
        }
        curv.ct.t = "inlineStr";
        curv.ct.s = convertSpanToShareString($input.querySelectorAll("span"), curv);
        delete curv.fs;
        delete curv.f;
        delete curv.v;
        delete curv.m;
        curv.fs = fontSize;
        if (isCopyVal) {
            curv.ct.s = [
                {
                    v: inputText,
                    fs: fontSize,
                },
            ];
        }
    }
    value = value || ($input === null || $input === void 0 ? void 0 : $input.innerText);
    if (((_b = (_a = ctx.hooks).beforeUpdateCell) === null || _b === void 0 ? void 0 : _b.call(_a, r, c, value)) === false) {
        cancelNormalSelected(ctx);
        return;
    }
    if (!isCurInline) {
        if (isRealNull(value) && !isPrevInline) {
            if (!curv || (isRealNull(curv.v) && !curv.spl && !curv.f)) {
                cancelNormalSelected(ctx);
                return;
            }
        }
        else if (curv && curv.qp !== 1) {
            if (_.isPlainObject(curv) &&
                (value === curv.f || value === curv.v || value === curv.m)) {
                cancelNormalSelected(ctx);
                return;
            }
            if (value === curv) {
                cancelNormalSelected(ctx);
                return;
            }
        }
        if (_.isString(value) && value.slice(0, 1) === "=" && value.length > 1) {
        }
        else if (_.isPlainObject(curv) &&
            curv &&
            curv.ct &&
            curv.ct.fa &&
            curv.ct.fa !== "@" &&
            !isRealNull(value)) {
            delete curv.m;
            if (curv.f) {
                delete curv.f;
                delete curv.spl;
            }
        }
    }
    let isRunExecFunction = true;
    const d = flowdata;
    let dynamicArrayItem = null;
    if (_.isPlainObject(curv)) {
        if (!isCurInline) {
            if (isFormula(value)) {
                const v = execfunction(ctx, value, r, c, undefined, undefined, true);
                isRunExecFunction = false;
                curv = _.cloneDeep(((_c = d === null || d === void 0 ? void 0 : d[r]) === null || _c === void 0 ? void 0 : _c[c]) || {});
                [, curv.v, curv.f] = v;
                if (v.length === 4 && v[3].type === "sparklines") {
                    delete curv.m;
                    delete curv.v;
                    const curCalv = v[3].data;
                    if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
                        [curv.v] = curCalv;
                    }
                    else {
                        curv.spl = v[3].data;
                    }
                }
                else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
                    dynamicArrayItem = v[3].data;
                }
            }
            else if (_.isPlainObject(value)) {
                const valueFunction = value.f;
                if (isFormula(valueFunction)) {
                    const v = execfunction(ctx, valueFunction, r, c, undefined, undefined, true);
                    isRunExecFunction = false;
                    curv = _.cloneDeep(((_d = d === null || d === void 0 ? void 0 : d[r]) === null || _d === void 0 ? void 0 : _d[c]) || {});
                    [, curv.v, curv.f] = v;
                    if (v.length === 4 && v[3].type === "sparklines") {
                        delete curv.m;
                        delete curv.v;
                        const curCalv = v[3].data;
                        if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
                            [curv.v] = curCalv;
                        }
                        else {
                            curv.spl = v[3].data;
                        }
                    }
                    else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
                        dynamicArrayItem = v[3].data;
                    }
                }
                else {
                    Object.keys(value).forEach((attr) => {
                        curv[attr] = value[attr];
                    });
                }
            }
            else {
                delFunctionGroup(ctx, r, c);
                execFunctionGroup(ctx, r, c, value);
                isRunExecFunction = false;
                curv = _.cloneDeep(((_e = d === null || d === void 0 ? void 0 : d[r]) === null || _e === void 0 ? void 0 : _e[c]) || {});
                curv.v = value;
                delete curv.f;
                delete curv.spl;
                if (curv.qp === 1 && `${value}`.substring(0, 1) !== "'") {
                    curv.qp = 0;
                    if (curv.ct) {
                        curv.ct.fa = "General";
                        curv.ct.t = "n";
                    }
                }
            }
        }
        value = curv;
    }
    else {
        if (isFormula(value)) {
            const v = execfunction(ctx, value, r, c, undefined, undefined, true);
            isRunExecFunction = false;
            value = {
                v: v[1],
                f: v[2],
            };
            if (v.length === 4 && v[3].type === "sparklines") {
                const curCalv = v[3].data;
                if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
                    [value.v] = curCalv;
                }
                else {
                    value.spl = v[3].data;
                }
            }
            else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
                dynamicArrayItem = v[3].data;
            }
        }
        else if (_.isPlainObject(value)) {
            const valueFunction = value.f;
            if (isFormula(valueFunction)) {
                const v = execfunction(ctx, valueFunction, r, c, undefined, undefined, true);
                isRunExecFunction = false;
                [, value.v, value.f] = v;
                if (v.length === 4 && v[3].type === "sparklines") {
                    const curCalv = v[3].data;
                    if (_.isArray(curCalv) && !_.isPlainObject(curCalv[0])) {
                        [value.v] = curCalv;
                    }
                    else {
                        value.spl = v[3].data;
                    }
                }
                else if (v.length === 4 && v[3].type === "dynamicArrayItem") {
                    dynamicArrayItem = v[3].data;
                }
            }
            else {
                const v = curv;
                if (_.isNil(value.v)) {
                    value.v = v;
                }
            }
        }
        else {
            delFunctionGroup(ctx, r, c);
            execFunctionGroup(ctx, r, c, value);
            isRunExecFunction = false;
        }
    }
    setCellValue(ctx, r, c, d, value);
    cancelNormalSelected(ctx);
    if (((curv === null || curv === void 0 ? void 0 : curv.tb) === "2" && curv.v) || isInlineStringCell(d[r][c])) {
        const { defaultrowlen } = ctx;
        const cfg = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)].config || {};
        if (!(((_f = cfg.columnlen) === null || _f === void 0 ? void 0 : _f[c]) && ((_g = cfg.rowlen) === null || _g === void 0 ? void 0 : _g[r]))) {
            const cellWidth = ((_h = cfg.columnlen) === null || _h === void 0 ? void 0 : _h[c]) || ctx.defaultcollen;
            const textInfo = canvas
                ? getCellTextInfo(d[r][c], canvas, ctx, {
                    r,
                    c,
                    cellWidth,
                })
                : null;
            let currentRowLen = defaultrowlen;
            if (textInfo) {
                currentRowLen = textInfo.textHeightAll + 2;
            }
            if (currentRowLen > defaultrowlen && !((_j = cfg.customHeight) === null || _j === void 0 ? void 0 : _j[r])) {
                if (_.isNil(cfg.rowlen))
                    cfg.rowlen = {};
                cfg.rowlen[r] = currentRowLen;
            }
        }
    }
    if (ctx.hooks.afterUpdateCell) {
        const newValue = _.cloneDeep(flowdata[r][c]);
        const { afterUpdateCell } = ctx.hooks;
        setTimeout(() => {
            afterUpdateCell === null || afterUpdateCell === void 0 ? void 0 : afterUpdateCell(r, c, oldValue, newValue);
        });
    }
    setFormulaCellInfo(ctx, { r, c, id: ctx.currentSheetId });
    ctx.formulaCache.execFunctionGlobalData = null;
}
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {string} i
 * @returns {Cell}
 */
export function getOrigincell(ctx, r, c, i) {
    const data = getFlowdata(ctx, i);
    if (_.isNil(r) || _.isNil(c)) {
        return null;
    }
    if (!data || !data[r] || !data[r][c]) {
        return null;
    }
    return data[r][c];
}
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {string} i
 * @param {any} [data]
 * @returns {any}
 */
export function getcellFormula(ctx, r, c, i, data) {
    let cell;
    if (_.isNil(data)) {
        cell = getOrigincell(ctx, r, c, i);
    }
    else {
        cell = data[r][c];
    }
    if (_.isNil(cell)) {
        return null;
    }
    return cell.f;
}
/**
 * @param {Context} ctx
 * @returns {Range}
 */
export function getRange(ctx) {
    const rangeArr = _.cloneDeep(ctx.luckysheet_select_save);
    const result = [];
    if (!rangeArr)
        return result;
    for (let i = 0; i < rangeArr.length; i += 1) {
        const rangeItem = rangeArr[i];
        const temp = {
            row: rangeItem.row,
            column: rangeItem.column,
        };
        result.push(temp);
    }
    return result;
}
/**
 * @param {Context} ctx
 * @param {Range} [range]
 * @returns {Array<{
    r: number;
    c: number;
}>}
 */
export function getFlattenedRange(ctx, range) {
    range = range || getRange(ctx);
    const result = [];
    range.forEach((ele) => {
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
 * @param {string} sheetId
 * @param {SingleRange} range
 * @param {string} [currentId]
 * @returns {string}
 */
export function getRangetxt(ctx, sheetId, range, currentId) {
    let sheettxt = "";
    if (currentId == null) {
        currentId = ctx.currentSheetId;
    }
    if (sheetId !== currentId) {
        const index = getSheetIndex(ctx, sheetId);
        if (index == null)
            return "";
        sheettxt = ctx.luckysheetfile[index].name.replace(/'/g, "''");
        if (/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/.test(sheettxt)) {
            sheettxt += "!";
        }
        else {
            sheettxt = `'${sheettxt}'!`;
        }
    }
    const row0 = range.row[0];
    const row1 = range.row[1];
    const column0 = range.column[0];
    const column1 = range.column[1];
    if (row0 == null && row1 == null) {
        return `${sheettxt + indexToColumnChar(column0)}:${indexToColumnChar(column1)}`;
    }
    if (column0 == null && column1 == null) {
        return `${sheettxt + (row0 + 1)}:${row1 + 1}`;
    }
    if (column0 === column1 && row0 === row1) {
        return sheettxt + indexToColumnChar(column0) + (row0 + 1);
    }
    return `${sheettxt + indexToColumnChar(column0) + (row0 + 1)}:${indexToColumnChar(column1)}${row1 + 1}`;
}
/**
 * @param {Context} ctx
 * @param {string} txt
 * @returns {Array<FormulaDependency>}
 */
export function getRangeByTxt(ctx, txt) {
    let range = [];
    if (txt.indexOf(",") !== -1) {
        const arr = txt.split(",");
        for (let i = 0; i < arr.length; i += 1) {
            if (iscelldata(arr[i])) {
                range.push(getcellrange(ctx, arr[i]));
            }
            else {
                range = [];
                break;
            }
        }
    }
    else {
        if (iscelldata(txt)) {
            range.push(getcellrange(ctx, txt));
        }
    }
    return range;
}
/**
 * @param {Context} ctx
 * @param {keyof Cell} attr
 * @param {any} status
 * @returns {boolean}
 */
export function isAllSelectedCellsInStatus(ctx, attr, status) {
    var _a, _b, _c, _d;
    if (!_.isEmpty(ctx.luckysheetCellUpdate)) {
        const w = window.getSelection();
        if (!w)
            return false;
        if (w.rangeCount === 0)
            return false;
        const range = w.getRangeAt(0);
        if (range.collapsed === true) {
            return false;
        }
        const { endContainer } = range;
        const { startContainer } = range;
        const cssField = _.camelCase(attrToCssName[attr]);
        if (startContainer === endContainer) {
            return !_.isEmpty((_a = startContainer.parentElement) === null || _a === void 0 ? void 0 : _a.style[cssField]);
        }
        if (((_b = startContainer.parentElement) === null || _b === void 0 ? void 0 : _b.tagName) === "SPAN" &&
            ((_c = endContainer.parentElement) === null || _c === void 0 ? void 0 : _c.tagName) === "SPAN") {
            const startSpan = startContainer.parentNode;
            const endSpan = endContainer.parentNode;
            const allSpans = (_d = startSpan === null || startSpan === void 0 ? void 0 : startSpan.parentNode) === null || _d === void 0 ? void 0 : _d.querySelectorAll("span");
            if (allSpans) {
                const startSpanIndex = _.indexOf(allSpans, startSpan);
                const endSpanIndex = _.indexOf(allSpans, endSpan);
                const rangeSpans = [];
                for (let i = startSpanIndex; i <= endSpanIndex; i += 1) {
                    rangeSpans.push(allSpans[i]);
                }
                return _.every(rangeSpans, (s) => !_.isEmpty(s.style[cssField]));
            }
        }
    }
    const cells = getFlattenedRange(ctx);
    const flowdata = getFlowdata(ctx);
    return cells.every(({ r, c }) => {
        var _a;
        const cell = (_a = flowdata === null || flowdata === void 0 ? void 0 : flowdata[r]) === null || _a === void 0 ? void 0 : _a[c];
        if (_.isNil(cell)) {
            return false;
        }
        return cell[attr] === status;
    });
}
/**
 * @param {Cell | null | undefined} cell
 * @param {Array<any>} [checksAF]
 * @param {any} [checksCF]
 * @param {boolean} [isCheck]
 * @returns {any}
 */
export function getFontStyleByCell(cell, checksAF, checksCF, isCheck = true) {
    const style = {};
    if (!cell) {
        return style;
    }
    _.forEach(cell, (v, key) => {
        var _a, _b, _c, _d;
        let value = cell[key];
        if (isCheck) {
            value = normalizedCellAttr(cell, key);
        }
        const valueNum = Number(value);
        if (key === "bl" && valueNum !== 0) {
            style.fontWeight = "bold";
        }
        if (key === "it" && valueNum !== 0) {
            style.fontStyle = "italic";
        }
        if (key === "fs" && valueNum !== 10) {
            style.fontSize = `${valueNum}pt`;
        }
        if ((key === "fc" && value !== "#000000") ||
            ((_a = checksAF === null || checksAF === void 0 ? void 0 : checksAF.length) !== null && _a !== void 0 ? _a : 0) > 0 ||
            (checksCF === null || checksCF === void 0 ? void 0 : checksCF.textColor)) {
            if (checksCF === null || checksCF === void 0 ? void 0 : checksCF.textColor) {
                style.color = checksCF.textColor;
            }
            else if (((_b = checksAF === null || checksAF === void 0 ? void 0 : checksAF.length) !== null && _b !== void 0 ? _b : 0) > 0) {
                [style.color] = checksAF;
            }
            else {
                style.color = value;
            }
        }
        if (key === "cl" && valueNum !== 0) {
            style.textDecoration = "line-through";
        }
        if (key === "un" && (valueNum === 1 || valueNum === 3)) {
            const color = (_c = cell._color) !== null && _c !== void 0 ? _c : cell.fc;
            const fs = (_d = cell._fontSize) !== null && _d !== void 0 ? _d : cell.fs;
            style.borderBottom = `${Math.floor(fs / 9)}px solid ${color}`;
        }
    });
    return style;
}
/**
 * @param {Context} ctx
 * @param {CellMatrix} d
 * @param {number} r
 * @param {number} c
 * @returns {any}
 */
export function getStyleByCell(ctx, d, r, c) {
    var _a;
    let style = {};
    const checksAF = [];
    const cf_compute = getComputeMap(ctx);
    const checksCF = checkCF(r, c, cf_compute);
    const cell = (_a = d === null || d === void 0 ? void 0 : d[r]) === null || _a === void 0 ? void 0 : _a[c];
    if (!cell)
        return {};
    const isInline = isInlineStringCell(cell);
    if ("bg" in cell) {
        const value = normalizedCellAttr(cell, "bg");
        if (checksCF === null || checksCF === void 0 ? void 0 : checksCF.cellColor) {
            if (checksCF === null || checksCF === void 0 ? void 0 : checksCF.cellColor) {
                style.background = `${checksCF.cellColor}`;
            }
            else if (checksAF.length > 1) {
                style.background = `${checksAF[1]}`;
            }
            else {
                style.background = `${value}`;
            }
        }
    }
    if ("ht" in cell) {
        const value = normalizedCellAttr(cell, "ht");
        if (Number(value) === 0) {
            style.textAlign = "center";
        }
        else if (Number(value) === 2) {
            style.textAlign = "right";
        }
    }
    if ("vt" in cell) {
        const value = normalizedCellAttr(cell, "vt");
        if (Number(value) === 0) {
            style.alignItems = "center";
        }
        else if (Number(value) === 2) {
            style.alignItems = "flex-end";
        }
    }
    if (!isInline) {
        style = _.assign(style, getFontStyleByCell(cell, checksAF, checksCF));
    }
    return style;
}
/**
 * @param {number} r
 * @param {number} c
 * @param {CellMatrix} data
 * @returns {string}
 */
export function getInlineStringHTML(r, c, data) {
    const ct = getCellValue(r, c, data, "ct");
    if (isInlineStringCT(ct)) {
        const strings = ct.s;
        let value = "";
        for (let i = 0; i < strings.length; i += 1) {
            const strObj = strings[i];
            if (strObj.v) {
                const style = getFontStyleByCell(strObj);
                const styleStr = _.map(style, (v, key) => {
                    return `${_.kebabCase(key)}:${_.isNumber(v) ? `${v}px` : v};`;
                }).join("");
                value += `<span class="luckysheet-input-span" index='${i}' style='${styleStr}'>${strObj.v}</span>`;
            }
        }
        return value;
    }
    return "";
}
/**
 * @param {string} width
 * @param {string} type
 * @param {string} color
 * @returns {Array<string | number>}
 */
export function getQKBorder(width, type, color) {
    let bordertype = "";
    if (width.toString().indexOf("pt") > -1) {
        const nWidth = parseFloat(width);
        if (nWidth < 1) {
        }
        else if (nWidth < 1.5) {
            bordertype = "Medium";
        }
        else {
            bordertype = "Thick";
        }
    }
    else {
        const nWidth = parseFloat(width);
        if (nWidth < 2) {
        }
        else if (nWidth < 3) {
            bordertype = "Medium";
        }
        else {
            bordertype = "Thick";
        }
    }
    let style = 0;
    type = type.toLowerCase();
    if (type === "double") {
        style = 2;
    }
    else if (type === "dotted") {
        if (bordertype === "Medium" || bordertype === "Thick") {
            style = 3;
        }
        else {
            style = 10;
        }
    }
    else if (type === "dashed") {
        if (bordertype === "Medium" || bordertype === "Thick") {
            style = 4;
        }
        else {
            style = 9;
        }
    }
    else if (type === "solid") {
        if (bordertype === "Medium") {
            style = 8;
        }
        else if (bordertype === "Thick") {
            style = 13;
        }
        else {
            style = 1;
        }
    }
    return [style, color];
}
/**
 * @param {Context} ctx
 * @param {Selection | undefined} range
 * @param {string} sheetId
 * @returns {Array<any>}
 */
export function getdatabyselection(ctx, range, sheetId) {
    if (range == null && ctx.luckysheet_select_save) {
        [range] = ctx.luckysheet_select_save;
    }
    if (!range)
        return [];
    if (range.row == null || range.row.length === 0) {
        return [];
    }
    let d;
    let cfg;
    if (sheetId != null && sheetId !== ctx.currentSheetId) {
        d = ctx.luckysheetfile[getSheetIndex(ctx, sheetId)].data;
        cfg = ctx.luckysheetfile[getSheetIndex(ctx, sheetId)].config;
    }
    else {
        d = getFlowdata(ctx);
        cfg = ctx.config;
    }
    const data = [];
    for (let r = range.row[0]; r <= range.row[1]; r += 1) {
        if ((d === null || d === void 0 ? void 0 : d[r]) == null) {
            continue;
        }
        if ((cfg === null || cfg === void 0 ? void 0 : cfg.rowhidden) != null && cfg.rowhidden[r] != null) {
            continue;
        }
        const row = [];
        for (let c = range.column[0]; c <= range.column[1]; c += 1) {
            if ((cfg === null || cfg === void 0 ? void 0 : cfg.colhidden) != null && cfg.colhidden[c] != null) {
                continue;
            }
            row.push(d[r][c]);
        }
        data.push(row);
    }
    return data;
}
/**
 * @param {Context} ctx
 * @param {number} row_index
 * @param {number} col_index
 */
export function luckysheetUpdateCell(ctx, row_index, col_index) {
    ctx.luckysheetCellUpdate = [row_index, col_index];
}
/**
 * @param {Context} ctx
 * @param {Selection} range
 * @returns {Array<any>}
 */
export function getDataBySelectionNoCopy(ctx, range) {
    if (!range || !range.row || range.row.length === 0)
        return [];
    const data = [];
    const flowData = getFlowdata(ctx);
    if (!flowData)
        return [];
    for (let r = range.row[0]; r <= range.row[1]; r += 1) {
        const row = [];
        if (ctx.config.rowhidden != null && ctx.config.rowhidden[r] != null) {
            continue;
        }
        for (let c = range.column[0]; c <= range.column[1]; c += 1) {
            let value = null;
            if (ctx.config.colhidden != null && ctx.config.colhidden[c] != null) {
                continue;
            }
            if (flowData[r] != null && flowData[r][c] != null) {
                value = flowData[r][c];
            }
            row.push(value);
        }
        data.push(row);
    }
    return data;
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").Cell} Cell
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").FormulaDependency} FormulaDependency
 * @typedef {import("./types.js").Range} Range
 * @typedef {import("./types.js").Selection} Selection
 * @typedef {import("./types.js").SingleRange} SingleRange
 */
