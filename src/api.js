import differenceBy from 'lodash.differenceby';
import isUndefined from 'lodash.isundefined';
import sortBy from 'lodash.sortby';
/**
 * Public instance API. Ported from
 * @fortune-sheet/react/src/components/Workbook/api.ts (MIT).
 */
import { applyPatches } from 'immer';
import {
  addSheet,
  api,
  deleteRowCol,
  deleteSheet,
  insertRowCol,
  opToPatch,
  createFilterOptions,
  getSheetIndex,
} from './core/index.js';

export function generateAPIs(store, cellInput, scrollbarX, scrollbarY) {
  const setContext = (recipe, options) => store.setContext(recipe, options);
  const getContext = () => store.ctx;
  const settings = store.settings;
  return {
    applyOp: (ops) => {
      setContext(
        (ctx_) => {
          const [patches, specialOps] = opToPatch(ctx_, ops);
          if (specialOps.length > 0) {
            const [specialOp] = specialOps;
            if (specialOp.op === 'insertRowCol') {
              try {
                insertRowCol(ctx_, specialOp.value, false);
              } catch (e) {
                console.error(e);
              }
            } else if (specialOp.op === 'deleteRowCol') {
              deleteRowCol(ctx_, specialOp.value);
            } else if (specialOp.op === 'addSheet') {
              const name = patches.filter(
                (path) => path.path[0] === 'name'
              )?.[0]?.value;
              if (specialOp.value?.id) {
                addSheet(
                  ctx_,
                  settings,
                  specialOp.value.id,
                  false,
                  name,
                  specialOp.value
                );
              }
              const fileIndex = getSheetIndex(ctx_, specialOp.value.id);
              api.initSheetData(ctx_, fileIndex, specialOp.value);
            } else if (specialOp.op === 'deleteSheet') {
              deleteSheet(ctx_, specialOp.value.id);
              patches.length = 0;
            }
          }
          if (ops[0]?.path?.[0] === 'filter_select')
            ctx_.luckysheet_filter_save = ops[0].value;
          else if (ops[0]?.path?.[0] === 'hide') {
            if (ctx_.currentSheetId === ops[0].id) {
              const shownSheets = ctx_.luckysheetfile.filter(
                (sheet) =>
                  (isUndefined(sheet.hide) || sheet?.hide !== 1) &&
                  sheet.id !== ops[0].id
              );
              ctx_.currentSheetId = sortBy(
                shownSheets,
                (sheet) => sheet.order
              )[0].id;
            }
          }
          createFilterOptions(ctx_, ctx_.luckysheet_filter_save, ops[0]?.id);
          if (patches.length === 0) return;
          try {
            applyPatches(ctx_, patches);
          } catch (e) {
            console.error(e);
          }
        },
        { noHistory: true }
      );
    },

    getCellValue: (row, column, options = {}) =>
      api.getCellValue(getContext(), row, column, options),

    setCellValue: (row, column, value, options = {}) =>
      setContext((draftCtx) =>
        api.setCellValue(draftCtx, row, column, value, cellInput, options)
      ),

    clearCell: (row, column, options = {}) =>
      setContext((draftCtx) => api.clearCell(draftCtx, row, column, options)),

    setCellFormat: (row, column, attr, value, options = {}) =>
      setContext((draftCtx) =>
        api.setCellFormat(draftCtx, row, column, attr, value, options)
      ),

    autoFillCell: (copyRange, applyRange, direction) =>
      setContext((draftCtx) =>
        api.autoFillCell(draftCtx, copyRange, applyRange, direction)
      ),

    freeze: (type, range, options = {}) =>
      setContext((draftCtx) => api.freeze(draftCtx, type, range, options)),

    insertRowOrColumn: (
      type,
      index,
      count,
      direction = 'rightbottom',
      options = {}
    ) =>
      setContext((draftCtx) =>
        api.insertRowOrColumn(draftCtx, type, index, count, direction, options)
      ),

    deleteRowOrColumn: (type, start, end, options = {}) =>
      setContext((draftCtx) =>
        api.deleteRowOrColumn(draftCtx, type, start, end, options)
      ),

    hideRowOrColumn: (rowOrColInfo, type) =>
      setContext((draftCtx) =>
        api.hideRowOrColumn(draftCtx, rowOrColInfo, type)
      ),

    showRowOrColumn: (rowOrColInfo, type) =>
      setContext((draftCtx) =>
        api.showRowOrColumn(draftCtx, rowOrColInfo, type)
      ),

    setRowHeight: (rowInfo, options = {}, custom = false) =>
      setContext((draftCtx) =>
        api.setRowHeight(draftCtx, rowInfo, options, custom)
      ),

    setColumnWidth: (columnInfo, options = {}, custom = false) =>
      setContext((draftCtx) =>
        api.setColumnWidth(draftCtx, columnInfo, options, custom)
      ),

    getRowHeight: (rows, options = {}) =>
      api.getRowHeight(getContext(), rows, options),

    getColumnWidth: (columns, options = {}) =>
      api.getColumnWidth(getContext(), columns, options),

    getSelection: () => api.getSelection(getContext()),

    getFlattenRange: (range) => api.getFlattenRange(getContext(), range),

    getCellsByFlattenRange: (range) =>
      api.getCellsByFlattenRange(getContext(), range),

    getSelectionCoordinates: () => api.getSelectionCoordinates(getContext()),

    getCellsByRange: (range, options = {}) =>
      api.getCellsByRange(getContext(), range, options),

    getHtmlByRange: (range, options = {}) =>
      api.getHtmlByRange(getContext(), range, options),

    setSelection: (range, options = {}) =>
      setContext((draftCtx) => api.setSelection(draftCtx, range, options)),

    setCellValuesByRange: (data, range, options = {}) =>
      setContext((draftCtx) =>
        api.setCellValuesByRange(draftCtx, data, range, cellInput, options)
      ),

    setCellFormatByRange: (attr, value, range, options = {}) =>
      setContext((draftCtx) =>
        api.setCellFormatByRange(draftCtx, attr, value, range, options)
      ),

    mergeCells: (ranges, type, options = {}) =>
      setContext((draftCtx) => api.mergeCells(draftCtx, ranges, type, options)),

    cancelMerge: (ranges, options = {}) =>
      setContext((draftCtx) => api.cancelMerge(draftCtx, ranges, options)),

    getAllSheets: () => api.getAllSheets(getContext()),

    getSheet: (options = {}) =>
      api.getSheetWithLatestCelldata(getContext(), options),

    addSheet: (sheetId) => {
      const existingSheetIds = api
        .getAllSheets(getContext())
        .map((sheet) => sheet.id || '');
      if (sheetId && existingSheetIds.includes(sheetId)) {
        console.error(
          `Failed to add new sheet: A sheet with the id "${sheetId}" already exists. Please use a unique sheet id.`
        );
      } else {
        setContext((draftCtx) => api.addSheet(draftCtx, settings, sheetId));
      }
    },

    deleteSheet: (options = {}) =>
      setContext((draftCtx) => api.deleteSheet(draftCtx, options)),

    updateSheet: (data) =>
      setContext((draftCtx) => api.updateSheet(draftCtx, data)),

    activateSheet: (options = {}) =>
      setContext((draftCtx) => api.activateSheet(draftCtx, options)),

    setSheetName: (name, options = {}) =>
      setContext((draftCtx) => api.setSheetName(draftCtx, name, options)),

    setSheetOrder: (orderList) =>
      setContext((draftCtx) => api.setSheetOrder(draftCtx, orderList)),

    scroll: (options) =>
      api.scroll(getContext(), scrollbarX, scrollbarY, options),

    addPresences: (newPresences) => {
      setContext((draftCtx) => {
        draftCtx.presences = differenceBy(
          draftCtx.presences || [],
          newPresences,
          (v) => (v.userId == null ? v.username : v.userId)
        ).concat(newPresences);
      });
    },

    removePresences: (arr) => {
      setContext((draftCtx) => {
        if (draftCtx.presences != null) {
          draftCtx.presences = differenceBy(draftCtx.presences, arr, (v) =>
            v.userId == null ? v.username : v.userId
          );
        }
      });
    },

    handleUndo: store.handleUndo,
    handleRedo: store.handleRedo,

    calculateFormula: (id, range) => {
      setContext((draftCtx) => {
        api.calculateFormula(draftCtx, id, range);
      });
    },

    dataToCelldata: (data) => api.dataToCelldata(data),

    celldataToData: (celldata, rowCount, colCount) =>
      api.celldataToData(celldata, rowCount, colCount),

    batchCallApis: (apiCalls) => {
      setContext((draftCtx) => {
        apiCalls.forEach((apiCall) => {
          const { name, args } = apiCall;
          if (typeof api[name] === 'function') {
            api[name](draftCtx, ...args);
          } else {
            console.warn(`API ${name} does not exist`);
          }
        });
      });
    },
  };
}
