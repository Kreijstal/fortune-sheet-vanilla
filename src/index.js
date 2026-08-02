/**
 * fortune-sheet-vanilla: a drop-in, React-free spreadsheet component.
 *
 * This is a plain-JavaScript port of the UI shell of fortune-sheet
 * (https://github.com/ruilisi/fortune-sheet). The entire spreadsheet engine
 * lives in @fortune-sheet/core, which is already React-free; this package
 * replaces the React wrappers (Workbook / Sheet / SheetOverlay / SheetTab)
 * with plain DOM.
 *
 * MIT license, same as the upstream project.
 */
import _ from 'lodash-es';
import {
  getSheetIndex,
  handleFormulaInput,
  updateCell,
  addSheet,
} from './core/index.js';
import cssText from './style.js';
import { Store } from './store.js';
import { redraw } from './renderer.js';
import { syncOverlay, updateSheetSize, createOverlayState } from './sync.js';
import { bindEvents } from './events.js';
import { generateAPIs } from './api.js';

const injectedKey = '__fortuneSheetVanillaCSS';

function injectCSS() {
  if (globalThis[injectedKey]) return;
  globalThis[injectedKey] = true;
  const style = document.createElement('style');
  style.setAttribute('data-fortune-sheet', 'vanilla');
  style.textContent = cssText;
  document.head.appendChild(style);
}

/**
 * @typedef {Object} FortuneSheetOptions
 * @property {Array<object>} data Initial workbook data (array of sheets, same
 *   format as @fortune-sheet/core expects: `name`, `celldata` or `data`,
 *   `config`, ...).
 * @property {Function} [onChange] Called with the full workbook data on every change.
 * @property {Function} [onOp] Called with collaboration ops on every change.
 * Any other key is passed through as a fortune-sheet setting (row, column,
 * allowEdit, lang, rowHeaderWidth, columnHeaderHeight, ...).
 */

export class FortuneSheet {
  /**
   * @param {HTMLElement} container
   * @param {FortuneSheetOptions} options
   */
  constructor(container, options) {
    if (!(container instanceof HTMLElement)) {
      throw new Error(
        "FortuneSheet: container must be a DOM element (e.g. document.getElementById('sheet'))"
      );
    }
    this.container = container;
    this.destroyed = false;
    injectCSS();

    const { data, ...settings } = options;
    this.store = new Store(settings, {
      onUpdate: () => this.sync(),
      onChange: (d) => options.onChange?.(d),
      onOp: (op) => options.onOp?.(op),
    });

    this.buildDom();
    this.buildOverlay();

    // wire refs
    this.store.refs.canvas.current = this.dom.canvas;
    this.store.refs.cellArea.current = this.overlay.cellArea;
    this.store.refs.workbookContainer.current = this.dom.container;
    this.store.refs.cellInput.current = this.overlay.editor;
    this.store.refs.scrollbarX.current = this.overlay.scrollbarX;
    this.store.refs.scrollbarY.current = this.overlay.scrollbarY;

    this.state = createOverlayState();

    // editor events (formula highlighting on input)
    this.wireEditor();

    // global events (wheel / mouse / keyboard / paste / resize)
    this.unbind = bindEvents(this.store, this.overlay, this.dom, () =>
      this.redraw()
    );

    // initialize data
    this.store.init(_.cloneDeep(data));

    // size the canvas from the container, then draw
    requestAnimationFrame(() => {
      if (this.destroyed) return;
      updateSheetSize(this.store, this.overlay, this.dom.sheetContainer);
      this.sync();
    });

    // expose API
    this.apiRef = generateAPIs(
      this.store,
      this.overlay.editor,
      this.overlay.scrollbarX,
      this.overlay.scrollbarY
    );
  }

  // ---------------------------------------------------------------- public

  /** The full workbook data (sheets with expanded `data` matrices). */
  getData() {
    return this.store.ctx.luckysheetfile;
  }

  /** Data of the currently active sheet. */
  getSheetData() {
    const idx = getSheetIndex(this.store.ctx, this.store.ctx.currentSheetId);
    return this.store.ctx.luckysheetfile[idx];
  }

  /** Replace the workbook data. */
  setData(data) {
    this.store.init(_.cloneDeep(data));
    this.sync();
  }

  undo() {
    this.store.handleUndo();
  }

  redo() {
    this.store.handleRedo();
  }

  /** Programmatic context update (advanced users). */
  setContext(recipe, options) {
    this.store.setContext(recipe, options);
  }

  destroy() {
    this.destroyed = true;
    this.unbind?.();
    this.container.innerHTML = '';
  }

  // -------------------------------------------------------------- internal

  buildDom() {
    const container = document.createElement('div');
    container.className = 'fortune-container';
    container.tabIndex = 0;

    const sheetContainer = document.createElement('div');
    sheetContainer.className = 'fortune-sheet-container';
    sheetContainer.style.position = 'relative';
    container.appendChild(sheetContainer);

    const canvas = document.createElement('canvas');
    canvas.className = 'fortune-sheet-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    sheetContainer.appendChild(canvas);

    this.container.appendChild(container);
    this.dom = { container, sheetContainer, canvas };
  }

  buildOverlay() {
    const overlayEl = document.createElement('div');
    overlayEl.className = 'fortune-sheet-overlay';
    overlayEl.tabIndex = -1;
    this.dom.sheetContainer.appendChild(overlayEl);

    // column header zone (transparent, for clicks; the header itself is
    // painted on the canvas)
    const colHeader = document.createElement('div');
    colHeader.className = 'fortune-col-header-wrap';
    colHeader.style.position = 'absolute';
    colHeader.style.top = '0';
    colHeader.style.left = '46px';
    colHeader.style.right = '0';
    colHeader.style.height = '20px';
    overlayEl.appendChild(colHeader);

    const leftTop = document.createElement('div');
    leftTop.className = 'fortune-left-top';
    leftTop.style.position = 'absolute';
    leftTop.style.left = '0';
    leftTop.style.top = '0';
    overlayEl.appendChild(leftTop);

    const rowHeader = document.createElement('div');
    rowHeader.className = 'fortune-row-header';
    rowHeader.style.position = 'absolute';
    rowHeader.style.left = '0';
    rowHeader.style.top = '20px';
    rowHeader.style.bottom = '0';
    rowHeader.style.width = '45px';
    overlayEl.appendChild(rowHeader);

    // cell area
    const cellArea = document.createElement('div');
    cellArea.className = 'fortune-cell-area';
    cellArea.style.position = 'absolute';
    overlayEl.appendChild(cellArea);

    const focusBox = document.createElement('div');
    focusBox.className = 'luckysheet-cell-selected-focus';
    cellArea.appendChild(focusBox);

    // input box (cell editor)
    const inputBox = document.createElement('div');
    inputBox.className = 'luckysheet-input-box';
    inputBox.style.left = '-10000px';
    inputBox.style.top = '-10000px';
    const inputBoxInner = document.createElement('div');
    inputBoxInner.className = 'luckysheet-input-box-inner';
    const editor = document.createElement('div');
    editor.className = 'luckysheet-cell-input';
    editor.id = 'luckysheet-rich-text-editor';
    editor.contentEditable = 'true';
    editor.setAttribute('spellcheck', 'false');
    editor.tabIndex = 0;
    inputBoxInner.appendChild(editor);
    inputBox.appendChild(inputBoxInner);
    cellArea.appendChild(inputBox);
    inputBox.addEventListener('mousedown', (e) => e.stopPropagation());
    inputBox.addEventListener('mouseup', (e) => e.stopPropagation());

    // scrollbars (their scroll events drive ctx.scrollLeft/scrollTop)
    const scrollbarX = document.createElement('div');
    scrollbarX.className =
      'luckysheet-scrollbars luckysheet-scrollbar-ltr luckysheet-scrollbar-x';
    scrollbarX.style.left = '46px';
    scrollbarX.style.width = 'calc(100% - 46px)';
    scrollbarX.appendChild(document.createElement('div'));
    scrollbarX.addEventListener('mousedown', (e) => e.stopPropagation());
    scrollbarX.addEventListener('scroll', () => {
      this.store.setContext((draftCtx) => {
        draftCtx.scrollLeft = scrollbarX.scrollLeft;
      });
    });
    cellArea.appendChild(scrollbarX);

    const scrollbarY = document.createElement('div');
    scrollbarY.className =
      'luckysheet-scrollbars luckysheet-scrollbar-ltr luckysheet-scrollbar-y';
    scrollbarY.style.height = '100%';
    scrollbarY.appendChild(document.createElement('div'));
    scrollbarY.addEventListener('mousedown', (e) => e.stopPropagation());
    scrollbarY.addEventListener('scroll', () => {
      this.store.setContext((draftCtx) => {
        draftCtx.scrollTop = scrollbarY.scrollTop;
      });
    });
    cellArea.appendChild(scrollbarY);

    // tabs
    const tabBar = document.createElement('div');
    tabBar.className = 'luckysheet-sheet-area luckysheet-noselected-text';
    tabBar.id = 'luckysheet-sheet-area';
    const addBtn = document.createElement('div');
    addBtn.className = 'fortune-sheettab-button fortune-sheettab-add';
    addBtn.title = 'New sheet';
    addBtn.textContent = '+';
    addBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    addBtn.addEventListener('click', () => {
      const cellInput = this.store.refs.cellInput.current;
      this.store.setContext(
        (draftCtx) => {
          if (draftCtx.luckysheetCellUpdate.length > 0 && cellInput) {
            updateCell(
              draftCtx,
              draftCtx.luckysheetCellUpdate[0],
              draftCtx.luckysheetCellUpdate[1],
              cellInput
            );
          }
          addSheet(draftCtx, this.store.settings);
        },
        { addSheetOp: true }
      );
    });
    tabBar.appendChild(addBtn);
    const tabContainer = document.createElement('div');
    tabContainer.className = 'fortune-sheettab-container-c';
    tabContainer.id = 'fortune-sheettab-container-c';
    tabBar.appendChild(tabContainer);
    this.dom.container.appendChild(tabBar);

    // stat bar
    const statBar = document.createElement('div');
    statBar.className = 'fortune-stat-area';
    this.dom.container.appendChild(statBar);

    this.overlay = {
      container: overlayEl,
      cellArea,
      focusBox,
      inputBox,
      editor,
      scrollbarX,
      scrollbarY,
      tabBar,
      tabContainer,
      statBar,
    };
    this.dom.colHeader = colHeader;
    this.dom.rowHeader = rowHeader;
    this.dom.leftTop = leftTop;
  }

  wireEditor() {
    const editor = this.overlay.editor;
    let lastKeyCode = 0;
    let preText = '';
    editor.addEventListener('keydown', (e) => {
      lastKeyCode = e.keyCode;
      preText = editor.innerText;
    });
    editor.addEventListener('input', () => {
      const fxInput = this.store.refs.fxInput.current;
      try {
        this.store.setContext((draftCtx) => {
          handleFormulaInput(draftCtx, fxInput, editor, lastKeyCode, preText);
        });
      } catch (err) {
        console.error(err);
      }
    });
    editor.addEventListener('paste', (e) => {
      if (this.store.ctx.luckysheetCellUpdate.length === 0) {
        e.preventDefault();
      }
    });
  }

  /** called after every context update */
  sync() {
    if (this.destroyed) return;
    const ctx = this.store.ctx;
    const overlay = this.overlay;
    const zoom = ctx.zoomRatio || 1;

    overlay.cellArea.style.width = `${ctx.cellmainWidth}px`;
    overlay.cellArea.style.height = `${ctx.cellmainHeight}px`;
    overlay.cellArea.style.left = `${ctx.rowHeaderWidth}px`;
    overlay.cellArea.style.top = `${ctx.columnHeaderHeight}px`;
    this.dom.colHeader.style.left = `${ctx.rowHeaderWidth}px`;
    this.dom.colHeader.style.height = `${ctx.columnHeaderHeight}px`;
    this.dom.leftTop.style.width = `${ctx.rowHeaderWidth - 1.5}px`;
    this.dom.leftTop.style.height = `${ctx.columnHeaderHeight - 1.5}px`;
    this.dom.rowHeader.style.top = `${ctx.columnHeaderHeight}px`;
    this.dom.rowHeader.style.width = `${ctx.rowHeaderWidth}px`;
    overlay.scrollbarX.style.left = `${ctx.rowHeaderWidth}px`;
    overlay.scrollbarX.style.width = `calc(100% - ${ctx.rowHeaderWidth}px)`;
    overlay.editor.style.transform = `scale(${zoom})`;
    overlay.editor.style.transformOrigin = 'left top';
    overlay.editor.style.width = `${100 / zoom}%`;
    overlay.editor.style.height = `${100 / zoom}%`;

    syncOverlay(this.store, this.overlay, this.state);
    this.redraw();
  }

  redraw() {
    if (this.destroyed) return;
    const canvas = this.store.refs.canvas.current;
    if (!canvas) return;
    redraw(
      canvas,
      this.store.ctx,
      this.store.refs.globalCache,
      this.store.ctx.currentSheetId
    );
  }
}

/**
 * The full engine API and formula parser are re-exported from this package,
 * so everything the original three packages exposed is available from one
 * import:
 *
 *   import { FortuneSheet, api, Canvas, Parser, SUPPORTED_FORMULAS } from 'fortune-sheet-vanilla';
 *
 * Heritage subpaths also work: 'fortune-sheet-vanilla/core' and
 * 'fortune-sheet-vanilla/formula-parser'.
 */
export * from './core/index.js';
export * from './formula-parser/index.js';
export { Store } from './store.js';

/**
 * @typedef {import("./store.js").SetContextOptions} SetContextOptions
 */
