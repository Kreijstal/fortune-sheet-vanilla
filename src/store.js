import assign from 'lodash.assign';
import cloneDeep from 'lodash.clonedeep';
import forEach from 'lodash.foreach';
import indexOf from 'lodash.indexof';
import isEmpty from 'lodash.isempty';
import isNil from 'lodash.isnil';
import isNull from 'lodash.isnull';
import maxBy from 'lodash.maxby';
import times from 'lodash.times';
/**
 * Vanilla store: replicates the state management that the React `Workbook`
 * component used to do, minus React. Holds the single immer-managed `Context`
 * object, undo/redo history and the initial-data wiring.
 *
 * Logic ported from @fortune-sheet/react/src/components/Workbook/index.tsx (MIT).
 */
import {
  applyPatches,
  enablePatches,
  produce,
  produceWithPatches,
} from 'immer';
import {
  defaultContext,
  defaultSettings,
  initSheetIndex,
  getSheetIndex,
  filterPatch,
  patchToOp,
  inverseRowColOptions,
  ensureSheetIndex,
  setFormulaCellInfoMap,
  groupValuesRefresh,
} from './core/index.js';

enablePatches();

const triggerGroupValuesRefresh = (ctx) => {
  if (ctx.groupValuesRefreshData.length > 0) {
    groupValuesRefresh(ctx);
  }
};

const concatProducer =
  (...producers) =>
  (ctx) => {
    producers.forEach((producer) => {
      producer(ctx);
    });
  };

export class Store {
  constructor(settings, cb = {}) {
    this.cb = cb;
    this.refs = {
      globalCache: { undoList: [], redoList: [] },
      cellInput: { current: null },
      fxInput: { current: null },
      canvas: { current: null },
      cellArea: { current: null },
      workbookContainer: { current: null },
      scrollbarX: { current: null },
      scrollbarY: { current: null },
    };
    this.ctx = defaultContext(this.refs);
    this.settings = assign(cloneDeep(defaultSettings), settings);
    this.initialized = false;
  }

  /** Port of the Workbook "init" effect: expand celldata, apply settings. */
  init(originalData) {
    if (this.initialized) return;
    this.initialized = true;
    const mergedSettings = this.settings;
    this.setContext(
      (draftCtx) => {
        draftCtx.defaultcolumnNum = mergedSettings.column;
        draftCtx.defaultrowNum = mergedSettings.row;
        draftCtx.defaultFontSize = mergedSettings.defaultFontSize;
        if (isEmpty(draftCtx.luckysheetfile)) {
          const newData = produce(originalData, (draftData) => {
            ensureSheetIndex(draftData, mergedSettings.generateSheetId);
          });
          draftCtx.luckysheetfile = newData;
          newData.forEach((newDatum) => {
            const index = getSheetIndex(draftCtx, newDatum.id);
            const sheet = draftCtx.luckysheetfile?.[index];
            const cellMatrixData = this.initSheetData(draftCtx, sheet, index);
            setFormulaCellInfoMap(
              draftCtx,
              sheet.calcChain,
              cellMatrixData || undefined
            );
          });
        }
        if (mergedSettings.devicePixelRatio > 0) {
          draftCtx.devicePixelRatio = mergedSettings.devicePixelRatio;
        }
        draftCtx.lang = mergedSettings.lang;
        draftCtx.allowEdit = mergedSettings.allowEdit;
        draftCtx.hooks = mergedSettings.hooks;
        if (isEmpty(draftCtx.currentSheetId)) {
          initSheetIndex(draftCtx);
        }
        let sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetId);
        if (sheetIdx == null) {
          if ((draftCtx.luckysheetfile?.length ?? 0) > 0) {
            sheetIdx = 0;
            draftCtx.currentSheetId = draftCtx.luckysheetfile[0].id;
          }
        }
        if (sheetIdx == null) return;

        const sheet = draftCtx.luckysheetfile?.[sheetIdx];
        if (!sheet) return;

        let { data } = sheet;
        // expand cell data
        if (isEmpty(data)) {
          const temp = this.initSheetData(draftCtx, sheet, sheetIdx);
          if (!isNull(temp)) {
            data = temp;
          }
        }

        if (
          isEmpty(draftCtx.luckysheet_select_save) &&
          !isEmpty(sheet.luckysheet_select_save)
        ) {
          draftCtx.luckysheet_select_save = sheet.luckysheet_select_save;
        }
        if (draftCtx.luckysheet_select_save?.length === 0) {
          if (
            data?.[0]?.[0]?.mc &&
            !isNil(data?.[0]?.[0]?.mc?.rs) &&
            !isNil(data?.[0]?.[0]?.mc?.cs)
          ) {
            draftCtx.luckysheet_select_save = [
              {
                row: [0, data[0][0].mc.rs - 1],
                column: [0, data[0][0].mc.cs - 1],
              },
            ];
          } else {
            draftCtx.luckysheet_select_save = [
              {
                row: [0, 0],
                column: [0, 0],
              },
            ];
          }
        }

        draftCtx.config = isNil(sheet.config) ? {} : sheet.config;
        draftCtx.insertedImgs = sheet.images;
        draftCtx.currency = mergedSettings.currency || '¥';

        draftCtx.zoomRatio = isNil(sheet.zoomRatio) ? 1 : sheet.zoomRatio;
        draftCtx.rowHeaderWidth =
          mergedSettings.rowHeaderWidth * draftCtx.zoomRatio;
        draftCtx.columnHeaderHeight =
          mergedSettings.columnHeaderHeight * draftCtx.zoomRatio;

        if (!isNil(sheet.defaultRowHeight)) {
          draftCtx.defaultrowlen = Number(sheet.defaultRowHeight);
        } else {
          draftCtx.defaultrowlen = mergedSettings.defaultRowHeight;
        }

        if (!isNil(sheet.addRows)) {
          draftCtx.addDefaultRows = Number(sheet.addRows);
        } else {
          draftCtx.addDefaultRows = mergedSettings.addRows;
        }

        if (!isNil(sheet.defaultColWidth)) {
          draftCtx.defaultcollen = Number(sheet.defaultColWidth);
        } else {
          draftCtx.defaultcollen = mergedSettings.defaultColWidth;
        }

        if (!isNil(sheet.showGridLines)) {
          const { showGridLines } = sheet;
          if (showGridLines === 0 || showGridLines === false) {
            draftCtx.showGridLines = false;
          } else {
            draftCtx.showGridLines = true;
          }
        } else {
          draftCtx.showGridLines = true;
        }
        if (isNil(mergedSettings.lang)) {
          const lang =
            (navigator.languages && navigator.languages[0]) || // chromium
            navigator.language || // 剩余浏览器
            navigator.userLanguage; // IE
          draftCtx.lang = lang;
        }
      },
      { noHistory: true }
    );
  }

  initSheetData(draftCtx, newData, index) {
    const { celldata, row, column } = newData;
    const lastRow = maxBy(celldata, 'r');
    const lastCol = maxBy(celldata, 'c');
    let lastRowNum = (lastRow?.r ?? 0) + 1;
    let lastColNum = (lastCol?.c ?? 0) + 1;
    if (row != null && column != null && row > 0 && column > 0) {
      lastRowNum = Math.max(lastRowNum, row);
      lastColNum = Math.max(lastColNum, column);
    } else {
      lastRowNum = Math.max(lastRowNum, draftCtx.defaultrowNum);
      lastColNum = Math.max(lastColNum, draftCtx.defaultcolumnNum);
    }
    if (lastRowNum && lastColNum) {
      const expandedData = times(lastRowNum, () =>
        times(lastColNum, () => null)
      );
      celldata?.forEach((d) => {
        expandedData[d.r][d.c] = d.v;
      });
      draftCtx.luckysheetfile = produce(draftCtx.luckysheetfile, (d) => {
        d[index].data = expandedData;
        delete d[index].celldata;
        return d;
      });
      return expandedData;
    }
    return null;
  }

  emitOp(ctx, patches, options, undo = false) {
    if (this.cb.onOp) {
      this.cb.onOp(patchToOp(ctx, patches, options, undo));
    }
  }

  dataToCelldata(data) {
    const cellData = [];
    for (let row = 0; row < data?.length; row += 1) {
      for (let col = 0; col < data[row]?.length; col += 1) {
        if (data[row][col] !== null) {
          cellData.push({
            r: row,
            c: col,
            v: data[row][col],
          });
        }
      }
    }
    return cellData;
  }

  reduceUndoList(ctx, ctxBefore) {
    const sheetsId = ctx.luckysheetfile.map((sheet) => sheet.id);
    const sheetDeletedByMe = this.refs.globalCache.undoList
      .filter((undo) => undo.options?.deleteSheetOp)
      .map((item) => item.options?.deleteSheetOp?.id);
    this.refs.globalCache.undoList = this.refs.globalCache.undoList.filter(
      (undo) =>
        undo.options?.deleteSheetOp ||
        undo.options?.id === undefined ||
        indexOf(sheetsId, undo.options?.id) !== -1 ||
        indexOf(sheetDeletedByMe, undo.options?.id) !== -1
    );
    if (ctxBefore.luckysheetfile.length > ctx.luckysheetfile.length) {
      const sheetDeleted = ctxBefore.luckysheetfile
        .filter(
          (oneSheet) =>
            indexOf(
              ctx.luckysheetfile.map((item) => item.id),
              oneSheet.id
            ) === -1
        )
        .map((item) => getSheetIndex(ctxBefore, item.id));
      const deletedIndex = sheetDeleted[0];
      this.refs.globalCache.undoList = this.refs.globalCache.undoList.map(
        (oneStep) => {
          oneStep.patches = oneStep.patches.map((onePatch) => {
            if (
              typeof onePatch.path[1] === 'number' &&
              onePatch.path[1] > deletedIndex
            ) {
              onePatch.path[1] -= 1;
            }
            return onePatch;
          });
          oneStep.inversePatches = oneStep.inversePatches.map((onePatch) => {
            if (
              typeof onePatch.path[1] === 'number' &&
              onePatch.path[1] > deletedIndex
            ) {
              onePatch.path[1] -= 1;
            }
            return onePatch;
          });
          return oneStep;
        }
      );
    }
  }

  setContext = (recipe, options = {}) => {
    const prev = this.ctx;
    const [result, patches, inversePatches] = produceWithPatches(
      this.ctx,
      concatProducer(recipe, triggerGroupValuesRefresh)
    );
    if (patches.length > 0 && !options.noHistory) {
      if (options.logPatch) {
        console.info('patch', patches);
      }
      const filteredPatches = filterPatch(patches);
      let filteredInversePatches = filterPatch(inversePatches);
      if (filteredInversePatches.length > 0) {
        options.id = this.ctx.currentSheetId;
        if (options.deleteSheetOp) {
          const target = this.ctx.luckysheetfile.filter(
            (sheet) => sheet.id === options.deleteSheetOp?.id
          );
          if (target) {
            const index = getSheetIndex(this.ctx, options.deleteSheetOp.id);
            options.deletedSheet = {
              id: options.deleteSheetOp.id,
              index,
              value: cloneDeep(this.ctx.luckysheetfile[index]),
            };
            options.deletedSheet.value.celldata = this.dataToCelldata(
              options.deletedSheet.value.data
            );
            delete options.deletedSheet.value.data;
            options.deletedSheet.value.status = 0;
            filteredInversePatches = [
              {
                op: 'add',
                path: ['luckysheetfile', 0],
                value: options.deletedSheet.value,
              },
            ];
          }
        } else if (options.addSheetOp) {
          options.addSheet = {};
          options.addSheet.id =
            result.luckysheetfile[result.luckysheetfile.length - 1].id;
        }
        this.refs.globalCache.undoList.push({
          patches: filteredPatches,
          inversePatches: filteredInversePatches,
          options,
        });
        this.refs.globalCache.redoList = [];
        this.emitOp(result, filteredPatches, options);
      }
    } else {
      if (patches?.[0]?.value?.length < this.ctx?.luckysheetfile?.length) {
        this.reduceUndoList(result, this.ctx);
      }
    }
    this.ctx = result;
    this.cb.onChange?.(this.ctx.luckysheetfile);
    this.cb.onUpdate?.();
  };

  handleUndo = () => {
    const history = this.refs.globalCache.undoList.pop();
    if (history) {
      this.setContext((ctx_) => {
        if (history.options?.deleteSheetOp) {
          history.inversePatches[0].path[1] = ctx_.luckysheetfile.length;
          const order = history.options.deletedSheet?.value?.order;
          const sheetsRight = ctx_.luckysheetfile.filter(
            (sheet) =>
              sheet?.order >= order &&
              sheet.id !== history?.options?.deleteSheetOp?.id
          );
          forEach(sheetsRight, (sheet) => {
            history.inversePatches.push({
              op: 'replace',
              path: ['luckysheetfile', getSheetIndex(ctx_, sheet.id), 'order'],
              value: sheet?.order + 1,
            });
          });
        }
        const newContext = applyPatches(ctx_, history.inversePatches);
        this.refs.globalCache.redoList.push(history);
        const inversedOptions = inverseRowColOptions(history.options);
        if (inversedOptions?.insertRowColOp) {
          inversedOptions.restoreDeletedCells = true;
        }
        if (history.options?.addSheetOp) {
          const index = getSheetIndex(ctx_, history.options.addSheet.id);
          inversedOptions.addSheet = {
            id: history.options.addSheet.id,
            index,
            value: cloneDeep(ctx_.luckysheetfile[index]),
          };
          inversedOptions.addSheet.value.celldata = this.dataToCelldata(
            inversedOptions.addSheet.value?.data
          );
          delete inversedOptions.addSheet.value.data;
        }
        this.emitOp(newContext, history.inversePatches, inversedOptions, true);
        if (
          history.options?.deleteRowColOp ||
          history.options?.insertRowColOp ||
          history.options?.restoreDeletedCells
        )
          newContext.formulaCache.formulaCellInfoMap = null;
        else
          newContext.formulaCache.updateFormulaCache(
            newContext,
            history,
            'undo'
          );
        return newContext;
      });
    }
  };

  handleRedo = () => {
    const history = this.refs.globalCache.redoList.pop();
    if (history) {
      this.setContext((ctx_) => {
        const newContext = applyPatches(ctx_, history.patches);
        this.refs.globalCache.undoList.push(history);
        this.emitOp(newContext, history.patches, history.options);
        if (
          history.options?.deleteRowColOp ||
          history.options?.insertRowColOp ||
          history.options?.restoreDeletedCells
        )
          newContext.formulaCache.formulaCellInfoMap = null;
        else
          newContext.formulaCache.updateFormulaCache(
            newContext,
            history,
            'redo'
          );
        return newContext;
      });
    }
  };
}
