import sortedIndex from 'lodash.sortedindex';
/**
 * @param {number} x
 * @param {number} y
 * @param {Context} ctx
 * @returns {Array<number>}
 */
export function mousePosition(x, y, ctx) {
  const newX = x - ctx.rowHeaderWidth;
  const newY =
    y -
    // ctx.infobarHeight -
    ctx.toolbarHeight -
    ctx.calculatebarHeight -
    ctx.columnHeaderHeight;
  return [newX, newY];
}
/**
 * @param {number} row_index
 * @param {Array<number>} visibleRow
 * @returns {Array<number>}
 */
export function rowLocationByIndex(row_index, visibleRow) {
  let row = 0;
  let row_pre = 0;
  row = visibleRow[row_index];
  if (row_index === 0) {
    row_pre = 0;
  } else {
    row_pre = visibleRow[row_index - 1];
  }
  return [row_pre, row, row_index];
}
/**
 * @param {number} y
 * @param {Array<number>} visibleRow
 * @returns {Array<number>}
 */
export function rowLocation(y, visibleRow) {
  let row_index = sortedIndex(visibleRow, y);
  if (row_index >= visibleRow.length && y > 0) {
    row_index = visibleRow.length - 1;
  } else if (row_index === -1 && y <= 0) {
    row_index = 0;
  }
  return rowLocationByIndex(row_index, visibleRow);
}
/**
 * @param {number} col_index
 * @param {Array<number>} visibleCol
 * @returns {Array<number>}
 */
export function colLocationByIndex(col_index, visibleCol) {
  let col = 0;
  let col_pre = 0;
  col = visibleCol[col_index];
  if (col_index === 0) {
    col_pre = 0;
  } else {
    col_pre = visibleCol[col_index - 1];
  }
  return [col_pre, col, col_index];
}
/**
 * @param {number} x
 * @param {Array<number>} visibleCol
 * @returns {Array<number>}
 */
export function colLocation(x, visibleCol) {
  let col_index = sortedIndex(visibleCol, x);
  if (col_index >= visibleCol.length && x > 0) {
    col_index = visibleCol.length - 1;
  } else if (col_index === -1 && x <= 0) {
    col_index = 0;
  }
  return colLocationByIndex(col_index, visibleCol);
}

/**
 * @typedef {import("./context.js").Context} Context
 */
