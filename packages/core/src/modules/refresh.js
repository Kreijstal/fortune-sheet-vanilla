import { getFlowdata } from "../context";
import { execFunctionGroup } from "./formula";
import { setFormulaCellInfo } from "./formulaHelper";
function runExecFunction(ctx, range, index, data) {
    ctx.formulaCache.execFunctionExist = [];
    for (let s = 0; s < range.length; s += 1) {
        for (let r = range[s].row[0]; r <= range[s].row[1]; r += 1) {
            for (let c = range[s].column[0]; c <= range[s].column[1]; c += 1) {
                setFormulaCellInfo(ctx, { r, c, id: index }, data);
                ctx.formulaCache.execFunctionExist.push({ r, c, i: index });
            }
        }
    }
    ctx.formulaCache.execFunctionExist.reverse();
    execFunctionGroup(ctx, null, null, null, null, data);
    ctx.formulaCache.execFunctionGlobalData = null;
}
/**
 * @param {Context} ctx
 * @param {CellMatrix | null} data
 * @param {Selection[] | undefined} range
 * @param {boolean} [isRunExecFunction]
 */
export function jfrefreshgrid(ctx, data, range, isRunExecFunction = true) {
    if (data == null) {
        data = getFlowdata(ctx);
    }
    if (range == null) {
        range = ctx.luckysheet_select_save;
        if (range == null)
            return;
    }
    if (isRunExecFunction) {
        runExecFunction(ctx, range, ctx.currentSheetId, data);
    }
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").Selection} Selection
 */
