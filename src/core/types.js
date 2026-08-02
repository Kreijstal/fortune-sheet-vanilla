export {};

/**
 * @typedef {Object} Op
 * @property {"replace" | "remove" | "add" | "insertRowCol" | "deleteRowCol" | "addSheet" | "deleteSheet"} op
 * @property {string} [id]
 * @property {Array<string | number>} path
 * @property {any} [value]
 */

/**
 * @typedef {Object} Rect
 * @property {number} top
 * @property {number} left
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} CellStyle
 * @property {number} [bl]
 * @property {number} [it]
 * @property {number | string} [ff]
 * @property {number} [fs]
 * @property {string} [fc]
 * @property {number} [ht]
 * @property {number} [vt]
 * @property {string} [tb]
 * @property {number} [cl]
 * @property {number} [un]
 * @property {string} [tr]
 */

/**
 * @typedef {{
    v?: string | number | boolean;
    m?: string | number;
    mc?: {
        r: number;
        c: number;
        rs?: number;
        cs?: number;
    };
    f?: string;
    ct?: {
        fa?: string;
        t?: string;
        s?: any;
    };
    qp?: number;
    spl?: any;
    bg?: string;
    lo?: number;
    rt?: number;
    ps?: {
        left: number | null;
        top: number | null;
        width: number | null;
        height: number | null;
        value: string;
        isShow: boolean;
    };
    hl?: {
        r: number;
        c: number;
        id: string;
    };
} & CellStyle} Cell
 */

/**
 * @typedef {Object} CellWithRowAndCol
 * @property {number} r
 * @property {number} c
 * @property {Cell | null} v
 */

/**
 * @typedef {Array<Array<Cell | null>>} CellMatrix
 */

/**
 * @typedef {Object} Selection
 * @property {number} [left]
 * @property {number} [width]
 * @property {number} [top]
 * @property {number} [height]
 * @property {number} [left_move]
 * @property {number} [width_move]
 * @property {number} [top_move]
 * @property {number} [height_move]
 * @property {Array<number>} row
 * @property {Array<number>} column
 * @property {number} [row_focus]
 * @property {number} [column_focus]
 * @property {{
        x: number;
        y: number;
    }} [moveXY]
 * @property {boolean} [row_select]
 * @property {boolean} [column_select]
 */

/**
 * @typedef {Object} Presence
 * @property {string} sheetId
 * @property {string} username
 * @property {string} [userId]
 * @property {string} color
 * @property {{
        r: number;
        c: number;
    }} selection
 */

/**
 * @typedef {Object} SheetConfig
 * @property {Record<string, {
        r: number;
        c: number;
        rs: number;
        cs: number;
    }>} [merge]
 * @property {Record<string, number>} [rowlen]
 * @property {Record<string, number>} [columnlen]
 * @property {Record<string, number>} [rowhidden]
 * @property {Record<string, number>} [colhidden]
 * @property {Record<string, number>} [customHeight]
 * @property {Record<string, number>} [customWidth]
 * @property {Array<any>} [borderInfo]
 * @property {any} [authority]
 * @property {Record<number, number>} [rowReadOnly]
 * @property {Record<number, number>} [colReadOnly]
 */

/**
 * @typedef {Object} Image
 * @property {string} id
 * @property {number} width
 * @property {number} height
 * @property {number} left
 * @property {number} top
 * @property {string} src
 */

/**
 * @typedef {Object} Sheet
 * @property {string} name
 * @property {SheetConfig} [config]
 * @property {number} [order]
 * @property {string} [color]
 * @property {CellMatrix} [data]
 * @property {Array<CellWithRowAndCol>} [celldata]
 * @property {string} [id]
 * @property {Array<Image>} [images]
 * @property {number} [zoomRatio]
 * @property {number} [column]
 * @property {number} [row]
 * @property {number} [addRows]
 * @property {number} [status]
 * @property {number} [hide]
 * @property {Array<Selection>} [luckysheet_select_save]
 * @property {Array<{
        row: number[];
        column: number[];
    }>} [luckysheet_selection_range]
 * @property {Array<any>} [calcChain]
 * @property {number} [defaultRowHeight]
 * @property {number} [defaultColWidth]
 * @property {boolean | number} [showGridLines]
 * @property {any} [pivotTable]
 * @property {boolean} [isPivotTable]
 * @property {Record<string, any>} [filter]
 * @property {{
        row: number[];
        column: number[];
    }} [filter_select]
 * @property {Array<any>} [luckysheet_conditionformat_save]
 * @property {Array<any>} [luckysheet_alternateformat_save]
 * @property {any} [dataVerification]
 * @property {Record<string, {
        linkType: string;
        linkAddress: string;
    }>} [hyperlink]
 * @property {any} [dynamicArray_compute]
 * @property {Array<any>} [dynamicArray]
 * @property {{
        type: "row" | "column" | "both" | "rangeRow" | "rangeColumn" | "rangeBoth";
        range?: {
            row_focus: number;
            column_focus: number;
        };
    }} [frozen]
 */

/**
 * @typedef {{
    r: number;
    c: number;
    rc: string;
    autoFocus: boolean;
    value: string;
    size: {
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
    } & Rect;
} & Rect} CommentBox
 */

/**
 * @typedef {Object} SearchResult
 * @property {number} r
 * @property {number} c
 * @property {string} sheetName
 * @property {string} sheetId
 * @property {string} cellPosition
 * @property {string} value
 */

/**
 * @typedef {Object} LinkCardProps
 * @property {string} sheetId
 * @property {number} r
 * @property {number} c
 * @property {string} rc
 * @property {string} originText
 * @property {string} originType
 * @property {string} originAddress
 * @property {{
        cellLeft: number;
        cellBottom: number;
    }} position
 * @property {boolean} isEditing
 * @property {boolean} [selectingCellRange]
 */

/**
 * @typedef {Object} RangeDialogProps
 * @property {boolean} show
 * @property {string} rangeTxt
 * @property {string} type
 * @property {boolean} singleSelect
 */

/**
 * @typedef {Object} DataRegulationProps
 * @property {string} type
 * @property {string} type2
 * @property {string} rangeTxt
 * @property {string} value1
 * @property {string} value2
 * @property {string} validity
 * @property {boolean} remote
 * @property {boolean} prohibitInput
 * @property {boolean} hintShow
 * @property {string} hintValue
 */

/**
 * @typedef {Object} ConditionRulesProps
 * @property {string} rulesType
 * @property {string} rulesValue
 * @property {{
        check: boolean;
        color: string;
    }} textColor
 * @property {{
        check: boolean;
        color: string;
    }} cellColor
 * @property {{
        value1: string;
        value2: string;
    }} betweenValue
 * @property {string} dateValue
 * @property {string} repeatValue
 * @property {string} projectValue
 */

/**
 * @typedef {Object} FilterOptions
 * @property {number} startRow
 * @property {number} endRow
 * @property {number} startCol
 * @property {number} endCol
 * @property {number} left
 * @property {number} top
 * @property {number} width
 * @property {number} height
 * @property {Array<{
        col: number;
        left: number;
        top: number;
    }>} items
 */

/**
 * @typedef {Object} History
 * @property {Array<ImmerPatch>} patches
 * @property {Array<ImmerPatch>} inversePatches
 * @property {PatchOptions} [options]
 */

/**
 * @typedef {Object} Freezen
 * @property {{
        freezenhorizontaldata: any[];
        top: number;
    }} [horizontal]
 * @property {{
        freezenverticaldata: any[];
        left: number;
    }} [vertical]
 */

/**
 * @typedef {Object} GlobalCache
 * @property {boolean} [verticalScrollLock]
 * @property {boolean} [horizontalScrollLock]
 * @property {boolean} [overwriteCell]
 * @property {boolean} [ignoreWriteCell]
 * @property {boolean} [doNotFocus]
 * @property {boolean} [doNotUpdateCell]
 * @property {string} [recentTextColor]
 * @property {string} [recentBackgroundColor]
 * @property {Array<number>} [visibleColumnsUnique]
 * @property {Array<number>} [visibleRowsUnique]
 * @property {Array<History>} undoList
 * @property {Array<History>} redoList
 * @property {HTMLDivElement} [editingCommentBoxEle]
 * @property {Record<string, Freezen>} [freezen]
 * @property {{
        imgInitialPosition: Rect | undefined;
        cursorMoveStartPosition: {
            x: number;
            y: number;
        } | undefined;
        resizingSide: string | undefined;
    }} [image]
 * @property {{
        movingId: string | undefined;
        resizingId: string | undefined;
        resizingSide: string | undefined;
        commentRC: {
            r: number;
            c: number;
            rc: string;
        };
        boxInitialPosition: Rect | undefined;
        cursorMoveStartPosition: {
            x: number;
            y: number;
        } | undefined;
    }} [commentBox]
 * @property {{
        mouseEnter?: boolean;
        moveProps?: {
            initialPosition: Rect | undefined;
            cursorMoveStartPosition: {
                x: number;
                y: number;
            } | undefined;
        };
    }} [searchDialog]
 * @property {{
        mouseEnter?: boolean;
        rangeSelectionModal?: {
            initialPosition: Rect | undefined;
            cursorMoveStartPosition: {
                x: number;
                y: number;
            } | undefined;
        };
    }} [linkCard]
 * @property {{
        x: number;
        y: number;
    }} [dragCellStartPos]
 * @property {boolean} [touchMoveStatus]
 * @property {boolean} [touchHandleStatus]
 * @property {{
        x: number;
        y: number;
        vy: number;
        moveType: string;
        vy_x?: number;
        vy_y?: number;
        scrollTop?: number;
        scrollLeft?: number;
    }} [touchMoveStartPos]
 */

/**
 * @typedef {Object} SingleRange
 * @property {Array<number>} row
 * @property {Array<number>} column
 */

/**
 * @typedef {Array<SingleRange>} Range
 */

/**
 * @typedef {Object} FormulaDependency
 * @property {[number, number]} row
 * @property {[number, number]} column
 * @property {string | undefined} sheetId
 */

/**
 * @typedef {Object} FormulaCellInfo
 * @property {Array<FormulaDependency>} formulaDependency
 * @property {string} calc_funcStr
 * @property {string} key
 * @property {number} r
 * @property {number} c
 * @property {string} id
 * @property {AncestorFormulaCell} parents
 * @property {AncestorFormulaCell} chidren
 * @property {string} color
 */

/**
 * @typedef {Object} FormulaCellInfoMap
 * @property {Object.<string, FormulaCellInfo>} [rxcxix: string]
 */

/**
 * @typedef {Object} FormulaCell
 * @property {number} r
 * @property {number} c
 * @property {string} id
 * @property {AncestorFormulaCell} [parent]
 * @property {[boolean, number, string]} [func]
 * @property {string} [color]
 * @property {AncestorFormulaCell} [chidren]
 * @property {number} [times]
 */

/**
 * @typedef {Object} AncestorFormulaCell
 */

/**
 * @typedef {import("immer").ImmerPatch} ImmerPatch
 * @typedef {import("./utils.js").PatchOptions} PatchOptions
 */
