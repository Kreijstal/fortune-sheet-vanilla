import { v4 as uuidv4 } from 'uuid';
/**
 * @type {Required<Settings>}
 */
export const defaultSettings = {
  column: 60,
  row: 84,
  addRows: 50,
  showToolbar: true,
  showFormulaBar: true,
  showSheetTabs: true,
  data: [],
  config: {},
  devicePixelRatio: 0,
  allowEdit: true,
  lang: null,
  forceCalculation: false,
  rowHeaderWidth: 46,
  columnHeaderHeight: 20,
  defaultColWidth: 73,
  defaultRowHeight: 19,
  defaultFontSize: 10,
  toolbarItems: [
    'undo',
    'redo',
    'format-painter',
    'clear-format',
    '|',
    'currency-format',
    'percentage-format',
    'number-decrease',
    'number-increase',
    'format',
    '|',
    'font',
    '|',
    'font-size',
    '|',
    'bold',
    'italic',
    'strike-through',
    'underline',
    '|',
    'font-color',
    'background',
    'border',
    'merge-cell',
    '|',
    'horizontal-align',
    'vertical-align',
    'text-wrap',
    'text-rotation',
    '|',
    'freeze',
    'conditionFormat',
    'filter',
    'link',
    'image',
    'comment',
    'quick-formula',
    'dataVerification',
    'splitColumn',
    'locationCondition',
    'screenshot',
    'search',
  ],
  cellContextMenu: [
    'copy',
    'paste',
    '|',
    'insert-row',
    'insert-column',
    'delete-row',
    'delete-column',
    'delete-cell',
    'hide-row',
    'hide-column',
    'set-row-height',
    'set-column-width',
    '|',
    'clear',
    'sort',
    'orderAZ',
    'orderZA',
    'filter',
    'chart',
    'image',
    'link',
    'data',
    'cell-format', // 设置单元格格式
  ],
  headerContextMenu: [
    'copy',
    'paste',
    '|',
    'insert-row',
    'insert-column',
    'delete-row',
    'delete-column',
    'delete-cell',
    'hide-row',
    'hide-column',
    'set-row-height',
    'set-column-width',
    '|',
    'clear',
    'sort',
    'orderAZ',
    'orderZA', // 降序
  ],
  sheetTabContextMenu: [
    'delete',
    'copy',
    'rename',
    'color',
    'hide',
    '|',
    'move',
    // "focus",
  ],
  filterContextMenu: [
    'sort-by-asc',
    'sort-by-desc',
    '|',
    'filter-by-color',
    '|',
    // "filter-by-condition",
    // "|",
    'filter-by-value',
  ],
  generateSheetId: () => uuidv4(),
  hooks: {},
  customToolbarItems: [],
  currency: '¥',
};

/**
 * @typedef {{
    beforeUpdateCell?: (r: number, c: number, value: any) => boolean} Hooks
 */

/**
 * @typedef {{
    column?: number;
    row?: number;
    addRows?: number;
    allowEdit?: boolean;
    showToolbar?: boolean;
    showFormulaBar?: boolean;
    showSheetTabs?: boolean;
    data: Sheet[];
    config?: any;
    devicePixelRatio?: number;
    lang?: string | null;
    forceCalculation?: boolean;
    rowHeaderWidth?: number;
    columnHeaderHeight?: number;
    defaultColWidth?: number;
    defaultRowHeight?: number;
    defaultFontSize?: number;
    toolbarItems?: string[];
    cellContextMenu?: string[];
    headerContextMenu?: string[];
    sheetTabContextMenu?: string[];
    filterContextMenu?: string[];
    generateSheetId?: () => string} Settings
 */

/**
 * @typedef {import("./types.js").Sheet} Sheet
 * @typedef {import("./types.js").Selection} Selection
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").Cell} Cell
 */
