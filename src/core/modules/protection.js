import { getSheetByIndex } from './../utils/index.js';
/**
 * @param {Context} ctx
 * @param {number} r
 * @param {number} c
 * @param {string} sheetId
 * @returns {boolean}
 */
export function checkCellIsLocked(ctx, r, c, sheetId) {
  const sheetFile = getSheetByIndex(ctx, sheetId);
  if (sheetFile == null) {
    return false;
  }
  const { data } = sheetFile;
  const cell = data?.[r]?.[c];
  // cell have lo attribute
  if (cell?.lo != null) {
    return !!cell?.lo;
  }
  // default locked status from sheet config
  const aut = sheetFile.config?.authority;
  const sheetInEditable = aut == null || aut.sheet == null || aut.sheet === 0;
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
  //   const _locale = locale();
  //   const local_protection = _locale.protection;
  const sheetFile = getSheetByIndex(ctx, sheetId);
  if (sheetFile == null) {
    return true;
  }
  if (sheetFile.config == null || sheetFile.config.authority == null) {
    return true;
  }
  const aut = sheetFile.config.authority;
  if (aut == null || aut.sheet == null || aut.sheet === 0) {
    return true;
  }
  const { data } = sheetFile;
  const cell = data?.[r]?.[c];
  if (cell && cell.lo === 0) {
    // lo为0的时候才是可编辑
    if (aut.selectunLockedCells === 1 || aut.selectunLockedCells == null) {
      return true;
    }
    return false;
  }
  // locked??
  const isAllEdit = false;
  // TODO  const isAllEdit = checkProtectionLockedSqref(
  //     r,
  //     c,
  //     aut,
  //     local_protection,
  //     false
  //   ); // dont alert password model
  if (isAllEdit) {
    // unlocked
    if (aut.selectunLockedCells === 1 || aut.selectunLockedCells == null) {
      return true;
    }
    return false;
  }
  // locked
  if (aut.selectLockedCells === 1 || aut.selectLockedCells == null) {
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
  if (sheetFile == null) {
    return true;
  }
  if (sheetFile.config == null || sheetFile.config.authority == null) {
    return true;
  }
  const aut = sheetFile.config.authority;
  if (aut == null || aut.sheet == null || aut.sheet === 0) {
    return true;
  }
  let selectunLockedCells = false;
  if (aut.selectunLockedCells === 1 || aut.selectunLockedCells == null) {
    selectunLockedCells = true;
  }
  let selectLockedCells = false;
  if (aut.selectLockedCells === 1 || aut.selectLockedCells == null) {
    selectLockedCells = true;
  }
  if (selectunLockedCells && selectLockedCells) {
    return true;
  }
  return false;
}
// formatCells authority, bl cl fc fz ff ct  border etc.
/**
 * @param {Context} ctx
 * @returns {boolean}
 */
export function checkProtectionFormatCells(ctx) {
  const sheetFile = getSheetByIndex(ctx, ctx.currentSheetId);
  if (sheetFile == null) {
    return true;
  }
  if (sheetFile.config == null || sheetFile.config.authority == null) {
    return true;
  }
  const aut = sheetFile.config.authority;
  if (aut == null || aut.sheet == null || aut.sheet === 0) {
    return true;
  }
  let ht = '';
  if (aut.hintText != null && aut.hintText.length > 0) {
    ht = aut.hintText;
  } else {
    ht = aut.defaultSheetHintText;
  }
  ctx.warnDialog = ht;
  return false;
}

/**
 * @typedef {import("./context.js").Context} Context
 */
