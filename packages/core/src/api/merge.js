import { getSheet } from "./common";
import { mergeCells as mergeCellsInternal } from "../modules";
/**
 * @param {Context} ctx
 * @param {Range} ranges
 * @param {string} type
 * @param {CommonOptions} [options]
 */
export function mergeCells(ctx, ranges, type, options = {}) {
    const sheet = getSheet(ctx, options);
    mergeCellsInternal(ctx, sheet.id, ranges, type);
}
/**
 * @param {Context} ctx
 * @param {Range} ranges
 * @param {CommonOptions} [options]
 */
export function cancelMerge(ctx, ranges, options = {}) {
    mergeCells(ctx, ranges, "merge-cancel", options);
}

/**
 * @typedef {import("./index.js").Context} Context
 * @typedef {import("./types.js").Range} Range
 * @typedef {import("./api/common.js").CommonOptions} CommonOptions
 */
