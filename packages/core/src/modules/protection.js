import _ from "lodash";
import { getSheetByIndex } from "../utils";
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {string} sheetId
 * @returns {boolean}
 */
export function checkCellIsLocked(ctx, r, c, sheetId) {
    var _a, _b;
    const sheetFile = getSheetByIndex(ctx, sheetId);
    if (_.isNil(sheetFile)) {
        return false;
    }
    const { data } = sheetFile;
    const cell = (_a = data === null || data === void 0 ? void 0 : data[r]) === null || _a === void 0 ? void 0 : _a[c];
    if (!_.isNil(cell === null || cell === void 0 ? void 0 : cell.lo)) {
        return !!(cell === null || cell === void 0 ? void 0 : cell.lo);
    }
    const aut = (_b = sheetFile.config) === null || _b === void 0 ? void 0 : _b.authority;
    const sheetInEditable = _.isNil(aut) || _.isNil(aut.sheet) || aut.sheet === 0;
    return !sheetInEditable;
}
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {string} sheetId
 * @returns {boolean}
 */
export function checkProtectionSelectLockedOrUnLockedCells(ctx, r, c, sheetId) {
    var _a;
    const sheetFile = getSheetByIndex(ctx, sheetId);
    if (_.isNil(sheetFile)) {
        return true;
    }
    if (_.isNil(sheetFile.config) || _.isNil(sheetFile.config.authority)) {
        return true;
    }
    const aut = sheetFile.config.authority;
    if (_.isNil(aut) || _.isNil(aut.sheet) || aut.sheet === 0) {
        return true;
    }
    const { data } = sheetFile;
    const cell = (_a = data === null || data === void 0 ? void 0 : data[r]) === null || _a === void 0 ? void 0 : _a[c];
    if (cell && cell.lo === 0) {
        if (aut.selectunLockedCells === 1 || _.isNil(aut.selectunLockedCells)) {
            return true;
        }
        return false;
    }
    const isAllEdit = false;
    if (isAllEdit) {
        if (aut.selectunLockedCells === 1 || _.isNil(aut.selectunLockedCells)) {
            return true;
        }
        return false;
    }
    if (aut.selectLockedCells === 1 || _.isNil(aut.selectLockedCells)) {
        return true;
    }
    return false;
}
/**
 * @param {Context} ctx
 * @param {string} sheetId
 * @returns {boolean}
 */
export function checkProtectionAllSelected(ctx, sheetId) {
    const sheetFile = getSheetByIndex(ctx, sheetId);
    if (_.isNil(sheetFile)) {
        return true;
    }
    if (_.isNil(sheetFile.config) || _.isNil(sheetFile.config.authority)) {
        return true;
    }
    const aut = sheetFile.config.authority;
    if (_.isNil(aut) || _.isNil(aut.sheet) || aut.sheet === 0) {
        return true;
    }
    let selectunLockedCells = false;
    if (aut.selectunLockedCells === 1 || _.isNil(aut.selectunLockedCells)) {
        selectunLockedCells = true;
    }
    let selectLockedCells = false;
    if (aut.selectLockedCells === 1 || _.isNil(aut.selectLockedCells)) {
        selectLockedCells = true;
    }
    if (selectunLockedCells && selectLockedCells) {
        return true;
    }
    return false;
}
/**
 * @param {Context} ctx
 * @returns {boolean}
 */
export function checkProtectionFormatCells(ctx) {
    const sheetFile = getSheetByIndex(ctx, ctx.currentSheetId);
    if (_.isNil(sheetFile)) {
        return true;
    }
    if (_.isNil(sheetFile.config) || _.isNil(sheetFile.config.authority)) {
        return true;
    }
    const aut = sheetFile.config.authority;
    if (_.isNil(aut) || _.isNil(aut.sheet) || aut.sheet === 0) {
        return true;
    }
    let ht = "";
    if (!_.isNil(aut.hintText) && aut.hintText.length > 0) {
        ht = aut.hintText;
    }
    else {
        ht = aut.defaultSheetHintText;
    }
    ctx.warnDialog = ht;
    return false;
}

/**
 * @typedef {import("./context.js").Context} Context
 */
