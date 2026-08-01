import _ from "lodash";
import { getSheetIndex } from ".";
import { getFlowdata } from "../context";
const addtionalMergeOps = (ops, id) => {
    let merge_new = {};
    ops.some((op) => {
        if (op.op === "replace" &&
            op.path[0] === "config" &&
            op.path[1] === "merge") {
            merge_new = op.value;
            return true;
        }
        return false;
    });
    const new_ops = [];
    Object.entries(merge_new).forEach(([, v]) => {
        const { r, c, rs, cs } = v;
        const headerOp = {
            op: "replace",
            path: ["data", r, c, "mc"],
            id,
            value: v,
        };
        for (let i = r; i < r + rs; i += 1) {
            for (let j = c; j < c + cs; j += 1) {
                new_ops.push({
                    op: "replace",
                    path: ["data", i, j, "mc"],
                    id,
                    value: { r, c },
                });
            }
        }
        new_ops.push(headerOp);
    });
    return new_ops;
};
function additionalCellOps(ctx, insertRowColOp) {
    const { id, index, direction, count, type } = insertRowColOp;
    const d = getFlowdata(ctx, id);
    const startIndex = index + (direction === "rightbottom" ? 1 : 0);
    if (d == null) {
        return [];
    }
    const cellOps = [];
    if (type === "row") {
        for (let i = 0; i < d[startIndex].length; i += 1) {
            const cell = d[startIndex][i];
            if (cell != null) {
                for (let j = 0; j < count; j += 1) {
                    cellOps.push({
                        op: "replace",
                        id,
                        path: ["data", startIndex + j, i],
                        value: cell,
                    });
                }
            }
        }
    }
    else {
        for (let i = 0; i < d.length; i += 1) {
            const cell = d[i][startIndex];
            if (cell != null) {
                for (let j = 0; j < count; j += 1) {
                    cellOps.push({
                        op: "replace",
                        id,
                        path: ["data", i, startIndex + j],
                        value: cell,
                    });
                }
            }
        }
    }
    return cellOps;
}
/**
 * @param {Array<Patch>} patches
 * @returns {Array<Patch>}
 */
export function filterPatch(patches) {
    return _.filter(patches, (p) => p.path[0] === "luckysheetfile" && p.path[2] !== "luckysheet_select_save");
}
/**
 * @param {Array<Op>} ops
 * @returns {Array<Op>}
 */
export function extractFormulaCellOps(ops) {
    const formulaOps = [];
    ops.forEach((op) => {
        var _a, _b;
        if (op.op === "remove")
            return;
        if (op.path.length === 2 && Array.isArray(op.value)) {
            for (let i = 0; i < op.value.length; i += 1) {
                if ((_a = op.value[i]) === null || _a === void 0 ? void 0 : _a.f) {
                    formulaOps.push({
                        op: "replace",
                        id: op.id,
                        path: [...op.path, i],
                        value: op.value[i],
                    });
                }
            }
        }
        else if (op.path.length === 3 && ((_b = op.value) === null || _b === void 0 ? void 0 : _b.f)) {
            formulaOps.push(op);
        }
        else if (op.path.length === 4 && op.path[3] === "f") {
            formulaOps.push(op);
        }
    });
    return formulaOps;
}
/**
 * @param {Context} ctx
 * @param {Array<Patch>} patches
 * @param {PatchOptions} [options]
 * @param {boolean} [undo]
 * @returns {Array<Op>}
 */
export function patchToOp(ctx, patches, options, undo = false) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    let ops = patches.map((p) => {
        const op = {
            op: p.op,
            value: p.value,
            path: p.path,
        };
        if (p.path[0] === "luckysheetfile" && _.isNumber(p.path[1])) {
            const id = ctx.luckysheetfile[p.path[1]].id;
            op.id = id;
            op.path = p.path.slice(2);
            if (_.isEqual(op.path, ["calcChain", "length"])) {
                op.path = ["calcChain"];
                op.value = ctx.luckysheetfile[p.path[1]].calcChain;
            }
        }
        return op;
    });
    _.every(ops, (p) => {
        var _a;
        if (p.op === "replace" &&
            !_.isNil((_a = p.value) === null || _a === void 0 ? void 0 : _a.hl) &&
            p.path.length === 3 &&
            p.path[0] === "data") {
            const index = getSheetIndex(ctx, p.id);
            ops.push({
                id: p.id,
                op: "replace",
                path: ["hyperlink", `${p.path[1]}_${p.path[2]}`],
                value: ctx.luckysheetfile[index].hyperlink[`${p.value.hl.r}_${p.value.hl.c}`],
            });
        }
    });
    if (options === null || options === void 0 ? void 0 : options.insertRowColOp) {
        const [nonDataOps, dataOps] = _.partition(ops, (p) => p.path[0] !== "data");
        const formulaOps = extractFormulaCellOps(dataOps);
        ops = nonDataOps;
        ops.push({
            op: "insertRowCol",
            id: options.insertRowColOp.id,
            path: [],
            value: options.insertRowColOp,
        });
        ops = [...ops, ...formulaOps];
        const mergeOps = addtionalMergeOps(ops, ctx.currentSheetId);
        ops = [...ops, ...mergeOps];
        if (options === null || options === void 0 ? void 0 : options.restoreDeletedCells) {
            const restoreCellsOps = [];
            const flowdata = getFlowdata(ctx);
            if (flowdata) {
                const rowlen = flowdata.length;
                const collen = flowdata[0].length;
                for (let i = 0; i < rowlen; i += 1) {
                    for (let j = 0; j < collen; j += 1) {
                        const cell = flowdata[i][j];
                        if (!cell)
                            continue;
                        if ((options.insertRowColOp.type === "row" &&
                            i >= options.insertRowColOp.index &&
                            i <
                                options.insertRowColOp.index +
                                    options.insertRowColOp.count) ||
                            (options.insertRowColOp.type === "column" &&
                                j >= options.insertRowColOp.index &&
                                j < options.insertRowColOp.index + options.insertRowColOp.count)) {
                            restoreCellsOps.push({
                                op: "replace",
                                path: ["data", i, j],
                                id: ctx.currentSheetId,
                                value: cell,
                            });
                        }
                    }
                }
            }
            ops = [...ops, ...restoreCellsOps];
        }
        else {
            const cellOps = additionalCellOps(ctx, options.insertRowColOp);
            ops = [...ops, ...cellOps];
        }
    }
    else if (options === null || options === void 0 ? void 0 : options.deleteRowColOp) {
        const [nonDataOps, dataOps] = _.partition(ops, (p) => p.path[0] !== "data");
        const formulaOps = extractFormulaCellOps(dataOps);
        ops = nonDataOps;
        ops.push({
            op: "deleteRowCol",
            id: options.deleteRowColOp.id,
            path: [],
            value: options.deleteRowColOp,
        });
        ops = [...ops, ...formulaOps];
        const mergeOps = addtionalMergeOps(ops, ctx.currentSheetId);
        ops = [...ops, ...mergeOps];
    }
    else if (options === null || options === void 0 ? void 0 : options.addSheetOp) {
        const [addSheetOps, otherOps] = _.partition(ops, (op) => op.path.length === 0 && op.op === "add");
        options.id = options.addSheet.id;
        if (undo) {
            const index = getSheetIndex(ctx, options.addSheet.id);
            const order = (_b = (_a = options.addSheet) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.order;
            ops = otherOps;
            ops.push({
                op: "deleteSheet",
                id: (_c = options.addSheet) === null || _c === void 0 ? void 0 : _c.id,
                path: [],
                value: options.addSheet,
            });
            if (index !== ctx.luckysheetfile.length) {
                const sheetsRight = ctx.luckysheetfile.filter((sheet) => (sheet === null || sheet === void 0 ? void 0 : sheet.order) >= order);
                _.forEach(sheetsRight, (sheet) => {
                    ops.push({
                        id: sheet.id,
                        op: "replace",
                        path: ["order"],
                        value: (sheet === null || sheet === void 0 ? void 0 : sheet.order) - 1,
                    });
                });
            }
        }
        else {
            ops = otherOps;
            ops.push({
                op: "addSheet",
                id: (_d = options.addSheet) === null || _d === void 0 ? void 0 : _d.id,
                path: [],
                value: (_e = addSheetOps[0]) === null || _e === void 0 ? void 0 : _e.value,
            });
        }
    }
    else if (options === null || options === void 0 ? void 0 : options.deleteSheetOp) {
        options.id = options.deleteSheetOp.id;
        if (undo) {
            ops = [
                {
                    op: "addSheet",
                    id: options.deleteSheetOp.id,
                    path: [],
                    value: (_f = options.deletedSheet) === null || _f === void 0 ? void 0 : _f.value,
                },
                {
                    id: options.deleteSheetOp.id,
                    op: "replace",
                    path: ["name"],
                    value: (_h = (_g = options.deletedSheet) === null || _g === void 0 ? void 0 : _g.value) === null || _h === void 0 ? void 0 : _h.name,
                },
            ];
            const order = (_k = (_j = options.deletedSheet) === null || _j === void 0 ? void 0 : _j.value) === null || _k === void 0 ? void 0 : _k.order;
            const sheetsRight = ctx.luckysheetfile.filter((sheet) => {
                var _a;
                return (sheet === null || sheet === void 0 ? void 0 : sheet.order) >= order &&
                    sheet.id !== ((_a = options.deleteSheetOp) === null || _a === void 0 ? void 0 : _a.id);
            });
            _.forEach(sheetsRight, (sheet) => {
                ops.push({
                    id: sheet.id,
                    op: "replace",
                    path: ["order"],
                    value: sheet === null || sheet === void 0 ? void 0 : sheet.order,
                });
            });
        }
        else {
            ops = [
                {
                    op: "deleteSheet",
                    id: options.deleteSheetOp.id,
                    path: [],
                    value: options.deletedSheet,
                },
            ];
            const order = (_m = (_l = options.deletedSheet) === null || _l === void 0 ? void 0 : _l.value) === null || _m === void 0 ? void 0 : _m.order;
            if (((_o = options.deletedSheet) === null || _o === void 0 ? void 0 : _o.order) !== ctx.luckysheetfile.length) {
                const sheetsRight = ctx.luckysheetfile.filter((sheet) => (sheet === null || sheet === void 0 ? void 0 : sheet.order) >= order);
                _.forEach(sheetsRight, (sheet) => {
                    ops.push({
                        id: sheet.id,
                        op: "replace",
                        path: ["order"],
                        value: sheet === null || sheet === void 0 ? void 0 : sheet.order,
                    });
                });
            }
        }
    }
    return ops;
}
/**
 * @param {Context} ctx
 * @param {Array<Op>} ops
 * @returns {[Patch[], Op[]]}
 */
export function opToPatch(ctx, ops) {
    const [normalOps, specialOps] = _.partition(ops, (op) => op.op === "add" || op.op === "remove" || op.op === "replace");
    const additionalPatches = [];
    const patches = normalOps.map((op) => {
        const patch = {
            op: op.op,
            value: op.value,
            path: op.path,
        };
        if (op.id) {
            const i = getSheetIndex(ctx, op.id);
            if (i != null) {
                patch.path = ["luckysheetfile", i, ...op.path];
            }
            else {
            }
            if (op.path[0] === "images" && op.id === ctx.currentSheetId) {
                additionalPatches.push({ ...patch, path: ["insertedImgs"] });
            }
        }
        return patch;
    });
    return [patches.concat(additionalPatches), specialOps];
}
/**
 * @param {PatchOptions} [options]
 * @returns {PatchOptions | undefined}
 */
export function inverseRowColOptions(options) {
    if (!options)
        return options;
    if (options.insertRowColOp) {
        let { index } = options.insertRowColOp;
        if (options.insertRowColOp.direction === "rightbottom") {
            index += 1;
        }
        return {
            deleteRowColOp: {
                type: options.insertRowColOp.type,
                id: options.insertRowColOp.id,
                start: index,
                end: index + options.insertRowColOp.count - 1,
            },
        };
    }
    if (options.deleteRowColOp) {
        return {
            insertRowColOp: {
                type: options.deleteRowColOp.type,
                id: options.deleteRowColOp.id,
                index: options.deleteRowColOp.start,
                count: options.deleteRowColOp.end - options.deleteRowColOp.start + 1,
                direction: "lefttop",
            },
        };
    }
    return options;
}

/**
 * @typedef {Object} ChangedSheet
 * @property {number} [index]
 * @property {string} [id]
 * @property {Sheet} [value]
 * @property {number} [order]
 */

/**
 * @typedef {Object} PatchOptions
 * @property {{
        type: "row" | "column";
        index: number;
        count: number;
        direction: "lefttop" | "rightbottom";
        id: string;
    }} [insertRowColOp]
 * @property {{
        type: "row" | "column";
        start: number;
        end: number;
        id: string;
    }} [deleteRowColOp]
 * @property {boolean} [restoreDeletedCells]
 * @property {boolean} [addSheetOp]
 * @property {{
        id: string;
    }} [deleteSheetOp]
 * @property {ChangedSheet} [addSheet]
 * @property {ChangedSheet} [deletedSheet]
 * @property {string} [id]
 */

/**
 * @typedef {import("immer").Patch} Patch
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").Op} Op
 * @typedef {import("./types.js").Sheet} Sheet
 */
