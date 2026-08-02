/**
 * Imperative DOM sync: after every context change we update the DOM overlays
 * that React used to render declaratively (selection boxes, input box,
 * scrollbars, sheet tabs, stat bar).
 *
 * Ported from @fortune-sheet/react SheetOverlay / SheetTab / InputBox (MIT).
 */
import _ from 'lodash-es';
import {
  getSheetIndex,
  getFlowdata,
  getStyleByCell,
  fixRowStyleOverflowInFreeze,
  fixColumnStyleOverflowInFreeze,
  moveToEnd,
  locale,
  calcSelectionInfo,
  addSheet,
  editSheetName,
  updateCell,
  createDropCellRange,
  onCellsMoveStart,
  cancelActiveImgItem,
  cancelNormalSelected,
  updateContextWithCanvas,
  updateContextWithSheetData,
  escapeHTMLTag,
  escapeScriptTag,
} from './core/index.js';

function escapeHTML(v) {
  return escapeHTMLTag(escapeScriptTag(v));
}

function statItem(text, width) {
  const div = document.createElement('div');
  if (width) div.style.width = width;
  div.textContent = text;
  return div;
}

/** per-instance state for things that shouldn't be recomputed every frame */
export function createOverlayState() {
  return {
    editKey: null, // "r,c" of the cell currently being edited
    lastEditorText: '',
    scrollX: 0, // last ctx.scrollLeft we wrote to the scrollbar div
    scrollY: 0, // last ctx.scrollTop we wrote to the scrollbar div
  };
}

export function syncOverlay(store, overlay, state) {
  const ctx = store.ctx;
  const cache = store.refs.globalCache;

  // ---------- scrollbars ----------
  // Only write when the context value actually changed, otherwise we would
  // clobber the scroll position that handleGlobalWheel set on the div while
  // ctx.scrollLeft is still its old value.
  if (ctx.scrollLeft !== state.scrollX) {
    overlay.scrollbarX.scrollLeft = ctx.scrollLeft;
    state.scrollX = ctx.scrollLeft;
  }
  if (ctx.scrollTop !== state.scrollY) {
    overlay.scrollbarY.scrollTop = ctx.scrollTop;
    state.scrollY = ctx.scrollTop;
  }
  const spacerX = overlay.scrollbarX.firstElementChild;
  if (spacerX) {
    spacerX.style.width = `${ctx.ch_width}px`;
    spacerX.style.height = '10px';
  }
  const spacerY = overlay.scrollbarY.firstElementChild;
  if (spacerY) {
    spacerY.style.width = '10px';
    spacerY.style.height = `${ctx.rh_height}px`;
  }

  // ---------- selection layer ----------
  syncSelectionLayer(store, overlay);

  // ---------- input box ----------
  syncInputBox(store, overlay, state);

  // ---------- tabs ----------
  renderTabs(store, overlay);

  // ---------- stat bar ----------
  let calInfo = { numberC: 0, count: 0, sum: 0, max: 0, min: 0, average: '' };
  try {
    if (ctx.luckysheet_select_save?.length > 0) {
      calInfo = calcSelectionInfo(ctx, ctx.lang);
    }
  } catch (e) {
    console.error('calcSelectionInfo', e);
  }
  const formula = locale(ctx).formula;
  overlay.statBar.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'luckysheet-sheet-selection-calInfo';
  if (calInfo.count)
    wrap.appendChild(statItem(`${formula.count}: ${calInfo.count}`, '60px'));
  if (calInfo.numberC && calInfo.sum)
    wrap.appendChild(statItem(`${formula.sum}: ${calInfo.sum}`));
  if (calInfo.numberC && calInfo.average)
    wrap.appendChild(statItem(`${formula.average}: ${calInfo.average}`));
  if (calInfo.numberC && calInfo.max)
    wrap.appendChild(statItem(`${formula.max}: ${calInfo.max}`));
  if (calInfo.numberC && calInfo.min)
    wrap.appendChild(statItem(`${formula.min}: ${calInfo.min}`));
  overlay.statBar.appendChild(wrap);
}

function syncSelectionLayer(store, overlay) {
  const ctx = store.ctx;
  const cache = store.refs.globalCache;
  const freeze = cache.freezen?.[ctx.currentSheetId];
  const selections = ctx.luckysheet_select_save || [];

  // focus box (the "active cell" marker)
  const focus = overlay.focusBox;
  if (selections.length > 0) {
    const selection = _.last(selections);
    Object.assign(focus.style, {
      left: `${selection.left}px`,
      top: `${selection.top}px`,
      width: `${selection?.width || 0}px`,
      height: `${selection?.height || 0}px`,
      display: 'block',
    });
    Object.assign(
      focus.style,
      fixRowStyleOverflowInFreeze(
        ctx,
        selection.row_focus || 0,
        selection.row_focus || 0,
        freeze
      ),
      fixColumnStyleOverflowInFreeze(
        ctx,
        selection.column_focus || 0,
        selection.column_focus || 0,
        freeze
      )
    );
  } else {
    focus.style.display = 'none';
  }

  // remove old selection boxes
  const oldBoxs = overlay.cellArea.querySelector(
    '#luckysheet-cell-selected-boxs'
  );
  if (oldBoxs) oldBoxs.remove();
  if (selections.length > 0) {
    const boxs = document.createElement('div');
    boxs.id = 'luckysheet-cell-selected-boxs';
    selections.forEach((selection) => {
      const div = document.createElement('div');
      div.id = 'luckysheet-cell-selected';
      div.className = 'luckysheet-cell-selected';
      Object.assign(div.style, {
        left: `${selection.left_move}px`,
        top: `${selection.top_move}px`,
        width: `${selection?.width_move || 0}px`,
        height: `${selection?.height_move || 0}px`,
        display: 'block',
      });
      Object.assign(
        div.style,
        fixRowStyleOverflowInFreeze(
          ctx,
          selection.row[0],
          selection.row[1],
          freeze
        ),
        fixColumnStyleOverflowInFreeze(
          ctx,
          selection.column[0],
          selection.column[1],
          freeze
        )
      );
      const inner = document.createElement('div');
      inner.className = 'luckysheet-cs-inner-border';
      div.appendChild(inner);
      const fill = document.createElement('div');
      fill.className = 'luckysheet-cs-fillhandle';
      fill.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        store.setContext((draftCtx) => {
          createDropCellRange(draftCtx, e, overlay.cellArea);
        });
      });
      div.appendChild(fill);
      const inner2 = document.createElement('div');
      inner2.className = 'luckysheet-cs-inner-border';
      div.appendChild(inner2);
      // drag the whole selection (move cells)
      div.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        store.setContext((draftCtx) => {
          onCellsMoveStart(
            draftCtx,
            cache,
            e,
            overlay.scrollbarX,
            overlay.scrollbarY,
            overlay.cellArea
          );
        });
      });
      boxs.appendChild(div);
    });
    overlay.cellArea.appendChild(boxs);
  }

  // copy / drag range dashed boxes
  const oldCopy = overlay.cellArea.querySelector('#fortune-selection-copy');
  if (oldCopy) oldCopy.remove();
  if ((ctx.luckysheet_selection_range?.length ?? 0) > 0) {
    const layer = document.createElement('div');
    layer.id = 'fortune-selection-copy';
    ctx.luckysheet_selection_range.forEach((range) => {
      const r1 = range.row[0];
      const r2 = range.row[1];
      const c1 = range.column[0];
      const c2 = range.column[1];
      const row = ctx.visibledatarow[r2];
      const rowPre = r1 - 1 === -1 ? 0 : ctx.visibledatarow[r1 - 1];
      const col = ctx.visibledatacolumn[c2];
      const colPre = c1 - 1 === -1 ? 0 : ctx.visibledatacolumn[c1 - 1];
      const div = document.createElement('div');
      div.className = 'fortune-selection-copy';
      div.style.left = `${colPre}px`;
      div.style.width = `${col - colPre - 1}px`;
      div.style.top = `${rowPre}px`;
      div.style.height = `${row - rowPre - 1}px`;
      ['top', 'right', 'bottom', 'left'].forEach((d) => {
        const c = document.createElement('div');
        c.className = `fortune-selection-copy-${d} fortune-copy`;
        div.appendChild(c);
      });
      const hc = document.createElement('div');
      hc.className = 'fortune-selection-copy-hc';
      div.appendChild(hc);
      layer.appendChild(div);
    });
    overlay.cellArea.appendChild(layer);
  }
}

export function syncInputBox(store, overlay, state) {
  const ctx = store.ctx;
  const cache = store.refs.globalCache;
  const firstSelection = ctx.luckysheet_select_save?.[0];
  const editing = ctx.luckysheetCellUpdate.length > 0;

  if (!editing) {
    overlay.inputBox.style.left = '-10000px';
    overlay.inputBox.style.top = '-10000px';
    state.editKey = null;
    return;
  }

  const rowIndex = firstSelection?.row_focus;
  const colIndex = firstSelection?.column_focus;
  const key = `${rowIndex},${colIndex}`;

  Object.assign(overlay.inputBox.style, {
    left: `${firstSelection.left}px`,
    top: `${firstSelection.top}px`,
    zIndex: '19',
    display: 'block',
  });

  const inner = overlay.inputBox.firstElementChild;
  if (inner) {
    const flowdata = getFlowdata(ctx);
    const boxStyle = flowdata
      ? getStyleByCell(ctx, flowdata, rowIndex, colIndex)
      : {};
    Object.assign(inner.style, {
      minWidth: `${firstSelection?.width || 0}px`,
      minHeight: `${firstSelection?.height || 0}px`,
      ...boxStyle,
    });
  }

  // load the cell value into the editor the first time a cell is edited
  if (state.editKey !== key) {
    state.editKey = key;
    const flowdata = getFlowdata(ctx);
    const cell = flowdata?.[rowIndex]?.[colIndex];
    let value = '';
    if (cell && !cache.overwriteCell) {
      value = cell.f ? cell.f : cell.v != null ? String(cell.v) : '';
    }
    cache.overwriteCell = false;
    overlay.editor.innerHTML = escapeHTML(value);
    state.lastEditorText = overlay.editor.innerText;
    setTimeout(() => {
      overlay.editor.focus();
      moveToEnd(overlay.editor);
    });
  } else {
    state.lastEditorText = overlay.editor.innerText;
  }
}

export function renderTabs(store, overlay) {
  const ctx = store.ctx;
  const container = overlay.tabContainer;
  container.innerHTML = '';
  const sorted = _.sortBy(ctx.luckysheetfile, (s) => Number(s.order));
  sorted.forEach((sheet) => {
    if (sheet.hide === 1) return;
    container.appendChild(createTabItem(store, overlay, sheet));
  });
}

function createTabItem(store, overlay, sheet) {
  const ctx = store.ctx;
  const div = document.createElement('div');
  div.className = `luckysheet-sheets-item${
    ctx.currentSheetId === sheet.id ? ' luckysheet-sheets-item-active' : ''
  }`;
  div.setAttribute('role', 'button');
  div.tabIndex = 0;

  const name = document.createElement('span');
  name.className = 'luckysheet-sheets-item-name';
  name.spellcheck = false;
  name.textContent = sheet.name;
  name.contentEditable = 'false';
  name.addEventListener('dblclick', () => {
    if (ctx.allowEdit === false) return;
    name.contentEditable = 'true';
    name.focus();
    const range = document.createRange();
    range.selectNodeContents(name);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });
  name.addEventListener('blur', () => {
    if (name.contentEditable !== 'true') return;
    name.contentEditable = 'false';
    store.setContext((draftCtx) => {
      try {
        editSheetName(draftCtx, name);
      } catch (e) {
        console.error(e.message);
      }
    });
  });
  name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      name.blur();
    }
    e.stopPropagation();
  });
  div.appendChild(name);

  div.addEventListener('click', () => {
    store.setContext((draftCtx) => {
      draftCtx.sheetScrollRecord[draftCtx.currentSheetId] = {
        scrollLeft: draftCtx.scrollLeft,
        scrollTop: draftCtx.scrollTop,
        luckysheet_select_status: draftCtx.luckysheet_select_status,
        luckysheet_select_save: draftCtx.luckysheet_select_save,
        luckysheet_selection_range: draftCtx.luckysheet_selection_range,
      };
      draftCtx.dataVerificationDropDownList = false;
      draftCtx.currentSheetId = sheet.id;
      draftCtx.zoomRatio = sheet.zoomRatio || 1;
      cancelActiveImgItem(draftCtx, store.refs.globalCache);
      cancelNormalSelected(draftCtx);
    });
  });

  if (sheet.color) {
    const color = document.createElement('div');
    color.className = 'luckysheet-sheets-item-color';
    color.style.background = sheet.color;
    div.appendChild(color);
  }
  return div;
}

/**
 * (Re)measure the sheet container and size the canvas accordingly.
 * `measureEl` is the sheet container div (100% x 100% of the sheet area).
 */
export function updateSheetSize(store, overlay, measureEl) {
  const canvas = store.refs.canvas.current;
  if (!canvas || !measureEl) return;
  const sheetIndex = getSheetIndex(store.ctx, store.ctx.currentSheetId);
  const data = store.ctx.luckysheetfile[sheetIndex]?.data;
  store.setContext(
    (draftCtx) => {
      if (data) updateContextWithSheetData(draftCtx, data);
      updateContextWithCanvas(draftCtx, canvas, measureEl);
    },
    { noHistory: true }
  );
}
