import _ from "lodash";
import { getFlowdata } from "../context";
import { cancelActiveImgItem, cancelPaintModel, functionHTMLGenerate, israngeseleciton, rangeHightlightselected, rangeSetValue, onCommentBoxMove, onCommentBoxMoveEnd, onCommentBoxResize, onCommentBoxResizeEnd, onImageMove, onImageMoveEnd, onImageResize, onImageResizeEnd, removeEditingComment, overShowComment, rangeDrag, onFormulaRangeDragEnd, createFormulaRangeSelect, createRangeHightlight, onCellsMoveEnd, onCellsMove, cellFocus, } from "../modules";
import { getFrozenHandleLeft, getFrozenHandleTop, scrollToFrozenRowCol, } from "../modules/freeze";
import { cancelFunctionrangeSelected, mergeBorder, mergeMoveMain, updateCell, luckysheetUpdateCell, } from "../modules/cell";
import { colLocation, colLocationByIndex, rowLocation, rowLocationByIndex, } from "../modules/location";
import { checkProtectionAllSelected, checkProtectionSelectLockedOrUnLockedCells, } from "../modules/protection";
import { normalizeSelection, pasteHandlerOfPaintModel, } from "../modules/selection";
import { getSheetIndex, isAllowEdit } from "../utils";
import { onDropCellSelectEnd, onDropCellSelect } from "../modules/dropCell";
import { handleFormulaInput, rangeDragColumn, rangeDragRow, } from "../modules/formula";
import { showLinkCard, onRangeSelectionModalMove, onRangeSelectionModalMoveEnd, } from "../modules/hyperlink";
import { onSearchDialogMove, onSearchDialogMoveEnd, } from "../modules/searchReplace";
let mouseWheelUniqueTimeout;
let scrollLockTimeout;
/**
 * @param {Context} ctx
 * @param {WheelEvent} e
 * @param {GlobalCache} cache
 * @param {HTMLDivElement} scrollbarX
 * @param {HTMLDivElement} scrollbarY
 */
export function handleGlobalWheel(ctx, e, cache, scrollbarX, scrollbarY) {
    var _a;
    if (((_a = cache.searchDialog) === null || _a === void 0 ? void 0 : _a.mouseEnter) && ctx.showSearch && ctx.showReplace)
        return;
    if (ctx.filterContextMenu != null)
        return;
    let { scrollLeft } = scrollbarX;
    const { scrollTop } = scrollbarY;
    let visibledatacolumn_c = ctx.visibledatacolumn;
    let visibledatarow_c = ctx.visibledatarow;
    clearTimeout(mouseWheelUniqueTimeout);
    clearTimeout(scrollLockTimeout);
    if (cache.visibleColumnsUnique != null) {
        visibledatacolumn_c = cache.visibleColumnsUnique;
    }
    else {
        visibledatacolumn_c = _.uniq(visibledatacolumn_c);
        cache.visibleColumnsUnique = visibledatacolumn_c;
    }
    if (cache.visibleRowsUnique != null) {
        visibledatarow_c = cache.visibleRowsUnique;
    }
    else {
        visibledatarow_c = _.uniq(visibledatarow_c);
        cache.visibleRowsUnique = visibledatarow_c;
    }
    const row_st = _.sortedIndex(visibledatarow_c, scrollTop) + 1;
    let rowscroll = 0;
    const scrollNum = 1;
    if (e.deltaY !== 0 && !cache.verticalScrollLock) {
        cache.horizontalScrollLock = true;
        let row_ed;
        let step = Math.round(scrollNum / ctx.zoomRatio);
        step = step < 1 ? 1 : step;
        if (e.deltaY > 0) {
            row_ed = row_st + step;
            if (row_ed >= visibledatarow_c.length) {
                row_ed = visibledatarow_c.length - 1;
            }
        }
        else {
            row_ed = row_st - step;
            if (row_ed < 0) {
                row_ed = 0;
            }
        }
        rowscroll = row_ed === 0 ? 0 : visibledatarow_c[row_ed - 1];
        scrollbarY.scrollTop = rowscroll;
    }
    else if (e.deltaX !== 0 && !cache.horizontalScrollLock) {
        cache.verticalScrollLock = true;
        if (e.deltaX > 0) {
            scrollLeft += 20 * ctx.zoomRatio;
        }
        else {
            scrollLeft -= 20 * ctx.zoomRatio;
        }
        scrollbarX.scrollLeft = scrollLeft;
    }
    mouseWheelUniqueTimeout = setTimeout(() => {
        delete cache.visibleColumnsUnique;
        delete cache.visibleRowsUnique;
    }, 500);
    scrollLockTimeout = setTimeout(() => {
        delete cache.verticalScrollLock;
        delete cache.horizontalScrollLock;
    }, 50);
    e.preventDefault();
}
/**
 * @param {Freezen | undefined} freeze
 * @param {number} x
 * @param {number} y
 * @param {number} mouseX
 * @param {number} mouseY
 * @returns {{
    x: number;
    y: number;
    inHorizontalFreeze: boolean;
    inVerticalFreeze: boolean;
}}
 */
export function fixPositionOnFrozenCells(freeze, x, y, mouseX, mouseY) {
    var _a, _b;
    let inHorizontalFreeze = false;
    let inVerticalFreeze = false;
    if (!freeze)
        return { x, y, inHorizontalFreeze, inVerticalFreeze };
    const freezenverticaldata = (_a = freeze === null || freeze === void 0 ? void 0 : freeze.vertical) === null || _a === void 0 ? void 0 : _a.freezenverticaldata;
    const freezenhorizontaldata = (_b = freeze === null || freeze === void 0 ? void 0 : freeze.horizontal) === null || _b === void 0 ? void 0 : _b.freezenhorizontaldata;
    if (freezenverticaldata != null &&
        mouseX < freezenverticaldata[0] - freezenverticaldata[2]) {
        x = mouseX + freezenverticaldata[2];
        inVerticalFreeze = true;
    }
    if (freezenhorizontaldata != null &&
        mouseY < freezenhorizontaldata[0] - freezenhorizontaldata[2]) {
        y = mouseY + freezenhorizontaldata[2];
        inHorizontalFreeze = true;
    }
    return { x, y, inHorizontalFreeze, inVerticalFreeze };
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} cellInput
 * @param {HTMLDivElement} container
 * @param {HTMLDivElement | null} [fxInput]
 * @param {CanvasRenderingContext2D} [canvas]
 */
export function handleCellAreaMouseDown(ctx, globalCache, e, cellInput, container, fxInput, canvas) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    ctx.contextMenu = {};
    ctx.filterContextMenu = undefined;
    const flowdata = getFlowdata(ctx);
    if (!flowdata)
        return;
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    const rect = container.getBoundingClientRect();
    const mouseX = e.pageX - rect.left - window.scrollX;
    const mouseY = e.pageY - rect.top - window.scrollY;
    const _x = mouseX + ctx.scrollLeft;
    const _y = mouseY + ctx.scrollTop;
    if (_x >= rect.width + ctx.scrollLeft || _y >= rect.height + ctx.scrollTop) {
        return;
    }
    const freeze = (_a = globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId];
    const { x, y, inHorizontalFreeze, inVerticalFreeze } = fixPositionOnFrozenCells(freeze, _x, _y, mouseX, mouseY);
    const row_location = rowLocation(y, ctx.visibledatarow);
    let row = row_location[1];
    let row_pre = row_location[0];
    let row_index = row_location[2];
    const col_location = colLocation(x, ctx.visibledatacolumn);
    let col = col_location[1];
    let col_pre = col_location[0];
    let col_index = col_location[2];
    let row_index_ed = row_index;
    let col_index_ed = col_index;
    const margeset = mergeBorder(ctx, flowdata, row_index, col_index);
    if (margeset) {
        [row_pre, row, row_index, row_index_ed] = margeset.row;
        [col_pre, col, col_index, col_index_ed] = margeset.column;
    }
    showLinkCard(ctx, row_index, col_index, false, true);
    if (((_c = (_b = ctx.hooks).beforeCellMouseDown) === null || _c === void 0 ? void 0 : _c.call(_b, (_d = flowdata[row_index]) === null || _d === void 0 ? void 0 : _d[col_index], {
        row: row_index,
        column: col_index,
        startRow: row_pre,
        startColumn: col_pre,
        endRow: row,
        endColumn: col,
    })) === false) {
        return;
    }
    cellFocus(ctx, row_index, col_index, true);
    if (!inHorizontalFreeze && !inVerticalFreeze) {
        if (col_pre < ctx.scrollLeft) {
            ctx.scrollLeft = col_pre;
        }
        if (row_pre < ctx.scrollTop) {
            ctx.scrollTop = row_pre;
        }
    }
    if (e.button === 2) {
        const isInSelection = _.some(ctx.luckysheet_select_save, (obj_s) => obj_s.row != null &&
            row_index >= obj_s.row[0] &&
            row_index <= obj_s.row[1] &&
            col_index >= obj_s.column[0] &&
            col_index <= obj_s.column[1]);
        if (isInSelection)
            return;
    }
    ctx.luckysheet_scroll_status = true;
    if (ctx.luckysheetCellUpdate.length > 0) {
        if (ctx.formulaCache.rangestart ||
            ctx.formulaCache.rangedrag_column_start ||
            ctx.formulaCache.rangedrag_row_start ||
            israngeseleciton(ctx)) {
            let rowseleted = [row_index, row_index_ed];
            let columnseleted = [col_index, col_index_ed];
            let left = col_pre;
            let width = col - col_pre - 1;
            let top = row_pre;
            let height = row - row_pre - 1;
            if (e.shiftKey) {
                const last = ctx.formulaCache.func_selectedrange;
                top = 0;
                height = 0;
                rowseleted = [];
                if (last == null ||
                    last.top == null ||
                    last.height == null ||
                    last.row_focus == null ||
                    last.left == null ||
                    last.width == null)
                    return;
                if (last.top > row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    if (last.row[1] > last.row_focus) {
                        last.row[1] = last.row_focus;
                    }
                    rowseleted = [row_index, last.row[1]];
                }
                else if (last.top === row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    rowseleted = [row_index, last.row[0]];
                }
                else {
                    top = last.top;
                    height = row - last.top - 1;
                    if (last.row[0] < last.row_focus) {
                        last.row[0] = last.row_focus;
                    }
                    rowseleted = [last.row[0], row_index];
                }
                left = 0;
                width = 0;
                columnseleted = [];
                if (last.left > col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    if (last.column == null || last.column_focus == null)
                        return;
                    if (last.column[1] > last.column_focus) {
                        last.column[1] = last.column_focus;
                    }
                    columnseleted = [col_index, last.column[1]];
                }
                else if (last.left === col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    columnseleted = [col_index, last.column[0]];
                }
                else {
                    left = last.left;
                    width = col - last.left - 1;
                    if (last.column == null || last.column_focus == null)
                        return;
                    if (last.column[0] < last.column_focus) {
                        last.column[0] = last.column_focus;
                    }
                    columnseleted = [last.column[0], col_index];
                }
                const changeparam = mergeMoveMain(ctx, columnseleted, rowseleted, last, top, height, left, width);
                if (changeparam != null) {
                    [columnseleted, rowseleted, top, height, left, width] = changeparam;
                }
                last.row = rowseleted;
                last.column = columnseleted;
                last.left_move = left;
                last.width_move = width;
                last.top_move = top;
                last.height_move = height;
                ctx.formulaCache.func_selectedrange = last;
            }
            else if (e.ctrlKey &&
                ((_e = _.last(cellInput.querySelectorAll("span"))) === null || _e === void 0 ? void 0 : _e.innerText) !== ",") {
                let vText = cellInput.innerText;
                if (vText[vText.length - 1] === ")") {
                    vText = vText.substring(0, vText.length - 1);
                }
                if (vText.length > 0) {
                    const lastWord = vText.substring(vText.length - 1, 1);
                    if (lastWord !== "," && lastWord !== "=" && lastWord !== "(") {
                        vText += ",";
                    }
                }
                if (vText.length > 0 && vText.substring(0, 1) === "=") {
                    vText = functionHTMLGenerate(vText);
                    if (window.getSelection) {
                        const currSelection = window.getSelection();
                        if (currSelection == null)
                            return;
                        ctx.formulaCache.functionRangeIndex = [
                            _.indexOf((_h = (_g = (_f = currSelection.anchorNode) === null || _f === void 0 ? void 0 : _f.parentNode) === null || _g === void 0 ? void 0 : _g.parentNode) === null || _h === void 0 ? void 0 : _h.childNodes, (_j = currSelection.anchorNode) === null || _j === void 0 ? void 0 : _j.parentNode),
                            currSelection.anchorOffset,
                        ];
                    }
                    else {
                        const textRange = document.selection.createRange();
                        ctx.formulaCache.functionRangeIndex = textRange;
                    }
                    cellInput.innerHTML = vText;
                    cancelFunctionrangeSelected(ctx);
                    createRangeHightlight(ctx, vText);
                }
                ctx.formulaCache.rangestart = false;
                ctx.formulaCache.rangedrag_column_start = false;
                ctx.formulaCache.rangedrag_row_start = false;
                if (fxInput)
                    fxInput.innerHTML = vText;
                rangeHightlightselected(ctx, cellInput);
                israngeseleciton(ctx);
                ctx.formulaCache.func_selectedrange = {
                    left,
                    width,
                    top,
                    height,
                    left_move: left,
                    width_move: width,
                    top_move: top,
                    height_move: height,
                    row: rowseleted,
                    column: columnseleted,
                    row_focus: row_index,
                    column_focus: col_index,
                };
            }
            else {
                ctx.formulaCache.func_selectedrange = {
                    left,
                    width,
                    top,
                    height,
                    left_move: left,
                    width_move: width,
                    top_move: top,
                    height_move: height,
                    row: rowseleted,
                    column: columnseleted,
                    row_focus: row_index,
                    column_focus: col_index,
                };
            }
            rangeSetValue(ctx, cellInput, {
                row: rowseleted,
                column: columnseleted,
            }, fxInput);
            ctx.formulaCache.rangestart = true;
            ctx.formulaCache.rangedrag_column_start = false;
            ctx.formulaCache.rangedrag_row_start = false;
            ctx.formulaCache.selectingRangeIndex = ctx.formulaCache.rangechangeindex;
            if (ctx.formulaCache.rangechangeindex > ctx.formulaRangeHighlight.length) {
                createRangeHightlight(ctx, cellInput.innerHTML, ctx.formulaCache.rangechangeindex);
            }
            createFormulaRangeSelect(ctx, {
                rangeIndex: ctx.formulaCache.rangechangeindex || 0,
                left,
                top,
                width,
                height,
            });
            e.preventDefault();
            return;
        }
        updateCell(ctx, ctx.luckysheetCellUpdate[0], ctx.luckysheetCellUpdate[1], cellInput, undefined, canvas);
        ctx.luckysheet_select_status = true;
    }
    if (checkProtectionSelectLockedOrUnLockedCells(ctx, row_index, col_index, ctx.currentSheetId)) {
        ctx.luckysheet_select_status = true;
    }
    if (ctx.luckysheet_select_status) {
        if (e.shiftKey) {
            const last = (_k = ctx.luckysheet_select_save) === null || _k === void 0 ? void 0 : _k[ctx.luckysheet_select_save.length - 1];
            if (last &&
                last.top != null &&
                last.left != null &&
                last.height != null &&
                last.width != null &&
                last.row_focus != null &&
                last.column_focus != null) {
                let top = 0;
                let height = 0;
                let rowseleted = [];
                if (last.top > row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    if (last.row[1] > last.row_focus) {
                        last.row[1] = last.row_focus;
                    }
                    rowseleted = [row_index, last.row[1]];
                }
                else if (last.top === row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    rowseleted = [row_index, last.row[0]];
                }
                else {
                    top = last.top;
                    height = row - last.top - 1;
                    if (last.row[0] < last.row_focus) {
                        last.row[0] = last.row_focus;
                    }
                    rowseleted = [last.row[0], row_index];
                }
                let left = 0;
                let width = 0;
                let columnseleted = [];
                if (last.left > col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    if (last.column[1] > last.column_focus) {
                        last.column[1] = last.column_focus;
                    }
                    columnseleted = [col_index, last.column[1]];
                }
                else if (last.left === col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    columnseleted = [col_index, last.column[0]];
                }
                else {
                    left = last.left;
                    width = col - last.left - 1;
                    if (last.column[0] < last.column_focus) {
                        last.column[0] = last.column_focus;
                    }
                    columnseleted = [last.column[0], col_index];
                }
                const changeparam = mergeMoveMain(ctx, columnseleted, rowseleted, last, top, height, left, width);
                if (changeparam != null) {
                    [columnseleted, rowseleted, top, height, left, width] = changeparam;
                }
                last.row = rowseleted;
                last.column = columnseleted;
                last.left_move = left;
                last.width_move = width;
                last.top_move = top;
                last.height_move = height;
                ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1] =
                    last;
            }
        }
        else if (e.ctrlKey || e.metaKey) {
            (_l = ctx.luckysheet_select_save) === null || _l === void 0 ? void 0 : _l.push({
                left: col_pre,
                width: col - col_pre - 1,
                top: row_pre,
                height: row - row_pre - 1,
                left_move: col_pre,
                width_move: col - col_pre - 1,
                top_move: row_pre,
                height_move: row - row_pre - 1,
                row: [row_index, row_index_ed],
                column: [col_index, col_index_ed],
                row_focus: row_index,
                column_focus: col_index,
            });
        }
        else {
            ctx.luckysheet_select_save = [
                {
                    left: col_pre,
                    width: col - col_pre - 1,
                    top: row_pre,
                    height: row - row_pre - 1,
                    left_move: col_pre,
                    width_move: col - col_pre - 1,
                    top_move: row_pre,
                    height_move: row - row_pre - 1,
                    row: [row_index, row_index_ed],
                    column: [col_index, col_index_ed],
                    row_focus: row_index,
                    column_focus: col_index,
                },
            ];
        }
    }
    ctx.luckysheet_select_save = normalizeSelection(ctx, ctx.luckysheet_select_save);
    if (ctx.hooks.afterCellMouseDown) {
        setTimeout(() => {
            var _a, _b, _c;
            (_b = (_a = ctx.hooks).afterCellMouseDown) === null || _b === void 0 ? void 0 : _b.call(_a, (_c = flowdata[row_index]) === null || _c === void 0 ? void 0 : _c[col_index], {
                row: row_index,
                column: col_index,
                startRow: row_pre,
                startColumn: col_pre,
                endRow: row,
                endColumn: col,
            });
        });
    }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {Settings} settings
 * @param {MouseEvent} e
 * @param {HTMLElement} container
 */
export function handleCellAreaDoubleClick(ctx, globalCache, settings, e, container) {
    var _a;
    const flowdata = getFlowdata(ctx);
    if (!flowdata)
        return;
    if ((ctx.luckysheetCellUpdate.length > 0 && ctx.formulaCache.rangestart) ||
        ctx.formulaCache.rangedrag_column_start ||
        ctx.formulaCache.rangedrag_row_start ||
        israngeseleciton(ctx)) {
        return;
    }
    const allowEdit = isAllowEdit(ctx);
    if (!allowEdit)
        return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.pageX - rect.left;
    const mouseY = e.pageY - rect.top;
    const _x = mouseX + ctx.scrollLeft;
    const _y = mouseY + ctx.scrollTop;
    const freeze = (_a = globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId];
    const { x, y } = fixPositionOnFrozenCells(freeze, _x, _y, mouseX, mouseY);
    const row_location = rowLocation(y, ctx.visibledatarow);
    let row_index = row_location[2];
    const col_location = colLocation(x, ctx.visibledatacolumn);
    let col_index = col_location[2];
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    const { dataVerification } = ctx.luckysheetfile[index];
    if (dataVerification) {
        const item = dataVerification[`${row_index}_${col_index}`];
        if (item && item.type === "checkbox")
            return;
    }
    const margeset = mergeBorder(ctx, flowdata, row_index, col_index);
    if (margeset) {
        [, , row_index] = margeset.row;
        [, , col_index] = margeset.column;
    }
    const { column_focus, row_focus } = ctx.luckysheet_select_save[0];
    if (!_.isNil(column_focus) &&
        !_.isNil(row_focus) &&
        (column_focus !== col_index || row_focus !== row_index)) {
        row_index = row_focus;
        col_index = column_focus;
    }
    luckysheetUpdateCell(ctx, row_index, col_index);
}
/**
 * @param {Context} ctx
 * @param {Settings} settings
 * @param {MouseEvent} e
 * @param {HTMLDivElement} workbookContainer
 * @param {HTMLDivElement} container
 * @param {"cell" | "rowHeader" | "columnHeader"} area
 */
export function handleContextMenu(ctx, settings, e, workbookContainer, container, area) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!ctx.allowEdit) {
        return;
    }
    const flowdata = getFlowdata(ctx);
    if (!flowdata)
        return;
    const workbookRect = workbookContainer.getBoundingClientRect();
    const { cellContextMenu } = settings;
    if (_.isEmpty(cellContextMenu)) {
        return;
    }
    const x = e.pageX - workbookRect.left;
    const y = e.pageY - workbookRect.top;
    ctx.contextMenu = {
        x,
        y,
        pageX: e.pageX,
        pageY: e.pageY,
    };
    e.preventDefault();
    if (area === "cell") {
        _.set(ctx.contextMenu, "headerMenu", undefined);
        const rect = container.getBoundingClientRect();
        const mouseX = e.pageX - rect.left - window.scrollX;
        const mouseY = e.pageY - rect.top - window.scrollY;
        const _selected_x = mouseX + ctx.scrollLeft;
        const _selected_y = mouseY + ctx.scrollTop;
        const { x: selected_x, y: selected_y } = fixPositionOnFrozenCells((_a = ctx.getRefs().globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId], _selected_x, _selected_y, mouseX, mouseY);
        const row_location = rowLocation(selected_y, ctx.visibledatarow);
        const row = row_location[1];
        const row_pre = row_location[0];
        const row_index = row_location[2];
        const col_location = colLocation(selected_x, ctx.visibledatacolumn);
        const col = col_location[1];
        const col_pre = col_location[0];
        const col_index = col_location[2];
        const isInSelection = _.some(ctx.luckysheet_select_save, (obj_s) => obj_s.row != null &&
            row_index >= obj_s.row[0] &&
            row_index <= obj_s.row[1] &&
            col_index >= obj_s.column[0] &&
            col_index <= obj_s.column[1]);
        if (!isInSelection && (e.metaKey || e.ctrlKey)) {
            if ((_b = flowdata[row_index][col_index]) === null || _b === void 0 ? void 0 : _b.mc) {
                const changeparam = mergeMoveMain(ctx, [col_index, col_index], [row_index, row_index], { row_focus: row_index, column_focus: col_index }, row_pre, row, col_pre, col);
                if (changeparam != null) {
                    const [columnseleted, rowseleted, top, height, left, width] = changeparam;
                    (_c = ctx.luckysheet_select_save) === null || _c === void 0 ? void 0 : _c.push({
                        left: left,
                        width: width - 1,
                        top: top,
                        height: height - 1,
                        left_move: left,
                        width_move: width,
                        top_move: top,
                        height_move: height,
                        row: rowseleted,
                        column: columnseleted,
                        row_focus: rowseleted[0],
                        column_focus: columnseleted[0],
                    });
                    return;
                }
            }
            (_d = ctx.luckysheet_select_save) === null || _d === void 0 ? void 0 : _d.push({
                left: col_pre,
                width: col - col_pre - 1,
                top: row_pre,
                height: row - row_pre - 1,
                left_move: col_pre,
                width_move: col - col_pre - 1,
                top_move: row_pre,
                height_move: row - row_pre - 1,
                row: [row_index, row_index],
                column: [col_index, col_index],
                row_focus: row_index,
                column_focus: col_index,
            });
            return;
        }
        if (isInSelection)
            return;
        const row_index_ed = row_index;
        const col_index_ed = col_index;
        if ((_e = flowdata[row_index][col_index]) === null || _e === void 0 ? void 0 : _e.mc) {
            const changeparam = mergeMoveMain(ctx, [col_index, col_index], [row_index, row_index], { row_focus: row_index, column_focus: col_index }, row_pre, row, col_pre, col);
            if (changeparam != null) {
                const [columnseleted, rowseleted, top, height, left, width] = changeparam;
                ctx.luckysheet_select_save = [
                    {
                        left: left,
                        width: width - 1,
                        top: top,
                        height: height - 1,
                        left_move: left,
                        width_move: width,
                        top_move: top,
                        height_move: height,
                        row: rowseleted,
                        column: columnseleted,
                        row_focus: rowseleted[0],
                        column_focus: columnseleted[0],
                    },
                ];
                return;
            }
        }
        ctx.luckysheet_select_save = [
            {
                left: col_pre,
                width: col - col_pre - 1,
                top: row_pre,
                height: row - row_pre - 1,
                left_move: col_pre,
                width_move: col - col_pre - 1,
                top_move: row_pre,
                height_move: row - row_pre - 1,
                row: [row_index, row_index_ed],
                column: [col_index, col_index_ed],
                row_focus: row_index,
                column_focus: col_index,
            },
        ];
    }
    else if (area === "rowHeader") {
        _.set(ctx.contextMenu, "headerMenu", "row");
        const rect = container.getBoundingClientRect();
        const mouseY = e.pageY - rect.top - window.scrollY;
        const _selected_y = mouseY + ctx.scrollTop;
        const { y: selected_y } = fixPositionOnFrozenCells((_f = ctx.getRefs().globalCache.freezen) === null || _f === void 0 ? void 0 : _f[ctx.currentSheetId], 0, _selected_y, 0, mouseY);
        const row_location = rowLocation(selected_y, ctx.visibledatarow);
        const row = row_location[1];
        const row_pre = row_location[0];
        const row_index = row_location[2];
        const isInSelection = _.some(ctx.luckysheet_select_save, (obj_s) => obj_s.row != null &&
            row_index >= obj_s.row[0] &&
            row_index <= obj_s.row[1] &&
            !obj_s.column_select);
        if (isInSelection)
            return;
        const col_index = ctx.visibledatacolumn.length - 1;
        const col = ctx.visibledatacolumn[col_index];
        const col_pre = 0;
        const top = row_pre;
        const height = row - row_pre - 1;
        const rowseleted = [row_index, row_index];
        ctx.luckysheet_select_save = [];
        ctx.luckysheet_select_save.push({
            left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
            width: colLocationByIndex(0, ctx.visibledatacolumn)[1] -
                colLocationByIndex(0, ctx.visibledatacolumn)[0] -
                1,
            top,
            height,
            left_move: col_pre,
            width_move: col - col_pre - 1,
            top_move: top,
            height_move: height,
            row: rowseleted,
            column: [0, col_index],
            row_focus: row_index,
            column_focus: 0,
            row_select: true,
        });
    }
    else if (area === "columnHeader") {
        _.set(ctx.contextMenu, "headerMenu", "column");
        const rect = container.getBoundingClientRect();
        const mouseX = e.pageX - rect.left - window.scrollX;
        const _selected_x = mouseX + ctx.scrollLeft;
        const { x: selected_x } = fixPositionOnFrozenCells((_g = ctx.getRefs().globalCache.freezen) === null || _g === void 0 ? void 0 : _g[ctx.currentSheetId], _selected_x, 0, mouseX, 0);
        const row_index = ctx.visibledatarow.length - 1;
        const row = ctx.visibledatarow[row_index];
        const row_pre = 0;
        const col_location = colLocation(selected_x, ctx.visibledatacolumn);
        const col = col_location[1];
        const col_pre = col_location[0];
        const col_index = col_location[2];
        const isInSelection = _.some(ctx.luckysheet_select_save, (obj_s) => obj_s.row != null &&
            col_index >= obj_s.column[0] &&
            col_index <= obj_s.column[1] &&
            !obj_s.row_select);
        if (isInSelection)
            return;
        const left = col_pre;
        const width = col - col_pre - 1;
        const columnseleted = [col_index, col_index];
        ctx.luckysheet_select_save = [];
        ctx.luckysheet_select_save.push({
            left,
            width,
            top: rowLocationByIndex(0, ctx.visibledatarow)[0],
            height: rowLocationByIndex(0, ctx.visibledatarow)[1] -
                rowLocationByIndex(0, ctx.visibledatarow)[0] -
                1,
            left_move: left,
            width_move: width,
            top_move: row_pre,
            height_move: row - row_pre - 1,
            row: [0, row_index],
            column: columnseleted,
            row_focus: 0,
            column_focus: col_index,
            column_select: true,
        });
    }
}
function mouseRender(ctx, globalCache, e, cellInput, scrollX, scrollY, container, fxInput) {
    var _a, _b, _c, _d;
    const rect = container.getBoundingClientRect();
    if (ctx.luckysheet_scroll_status &&
        !ctx.luckysheet_cols_change_size &&
        !ctx.luckysheet_rows_change_size) {
        const left = ctx.scrollLeft;
        const top = ctx.scrollTop;
        const x = e.pageX - rect.left - window.scrollX;
        const y = e.pageY - rect.top - window.scrollY;
        const winH = rect.height - 20 * ctx.zoomRatio;
        const winW = rect.width - 60 * ctx.zoomRatio;
        if (y < 0 || y > winH) {
            let stop;
            if (y < 0) {
                stop = top + y / 2;
            }
            else {
                stop = top + (y - winH) / 2;
            }
            scrollY.scrollTop = stop;
        }
        if (x < 0 || x > winW) {
            let sleft;
            if (x < 0) {
                sleft = left + x / 2;
            }
            else {
                sleft = left + (x - winW) / 2;
            }
            scrollX.scrollLeft = sleft;
        }
    }
    if ((_a = ctx.rangeDialog) === null || _a === void 0 ? void 0 : _a.singleSelect) {
        return;
    }
    if (ctx.luckysheet_select_status) {
        const mouseX = e.pageX - rect.left - window.scrollX;
        const mouseY = e.pageY - rect.top - window.scrollY;
        const _x = mouseX - ctx.rowHeaderWidth + ctx.scrollLeft;
        const _y = mouseY - ctx.columnHeaderHeight + ctx.scrollTop;
        const freeze = (_b = globalCache.freezen) === null || _b === void 0 ? void 0 : _b[ctx.currentSheetId];
        const { x, y } = fixPositionOnFrozenCells(freeze, _x, _y, mouseX - ctx.rowHeaderWidth, mouseY - ctx.columnHeaderHeight);
        const row_location = rowLocation(y, ctx.visibledatarow);
        const row = row_location[1];
        const row_pre = row_location[0];
        const row_index = row_location[2];
        const col_location = colLocation(x, ctx.visibledatacolumn);
        const col = col_location[1];
        const col_pre = col_location[0];
        const col_index = col_location[2];
        if (!checkProtectionSelectLockedOrUnLockedCells(ctx, row_index, col_index, ctx.currentSheetId)) {
            ctx.luckysheet_select_status = false;
            return;
        }
        const last = _.cloneDeep((_c = ctx.luckysheet_select_save) === null || _c === void 0 ? void 0 : _c[ctx.luckysheet_select_save.length - 1]);
        if (!last ||
            _.isNil(last.left) ||
            _.isNil(last.top) ||
            _.isNil(last.height) ||
            _.isNil(last.width) ||
            _.isNil(last.row_focus) ||
            _.isNil(last.column_focus)) {
            return;
        }
        let top = 0;
        let height = 0;
        let rowseleted = [];
        if (last.top > row_pre) {
            top = row_pre;
            height = last.top + last.height - row_pre;
            if (last.row[1] > last.row_focus) {
                last.row[1] = last.row_focus;
            }
            rowseleted = [row_index, last.row[1]];
        }
        else if (last.top === row_pre) {
            top = row_pre;
            height = last.top + last.height - row_pre;
            rowseleted = [row_index, last.row[0]];
        }
        else {
            top = last.top;
            height = row - last.top - 1;
            if (last.row[0] < last.row_focus) {
                last.row[0] = last.row_focus;
            }
            rowseleted = [last.row[0], row_index];
        }
        let left = 0;
        let width = 0;
        let columnseleted = [];
        if (last.left > col_pre) {
            left = col_pre;
            width = last.left + last.width - col_pre;
            if (last.column[1] > last.column_focus) {
                last.column[1] = last.column_focus;
            }
            columnseleted = [col_index, last.column[1]];
        }
        else if (last.left === col_pre) {
            left = col_pre;
            width = last.left + last.width - col_pre;
            columnseleted = [col_index, last.column[0]];
        }
        else {
            left = last.left;
            width = col - last.left - 1;
            if (last.column[0] < last.column_focus) {
                last.column[0] = last.column_focus;
            }
            columnseleted = [last.column[0], col_index];
        }
        const changeparam = mergeMoveMain(ctx, columnseleted, rowseleted, last, top, height, left, width);
        if (changeparam != null) {
            [columnseleted, rowseleted, top, height, left, width] = changeparam;
        }
        last.row = rowseleted;
        last.column = columnseleted;
        last.left_move = left;
        last.width_move = width;
        last.top_move = top;
        last.height_move = height;
        const isMaxColumn = ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1]
            .column;
        const colMax = ctx.visibledatacolumn.length - 1;
        if (isMaxColumn[0] === 0 && isMaxColumn[1] === colMax) {
            last.column[1] = colMax;
            last.width_move = ctx.visibledatacolumn[colMax] - 1;
        }
        const isMaxRow = ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1].row;
        const rowMax = ctx.visibledatarow.length - 1;
        if (isMaxRow[0] === 0 && isMaxRow[1] === rowMax) {
            last.row[1] = rowMax;
            last.height_move = ctx.visibledatarow[rowMax] - 1;
        }
        ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1] = last;
        scrollToFrozenRowCol(ctx, (_d = globalCache.freezen) === null || _d === void 0 ? void 0 : _d[ctx.currentSheetId]);
    }
    else if (ctx.formulaCache.rangestart) {
        rangeDrag(ctx, e, cellInput, scrollX.scrollLeft, scrollY.scrollTop, container, fxInput);
    }
    else if (ctx.formulaCache.rangedrag_row_start) {
        rangeDragRow(ctx, e, cellInput, scrollX.scrollLeft, scrollY.scrollTop, container, fxInput);
    }
    else if (ctx.formulaCache.rangedrag_column_start) {
        rangeDragColumn(ctx, e, cellInput, scrollX.scrollLeft, scrollY.scrollTop, container, fxInput);
    }
    else if (ctx.luckysheet_rows_selected_status) {
    }
    else if (ctx.luckysheet_cols_selected_status) {
    }
    else if (ctx.luckysheet_cell_selected_move) {
    }
    else if (ctx.luckysheet_cell_selected_extend) {
        onDropCellSelect(ctx, e, scrollX, scrollY, container);
    }
    else if (ctx.luckysheet_cols_change_size) {
        const x = e.pageX -
            rect.left -
            ctx.rowHeaderWidth +
            scrollX.scrollLeft -
            window.scrollX;
        if (x < rect.width + ctx.scrollLeft - 100) {
            const changeSizeLine = container.querySelector(".fortune-change-size-line");
            if (changeSizeLine) {
                changeSizeLine.style.left = `${x}px`;
            }
            const changeSizeCol = container.querySelector(".fortune-cols-change-size");
            if (changeSizeCol) {
                changeSizeCol.style.left = `${x - 2}px`;
            }
        }
    }
    else if (ctx.luckysheet_rows_change_size) {
        const y = e.pageY -
            rect.top -
            ctx.columnHeaderHeight +
            scrollY.scrollTop -
            window.scrollY;
        if (y < rect.height + ctx.scrollTop - 20) {
            const changeSizeLine = container.querySelector(".fortune-change-size-line");
            if (changeSizeLine) {
                changeSizeLine.style.top = `${y}px`;
            }
            const changeSizeRow = container.querySelector(".fortune-rows-change-size");
            if (changeSizeRow) {
                changeSizeRow.style.top = `${y}px`;
            }
        }
    }
    else if (ctx.luckysheet_cols_freeze_drag) {
        const x = e.pageX -
            rect.left -
            ctx.rowHeaderWidth +
            ctx.scrollLeft -
            window.scrollX;
        const [col_pre, col_curr] = colLocation(x, ctx.visibledatacolumn);
        const col = x > (col_pre + col_curr) / 2 ? col_curr : col_pre;
        if (x < rect.width + ctx.scrollLeft - 100) {
            const freezeLine = container.querySelector(".fortune-freeze-drag-line");
            if (freezeLine) {
                freezeLine.style.left = `${Math.max(0, col - 2)}px`;
            }
            const freezeHandle = container.querySelector(".fortune-cols-freeze-handle");
            if (freezeHandle) {
                freezeHandle.style.left = `${x}px`;
            }
            const changeSizeLine = container.querySelector(".fortune-change-size-line");
            if (changeSizeLine) {
                changeSizeLine.style.left = `${x}px`;
            }
        }
    }
    else if (ctx.luckysheet_rows_freeze_drag) {
        const y = e.pageY -
            rect.top -
            ctx.columnHeaderHeight +
            ctx.scrollTop -
            window.scrollY;
        const [row_pre, row_curr] = rowLocation(y, ctx.visibledatarow);
        const row = y > (row_curr + row_pre) / 2 ? row_curr : row_pre;
        if (y < rect.height + ctx.scrollTop - 20) {
            const freezeLine = container.querySelector(".fortune-freeze-drag-line");
            if (freezeLine) {
                freezeLine.style.top = `${Math.max(0, row - 2)}px`;
            }
            const freezeHandle = container.querySelector(".fortune-rows-freeze-handle");
            if (freezeHandle) {
                freezeHandle.style.top = `${y}px`;
            }
            const changeSizeLine = container.querySelector(".fortune-change-size-line");
            if (changeSizeLine) {
                changeSizeLine.style.top = `${y}px`;
            }
        }
    }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} cellInput
 * @param {HTMLDivElement} scrollX
 * @param {HTMLDivElement} scrollY
 * @param {HTMLDivElement} container
 * @param {HTMLDivElement | null} [fxInput]
 */
export function handleOverlayMouseMove(ctx, globalCache, e, cellInput, scrollX, scrollY, container, fxInput) {
    if (onCommentBoxResize(ctx, globalCache, e))
        return;
    if (onCommentBoxMove(ctx, globalCache, e))
        return;
    if (onImageMove(ctx, globalCache, e))
        return;
    if (onImageResize(ctx, globalCache, e))
        return;
    onCellsMove(ctx, globalCache, e, scrollX, scrollY, container);
    overShowComment(ctx, e, scrollX, scrollY, container);
    onSearchDialogMove(globalCache, e);
    onRangeSelectionModalMove(globalCache, e);
    if (!!ctx.luckysheet_scroll_status ||
        !!ctx.luckysheet_select_status ||
        !!ctx.luckysheet_rows_selected_status ||
        !!ctx.luckysheet_cols_selected_status ||
        !!ctx.luckysheet_cell_selected_move ||
        !!ctx.luckysheet_cell_selected_extend ||
        !!ctx.luckysheet_cols_change_size ||
        !!ctx.luckysheet_rows_change_size) {
        mouseRender(ctx, globalCache, e, cellInput, scrollX, scrollY, container, fxInput);
    }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {Settings} settings
 * @param {MouseEvent} e
 * @param {HTMLDivElement} scrollbarX
 * @param {HTMLDivElement} scrollbarY
 * @param {HTMLDivElement} container
 * @param {HTMLDivElement | null} cellInput
 * @param {HTMLDivElement | null} fxInput
 */
export function handleOverlayMouseUp(ctx, globalCache, settings, e, scrollbarX, scrollbarY, container, cellInput, fxInput) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const rect = container.getBoundingClientRect();
    onImageMoveEnd(ctx, globalCache);
    onImageResizeEnd(ctx, globalCache);
    onCommentBoxMoveEnd(ctx, globalCache);
    onCommentBoxResizeEnd(ctx, globalCache);
    onFormulaRangeDragEnd(ctx);
    onSearchDialogMoveEnd(globalCache);
    onRangeSelectionModalMoveEnd(globalCache);
    onCellsMoveEnd(ctx, globalCache, e, scrollbarX, scrollbarY, container);
    if (ctx.formulaCache.rangestart ||
        ctx.formulaCache.rangedrag_column_start ||
        ctx.formulaCache.rangedrag_row_start) {
        if (((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.id) === "luckysheet-functionbox-cell") {
            handleFormulaInput(ctx, cellInput, fxInput, 0, undefined, false);
        }
        else {
            handleFormulaInput(ctx, fxInput, cellInput, 0, undefined, false);
        }
    }
    if (ctx.luckysheet_select_status) {
        if (ctx.luckysheetPaintModelOn) {
            pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
            if (ctx.luckysheetPaintSingle) {
                cancelPaintModel(ctx);
            }
        }
    }
    ctx.luckysheet_select_status = false;
    ctx.luckysheet_scroll_status = false;
    ctx.luckysheet_rows_selected_status = false;
    ctx.luckysheet_cols_selected_status = false;
    ctx.luckysheet_model_move_state = false;
    if (ctx.luckysheet_rows_change_size) {
        ctx.luckysheet_rows_change_size = false;
        const { scrollTop } = ctx;
        const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop - window.scrollY;
        const winH = rect.height;
        let delta = y + 3 - ctx.luckysheet_rows_change_size_start[0];
        if (y >= winH - 20 + scrollTop) {
            delta = winH - 20 - ctx.luckysheet_rows_change_size_start[0] + scrollTop;
        }
        const cfg = ctx.config;
        if (cfg.rowlen == null) {
            cfg.rowlen = {};
        }
        if (cfg.customHeight == null) {
            cfg.customHeight = {};
        }
        let size = ctx.defaultrowlen;
        if (ctx.visibledatarow[ctx.luckysheet_rows_change_size_start[1]] != null) {
            size =
                ctx.visibledatarow[ctx.luckysheet_rows_change_size_start[1]] -
                    (ctx.visibledatarow[ctx.luckysheet_rows_change_size_start[1] - 1] || 0);
        }
        size += delta;
        if (size < 10) {
            size = 10;
        }
        cfg.customHeight[ctx.luckysheet_rows_change_size_start[1]] = 1;
        const changeRowIndex = ctx.luckysheet_rows_change_size_start[1];
        let changeRowSelected = false;
        if (((_c = (_b = ctx.luckysheet_select_save) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0) {
            (_e = (_d = ctx.luckysheet_select_save) === null || _d === void 0 ? void 0 : _d.filter((select) => select.row_select)) === null || _e === void 0 ? void 0 : _e.some((select) => {
                if (changeRowIndex >= select.row[0] &&
                    changeRowIndex <= select.row[1]) {
                    changeRowSelected = true;
                }
                return changeRowSelected;
            });
        }
        if (changeRowSelected) {
            cfg.rowlen || (cfg.rowlen = {});
            (_g = (_f = ctx.luckysheet_select_save) === null || _f === void 0 ? void 0 : _f.filter((select) => select.row_select)) === null || _g === void 0 ? void 0 : _g.forEach((select) => {
                for (let r = select.row[0]; r <= select.row[1]; r += 1) {
                    cfg.rowlen[r] = Math.ceil(size / ctx.zoomRatio);
                }
            });
        }
        else {
            cfg.rowlen[ctx.luckysheet_rows_change_size_start[1]] = Math.ceil(size / ctx.zoomRatio);
        }
        ctx.config = cfg;
        const idx = getSheetIndex(ctx, ctx.currentSheetId);
        if (idx == null)
            return;
        ctx.luckysheetfile[idx].config = ctx.config;
    }
    if (ctx.luckysheet_cols_change_size) {
        ctx.luckysheet_cols_change_size = false;
        const { scrollLeft } = ctx;
        const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft - window.scrollX;
        const winW = rect.width;
        let delta = x + 3 - ctx.luckysheet_cols_change_size_start[0];
        if (x >= winW - 100 + scrollLeft) {
            delta =
                winW - 100 - ctx.luckysheet_cols_change_size_start[0] + scrollLeft;
        }
        delta /= ctx.zoomRatio;
        const cfg = ctx.config;
        if (cfg.columnlen == null) {
            cfg.columnlen = {};
        }
        if (cfg.customWidth == null) {
            cfg.customWidth = {};
        }
        let firstcolumnlen = ctx.defaultcollen;
        if (ctx.config.columnlen != null &&
            ctx.config.columnlen[ctx.luckysheet_cols_change_size_start[1]] != null) {
            firstcolumnlen =
                ctx.config.columnlen[ctx.luckysheet_cols_change_size_start[1]];
        }
        let size = (cfg.columnlen[ctx.luckysheet_cols_change_size_start[1]] ||
            ctx.defaultcollen) + delta;
        if (Math.abs(size - firstcolumnlen) < 3) {
            return;
        }
        if (size < 10) {
            size = 10;
        }
        cfg.customWidth[ctx.luckysheet_cols_change_size_start[1]] = 1;
        const changeColumnIndex = ctx.luckysheet_cols_change_size_start[1];
        let changeColumnSelected = false;
        if (((_j = (_h = ctx.luckysheet_select_save) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0) > 0) {
            (_l = (_k = ctx.luckysheet_select_save) === null || _k === void 0 ? void 0 : _k.filter((select) => select.column_select)) === null || _l === void 0 ? void 0 : _l.some((select) => {
                if (changeColumnIndex >= select.column[0] &&
                    changeColumnIndex <= select.column[1]) {
                    changeColumnSelected = true;
                }
                return changeColumnSelected;
            });
        }
        if (changeColumnSelected) {
            cfg.columnlen || (cfg.columnlen = {});
            (_o = (_m = ctx.luckysheet_select_save) === null || _m === void 0 ? void 0 : _m.filter((select) => select.column_select)) === null || _o === void 0 ? void 0 : _o.forEach((select) => {
                for (let r = select.column[0]; r <= select.column[1]; r += 1) {
                    cfg.columnlen[r] = Math.ceil(size / ctx.zoomRatio);
                }
            });
        }
        else {
            cfg.columnlen[ctx.luckysheet_cols_change_size_start[1]] = Math.ceil(size / ctx.zoomRatio);
        }
        ctx.config = cfg;
        const idx = getSheetIndex(ctx, ctx.currentSheetId);
        if (idx == null)
            return;
        ctx.luckysheetfile[idx].config = ctx.config;
    }
    if (ctx.luckysheet_cols_freeze_drag) {
        ctx.luckysheet_cols_freeze_drag = false;
        const { scrollLeft } = ctx;
        const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft - window.scrollX;
        const [col_pre, col_curr, col_index_curr] = colLocation(x, ctx.visibledatacolumn);
        const col_index = x > (col_curr + col_pre) / 2 ? col_index_curr : col_index_curr - 1;
        const idx = getSheetIndex(ctx, ctx.currentSheetId);
        if (idx == null)
            return;
        if (col_index < 0) {
            const { frozen } = ctx.luckysheetfile[idx];
            if (frozen) {
                if (frozen.type === "rangeBoth" || frozen.type === "both") {
                    frozen.type = "rangeRow";
                }
                else if (frozen.type === "column" || frozen.type === "rangeColumn") {
                    delete ctx.luckysheetfile[idx].frozen;
                }
            }
            const freezeHandle = container.querySelector(".fortune-cols-freeze-handle");
            if (freezeHandle) {
                freezeHandle.style.left = `${ctx.scrollLeft}px`;
            }
        }
        else if (!ctx.luckysheetfile[idx].frozen) {
            ctx.luckysheetfile[idx].frozen = {
                type: "rangeColumn",
                range: { column_focus: col_index, row_focus: 0 },
            };
        }
        else {
            const frozen = ctx.luckysheetfile[idx].frozen;
            if (!frozen.range) {
                frozen.range = { column_focus: col_index, row_focus: 0 };
            }
            else {
                frozen.range.column_focus = col_index;
            }
            if ((frozen === null || frozen === void 0 ? void 0 : frozen.type) === "rangeRow" || (frozen === null || frozen === void 0 ? void 0 : frozen.type) === "row") {
                frozen.type = "rangeBoth";
            }
        }
        const freezeHandle = container.querySelector(".fortune-cols-freeze-handle");
        if (freezeHandle) {
            freezeHandle.style.left = `${getFrozenHandleLeft(ctx)}px`;
        }
    }
    if (ctx.luckysheet_rows_freeze_drag) {
        ctx.luckysheet_rows_freeze_drag = false;
        const { scrollTop } = ctx;
        const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop - window.scrollY;
        const [row_pre, row_curr, row_index_curr] = rowLocation(y, ctx.visibledatarow);
        const row_index = y > (row_curr + row_pre) / 2 ? row_index_curr : row_index_curr - 1;
        const idx = getSheetIndex(ctx, ctx.currentSheetId);
        if (idx == null)
            return;
        if (row_index < 0) {
            const { frozen } = ctx.luckysheetfile[idx];
            if (frozen) {
                if (frozen.type === "rangeBoth" || frozen.type === "both") {
                    frozen.type = "rangeColumn";
                }
                else if (frozen.type === "row" || frozen.type === "rangeRow") {
                    delete ctx.luckysheetfile[idx].frozen;
                }
            }
        }
        else if (!ctx.luckysheetfile[idx].frozen) {
            ctx.luckysheetfile[idx].frozen = {
                type: "rangeRow",
                range: { column_focus: 0, row_focus: row_index },
            };
        }
        else {
            const frozen = ctx.luckysheetfile[idx].frozen;
            if (!frozen.range) {
                frozen.range = { column_focus: 0, row_focus: row_index };
            }
            else {
                frozen.range.row_focus = row_index;
            }
            if ((frozen === null || frozen === void 0 ? void 0 : frozen.type) === "rangeColumn" || (frozen === null || frozen === void 0 ? void 0 : frozen.type) === "column") {
                frozen.type = "rangeBoth";
            }
        }
        const freezeHandle = container.querySelector(".fortune-rows-freeze-handle");
        if (freezeHandle) {
            freezeHandle.style.top = `${getFrozenHandleTop(ctx)}px`;
        }
    }
    if (ctx.luckysheet_cell_selected_extend) {
        onDropCellSelectEnd(ctx, e, container);
    }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} container
 * @param {HTMLDivElement} cellInput
 * @param {HTMLDivElement | null} fxInput
 */
export function handleRowHeaderMouseDown(ctx, globalCache, e, container, cellInput, fxInput) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!checkProtectionAllSelected(ctx, ctx.currentSheetId)) {
        return;
    }
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    const rect = container.getBoundingClientRect();
    const mouseY = e.pageY - rect.top - window.scrollY;
    const _y = mouseY + ctx.scrollTop;
    const freeze = (_a = globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId];
    const { y } = fixPositionOnFrozenCells(freeze, 0, _y, 0, mouseY);
    const row_location = rowLocation(y, ctx.visibledatarow);
    const row = row_location[1];
    const row_pre = row_location[0];
    const row_index = row_location[2];
    const col_index = ctx.visibledatacolumn.length - 1;
    const col = ctx.visibledatacolumn[col_index];
    const col_pre = 0;
    if (e.button === 2) {
        const flowdata = getFlowdata(ctx);
        const isInSelection = _.some(ctx.luckysheet_select_save, (obj_s) => {
            var _a, _b;
            return obj_s.row != null &&
                row_index >= obj_s.row[0] &&
                row_index <= obj_s.row[1] &&
                obj_s.column[0] === 0 &&
                obj_s.column[1] === ((_b = (_a = flowdata === null || flowdata === void 0 ? void 0 : flowdata[0]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) - 1;
        });
        if (isInSelection)
            return;
    }
    let top = row_pre;
    let height = row - row_pre - 1;
    let rowseleted = [row_index, row_index];
    ctx.luckysheet_scroll_status = true;
    if (!_.isEmpty(ctx.luckysheetCellUpdate)) {
        if (ctx.formulaCache.rangestart ||
            ctx.formulaCache.rangedrag_column_start ||
            ctx.formulaCache.rangedrag_row_start ||
            israngeseleciton(ctx)) {
            let changeparam = mergeMoveMain(ctx, [0, col_index], rowseleted, { row_focus: row_index, column_focus: 0 }, top, height, col_pre, col);
            if (changeparam != null) {
                [rowseleted, top, height] = [
                    changeparam[1],
                    changeparam[2],
                    changeparam[3],
                ];
            }
            if (e.shiftKey) {
                const last = ctx.formulaCache.func_selectedrange;
                top = 0;
                height = 0;
                rowseleted = [];
                if (last == null ||
                    last.top == null ||
                    last.height == null ||
                    last.row == null ||
                    last.row_focus == null)
                    return;
                if (last.top > row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    if (last.row[1] > last.row_focus) {
                        last.row[1] = last.row_focus;
                    }
                    rowseleted = [row_index, last.row[1]];
                }
                else if (last.top === row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    rowseleted = [row_index, last.row[0]];
                }
                else {
                    top = last.top;
                    height = row - last.top - 1;
                    if (last.row[0] < last.row_focus) {
                        last.row[0] = last.row_focus;
                    }
                    rowseleted = [last.row[0], row_index];
                }
                changeparam = mergeMoveMain(ctx, [0, col_index], rowseleted, { row_focus: row_index, column_focus: 0 }, top, height, col_pre, col);
                if (changeparam != null) {
                    [rowseleted, top, height] = [
                        changeparam[1],
                        changeparam[2],
                        changeparam[3],
                    ];
                }
                last.row = rowseleted;
                last.top_move = top;
                last.height_move = height;
                ctx.formulaCache.func_selectedrange = last;
            }
            else if (e.ctrlKey &&
                ((_b = _.last(cellInput.querySelectorAll("span"))) === null || _b === void 0 ? void 0 : _b.innerText) !== ",") {
                let vText = `${cellInput.innerText},`;
                if (vText.length > 0 && vText.substring(0, 1) === "=") {
                    vText = functionHTMLGenerate(vText);
                    if (window.getSelection) {
                        const currSelection = window.getSelection();
                        if (currSelection == null)
                            return;
                        ctx.formulaCache.functionRangeIndex = [
                            _.indexOf((_e = (_d = (_c = currSelection.anchorNode) === null || _c === void 0 ? void 0 : _c.parentNode) === null || _d === void 0 ? void 0 : _d.parentNode) === null || _e === void 0 ? void 0 : _e.childNodes, (_f = currSelection.anchorNode) === null || _f === void 0 ? void 0 : _f.parentNode),
                            currSelection.anchorOffset,
                        ];
                    }
                    else {
                        const textRange = document.selection.createRange();
                        ctx.formulaCache.functionRangeIndex = textRange;
                    }
                    cellInput.innerHTML = vText;
                    cancelFunctionrangeSelected(ctx);
                    createRangeHightlight(ctx, vText);
                }
                ctx.formulaCache.rangestart = false;
                ctx.formulaCache.rangedrag_column_start = false;
                ctx.formulaCache.rangedrag_row_start = false;
                if (fxInput)
                    fxInput.innerHTML = vText;
                rangeHightlightselected(ctx, cellInput);
                israngeseleciton(ctx);
                ctx.formulaCache.func_selectedrange = {
                    left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
                    width: colLocationByIndex(0, ctx.visibledatacolumn)[1] -
                        colLocationByIndex(0, ctx.visibledatacolumn)[0] -
                        1,
                    top,
                    height,
                    left_move: col_pre,
                    width_move: col - col_pre - 1,
                    top_move: top,
                    height_move: height,
                    row: rowseleted,
                    column: [0, col_index],
                    row_focus: row_index,
                    column_focus: 0,
                };
            }
            else {
                ctx.formulaCache.func_selectedrange = {
                    left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
                    width: colLocationByIndex(0, ctx.visibledatacolumn)[1] -
                        colLocationByIndex(0, ctx.visibledatacolumn)[0] -
                        1,
                    top,
                    height,
                    left_move: col_pre,
                    width_move: col - col_pre - 1,
                    top_move: top,
                    height_move: height,
                    row: rowseleted,
                    column: [0, col_index],
                    row_focus: row_index,
                    column_focus: 0,
                };
            }
            if (ctx.formulaCache.rangestart ||
                ctx.formulaCache.rangedrag_column_start ||
                ctx.formulaCache.rangedrag_row_start ||
                israngeseleciton(ctx)) {
                rangeSetValue(ctx, cellInput, {
                    row: rowseleted,
                    column: [null, null],
                }, fxInput);
            }
            ctx.formulaCache.rangedrag_row_start = true;
            ctx.formulaCache.rangestart = false;
            ctx.formulaCache.rangedrag_column_start = false;
            ctx.formulaCache.selectingRangeIndex = ctx.formulaCache.rangechangeindex;
            if (ctx.formulaCache.rangechangeindex > ctx.formulaRangeHighlight.length) {
                createRangeHightlight(ctx, cellInput.innerHTML, ctx.formulaCache.rangechangeindex);
            }
            createFormulaRangeSelect(ctx, {
                rangeIndex: ctx.formulaCache.rangechangeindex || 0,
                left: col_pre,
                top,
                width: col - col_pre - 1,
                height,
            });
            e.preventDefault();
            return;
        }
        updateCell(ctx, ctx.luckysheetCellUpdate[0], ctx.luckysheetCellUpdate[1], cellInput);
        ctx.luckysheet_rows_selected_status = true;
    }
    else {
        ctx.luckysheet_rows_selected_status = true;
    }
    if (ctx.luckysheet_rows_selected_status) {
        if (e.shiftKey) {
            const last = _.cloneDeep((_g = ctx.luckysheet_select_save) === null || _g === void 0 ? void 0 : _g[ctx.luckysheet_select_save.length - 1]);
            if (!last ||
                _.isNil(last.top) ||
                _.isNil(last.height) ||
                _.isNil(last.row_focus)) {
                return;
            }
            let _top = 0;
            let _height = 0;
            let _rowseleted = [];
            if (last.top > row_pre) {
                _top = row_pre;
                _height = last.top + last.height - row_pre;
                if (last.row[1] > last.row_focus) {
                    last.row[1] = last.row_focus;
                }
                _rowseleted = [row_index, last.row[1]];
            }
            else if (last.top === row_pre) {
                _top = row_pre;
                _height = last.top + last.height - row_pre;
                _rowseleted = [row_index, last.row[0]];
            }
            else {
                _top = last.top;
                _height = row - last.top - 1;
                if (last.row[0] < last.row_focus) {
                    last.row[0] = last.row_focus;
                }
                _rowseleted = [last.row[0], row_index];
            }
            last.row = _rowseleted;
            last.top_move = _top;
            last.height_move = _height;
            ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1] =
                last;
        }
        else if (e.ctrlKey || e.metaKey) {
            (_h = ctx.luckysheet_select_save) === null || _h === void 0 ? void 0 : _h.push({
                left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
                width: colLocationByIndex(0, ctx.visibledatacolumn)[1] -
                    colLocationByIndex(0, ctx.visibledatacolumn)[0] -
                    1,
                top,
                height,
                left_move: col_pre,
                width_move: col - col_pre - 1,
                top_move: top,
                height_move: height,
                row: rowseleted,
                column: [0, col_index],
                row_focus: row_index,
                column_focus: 0,
                row_select: true,
            });
        }
        else {
            ctx.luckysheet_select_save = [];
            ctx.luckysheet_select_save.push({
                left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
                width: colLocationByIndex(0, ctx.visibledatacolumn)[1] -
                    colLocationByIndex(0, ctx.visibledatacolumn)[0] -
                    1,
                top,
                height,
                left_move: col_pre,
                width_move: col - col_pre - 1,
                top_move: top,
                height_move: height,
                row: rowseleted,
                column: [0, col_index],
                row_focus: row_index,
                column_focus: 0,
                row_select: true,
            });
            ctx.luckysheet_select_status = true;
            ctx.luckysheet_scroll_status = true;
        }
    }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLElement} container
 * @param {HTMLDivElement} cellInput
 * @param {HTMLDivElement | null} fxInput
 */
export function handleColumnHeaderMouseDown(ctx, globalCache, e, container, cellInput, fxInput) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!checkProtectionAllSelected(ctx, ctx.currentSheetId)) {
        return;
    }
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    const rect = container.getBoundingClientRect();
    const mouseX = e.pageX - rect.left - window.scrollX;
    const _x = mouseX + ctx.scrollLeft;
    const freeze = (_a = globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId];
    const { x } = fixPositionOnFrozenCells(freeze, _x, 0, mouseX, 0);
    const row_index = ctx.visibledatarow.length - 1;
    const row = ctx.visibledatarow[row_index];
    const row_pre = 0;
    const col_location = colLocation(x, ctx.visibledatacolumn);
    const col = col_location[1];
    const col_pre = col_location[0];
    const col_index = col_location[2];
    ctx.orderbyindex = col_index;
    if (e.button === 2) {
        const flowdata = getFlowdata(ctx);
        const isInSelection = _.some(ctx.luckysheet_select_save, (obj_s) => {
            var _a;
            return obj_s.column != null &&
                col_index >= obj_s.column[0] &&
                col_index <= obj_s.column[1] &&
                obj_s.row[0] === 0 &&
                obj_s.row[1] === ((_a = flowdata === null || flowdata === void 0 ? void 0 : flowdata.length) !== null && _a !== void 0 ? _a : 0) - 1;
        });
        if (isInSelection)
            return;
    }
    let left = col_pre;
    let width = col - col_pre - 1;
    let columnseleted = [col_index, col_index];
    ctx.luckysheet_scroll_status = true;
    if (!_.isEmpty(ctx.luckysheetCellUpdate)) {
        if (ctx.formulaCache.rangestart ||
            ctx.formulaCache.rangedrag_column_start ||
            ctx.formulaCache.rangedrag_row_start ||
            israngeseleciton(ctx)) {
            let changeparam = mergeMoveMain(ctx, columnseleted, [0, row_index], { row_focus: 0, column_focus: col_index }, row_pre, row, left, width);
            if (changeparam != null) {
                [columnseleted, left, width] = [
                    changeparam[0],
                    changeparam[4],
                    changeparam[5],
                ];
            }
            if (e.shiftKey) {
                const last = ctx.formulaCache.func_selectedrange;
                left = 0;
                width = 0;
                columnseleted = [];
                if (last == null ||
                    last.width == null ||
                    last.height == null ||
                    last.left == null ||
                    last.column_focus == null)
                    return;
                if (last.left > col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    if (last.column[1] > last.column_focus) {
                        last.column[1] = last.column_focus;
                    }
                    columnseleted = [col_index, last.column[1]];
                }
                else if (last.left === col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    columnseleted = [col_index, last.column[0]];
                }
                else {
                    left = last.left;
                    width = col - last.left - 1;
                    if (last.column[0] < last.column_focus) {
                        last.column[0] = last.column_focus;
                    }
                    columnseleted = [last.column[0], col_index];
                }
                changeparam = mergeMoveMain(ctx, columnseleted, [0, row_index], { row_focus: 0, column_focus: col_index }, row_pre, row, left, width);
                if (changeparam != null) {
                    [columnseleted, left, width] = [
                        changeparam[0],
                        changeparam[4],
                        changeparam[5],
                    ];
                }
                last.column = columnseleted;
                last.left_move = left;
                last.width_move = width;
                ctx.formulaCache.func_selectedrange = last;
            }
            else if (e.ctrlKey &&
                ((_b = _.last(cellInput.querySelectorAll("span"))) === null || _b === void 0 ? void 0 : _b.innerText) !== ",") {
                let vText = `${cellInput.innerText},`;
                if (vText.length > 0 && vText.substring(0, 1) === "=") {
                    vText = functionHTMLGenerate(vText);
                    if (window.getSelection) {
                        const currSelection = window.getSelection();
                        if (currSelection == null)
                            return;
                        ctx.formulaCache.functionRangeIndex = [
                            _.indexOf((_e = (_d = (_c = currSelection.anchorNode) === null || _c === void 0 ? void 0 : _c.parentNode) === null || _d === void 0 ? void 0 : _d.parentNode) === null || _e === void 0 ? void 0 : _e.childNodes, (_f = currSelection.anchorNode) === null || _f === void 0 ? void 0 : _f.parentNode),
                            currSelection.anchorOffset,
                        ];
                    }
                    else {
                        const textRange = document.selection.createRange();
                        ctx.formulaCache.functionRangeIndex = textRange;
                    }
                    cellInput.innerHTML = vText;
                    cancelFunctionrangeSelected(ctx);
                    createRangeHightlight(ctx, vText);
                }
                ctx.formulaCache.rangestart = false;
                ctx.formulaCache.rangedrag_column_start = false;
                ctx.formulaCache.rangedrag_row_start = false;
                if (fxInput) {
                    fxInput.innerHTML = vText;
                }
                rangeHightlightselected(ctx, cellInput);
                israngeseleciton(ctx);
                ctx.formulaCache.func_selectedrange = {
                    left,
                    width,
                    top: rowLocationByIndex(0, ctx.visibledatarow)[0],
                    height: rowLocationByIndex(0, ctx.visibledatarow)[1] -
                        rowLocationByIndex(0, ctx.visibledatarow)[0] -
                        1,
                    left_move: left,
                    width_move: width,
                    top_move: row_pre,
                    height_move: row - row_pre - 1,
                    row: [0, row_index],
                    column: columnseleted,
                    row_focus: 0,
                    column_focus: col_index,
                };
            }
            else {
                ctx.formulaCache.func_selectedrange = {
                    left,
                    width,
                    top: rowLocationByIndex(0, ctx.visibledatarow)[0],
                    height: rowLocationByIndex(0, ctx.visibledatarow)[1] -
                        rowLocationByIndex(0, ctx.visibledatarow)[0] -
                        1,
                    left_move: left,
                    width_move: width,
                    top_move: row_pre,
                    height_move: row - row_pre - 1,
                    row: [0, row_index],
                    column: columnseleted,
                    row_focus: 0,
                    column_focus: col_index,
                };
            }
            if (ctx.formulaCache.rangestart ||
                ctx.formulaCache.rangedrag_column_start ||
                ctx.formulaCache.rangedrag_row_start ||
                israngeseleciton(ctx)) {
                rangeSetValue(ctx, cellInput, {
                    row: [null, null],
                    column: columnseleted,
                }, fxInput);
            }
            ctx.formulaCache.rangedrag_column_start = true;
            ctx.formulaCache.rangestart = false;
            ctx.formulaCache.rangedrag_row_start = false;
            ctx.formulaCache.selectingRangeIndex = ctx.formulaCache.rangechangeindex;
            if (ctx.formulaCache.rangechangeindex > ctx.formulaRangeHighlight.length) {
                createRangeHightlight(ctx, cellInput.innerHTML, ctx.formulaCache.rangechangeindex);
            }
            createFormulaRangeSelect(ctx, {
                rangeIndex: ctx.formulaCache.rangechangeindex || 0,
                left,
                top: row_pre,
                width,
                height: row - row_pre - 1,
            });
            e.preventDefault();
            return;
        }
        updateCell(ctx, ctx.luckysheetCellUpdate[0], ctx.luckysheetCellUpdate[1], cellInput);
        ctx.luckysheet_cols_selected_status = true;
    }
    else {
        ctx.luckysheet_cols_selected_status = true;
    }
    if (ctx.luckysheet_cols_selected_status) {
        if (e.shiftKey) {
            const last = _.cloneDeep((_g = ctx.luckysheet_select_save) === null || _g === void 0 ? void 0 : _g[ctx.luckysheet_select_save.length - 1]);
            let _left = 0;
            let _width = 0;
            let _columnseleted = [];
            if (!last ||
                _.isNil(last.left) ||
                _.isNil(last.width) ||
                _.isNil(last.column_focus)) {
                return;
            }
            if (last.left > col_pre) {
                _left = col_pre;
                _width = last.left + last.width - col_pre;
                if (last.column[1] > last.column_focus) {
                    last.column[1] = last.column_focus;
                }
                _columnseleted = [col_index, last.column[1]];
            }
            else if (last.left === col_pre) {
                _left = col_pre;
                _width = last.left + last.width - col_pre;
                _columnseleted = [col_index, last.column[0]];
            }
            else {
                _left = last.left;
                _width = col - last.left - 1;
                if (last.column[0] < last.column_focus) {
                    last.column[0] = last.column_focus;
                }
                _columnseleted = [last.column[0], col_index];
            }
            last.column = _columnseleted;
            last.left_move = _left;
            last.width_move = _width;
            ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1] =
                last;
        }
        else if (e.ctrlKey || e.metaKey) {
            (_h = ctx.luckysheet_select_save) === null || _h === void 0 ? void 0 : _h.push({
                left,
                width,
                top: rowLocationByIndex(0, ctx.visibledatarow)[0],
                height: rowLocationByIndex(0, ctx.visibledatarow)[1] -
                    rowLocationByIndex(0, ctx.visibledatarow)[0] -
                    1,
                left_move: left,
                width_move: width,
                top_move: row_pre,
                height_move: row - row_pre - 1,
                row: [0, row_index],
                column: columnseleted,
                row_focus: 0,
                column_focus: col_index,
                column_select: true,
            });
        }
        else {
            ctx.luckysheet_select_save = [];
            ctx.luckysheet_select_save.push({
                left,
                width,
                top: rowLocationByIndex(0, ctx.visibledatarow)[0],
                height: rowLocationByIndex(0, ctx.visibledatarow)[1] -
                    rowLocationByIndex(0, ctx.visibledatarow)[0] -
                    1,
                left_move: left,
                width_move: width,
                top_move: row_pre,
                height_move: row - row_pre - 1,
                row: [0, row_index],
                column: columnseleted,
                row_focus: 0,
                column_focus: col_index,
                column_select: true,
            });
            ctx.luckysheet_select_status = true;
            ctx.luckysheet_scroll_status = true;
        }
    }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} headerContainer
 * @param {HTMLDivElement} workbookContainer
 * @param {HTMLDivElement} cellArea
 */
export function handleColSizeHandleMouseDown(ctx, globalCache, e, headerContainer, workbookContainer, cellArea) {
    var _a;
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    ctx.luckysheetCellUpdate = [];
    const { scrollLeft } = ctx;
    const { scrollTop } = ctx;
    const mouseX = e.pageX - headerContainer.getBoundingClientRect().left - window.scrollX;
    const _x = mouseX + scrollLeft;
    const freeze = (_a = globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId];
    const { x } = fixPositionOnFrozenCells(freeze, _x, 0, mouseX, 0);
    const col_location = colLocation(x, ctx.visibledatacolumn);
    const col = col_location[1];
    const col_index = col_location[2];
    ctx.luckysheet_cols_change_size = true;
    ctx.luckysheet_scroll_status = true;
    const changeSizeLine = workbookContainer.querySelector(".fortune-change-size-line");
    if (changeSizeLine) {
        const ele = changeSizeLine;
        ele.style.height = `${cellArea.getBoundingClientRect().height + scrollTop}px`;
        ele.style.borderWidth = "0 1px 0 0";
        ele.style.top = "0";
        ele.style.left = `${col - 3}px`;
        ele.style.width = "1px";
    }
    ctx.luckysheet_cols_change_size_start = [_x, col_index];
    e.stopPropagation();
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} headerContainer
 * @param {HTMLDivElement} workbookContainer
 * @param {HTMLDivElement} cellArea
 */
export function handleRowSizeHandleMouseDown(ctx, globalCache, e, headerContainer, workbookContainer, cellArea) {
    var _a;
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    if (ctx.formulaCache.rangestart ||
        ctx.formulaCache.rangedrag_column_start ||
        ctx.formulaCache.rangedrag_row_start ||
        israngeseleciton(ctx))
        return;
    ctx.luckysheetCellUpdate = [];
    const { scrollLeft } = ctx;
    const { scrollTop } = ctx;
    const mouseY = e.pageY - headerContainer.getBoundingClientRect().top - window.scrollY;
    const _y = mouseY + scrollTop;
    const freeze = (_a = globalCache.freezen) === null || _a === void 0 ? void 0 : _a[ctx.currentSheetId];
    const { y } = fixPositionOnFrozenCells(freeze, 0, _y, 0, mouseY);
    const row_location = rowLocation(y, ctx.visibledatarow);
    const row = row_location[1];
    const row_index = row_location[2];
    ctx.luckysheet_rows_change_size = true;
    ctx.luckysheet_scroll_status = true;
    const changeSizeLine = workbookContainer.querySelector(".fortune-change-size-line");
    if (changeSizeLine) {
        const ele = changeSizeLine;
        ele.style.width = `${cellArea.getBoundingClientRect().width + scrollLeft}px`;
        ele.style.borderWidth = "0 0 1px 0";
        ele.style.top = `${row - 3}px`;
        ele.style.left = "0";
        ele.style.height = "1px";
    }
    ctx.luckysheet_rows_change_size_start = [_y, row_index];
    e.stopPropagation();
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} headerContainer
 * @param {HTMLDivElement} workbookContainer
 * @param {HTMLDivElement} cellArea
 */
export function handleColFreezeHandleMouseDown(ctx, globalCache, e, headerContainer, workbookContainer, cellArea) {
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    ctx.luckysheetCellUpdate = [];
    const { scrollLeft } = ctx;
    const { scrollTop } = ctx;
    const x = e.pageX - headerContainer.getBoundingClientRect().left + scrollLeft;
    const col_location = colLocation(x, ctx.visibledatacolumn);
    const col = col_location[1];
    ctx.luckysheet_cols_freeze_drag = true;
    ctx.luckysheet_scroll_status = true;
    const freezeDragLine = workbookContainer.querySelector(".fortune-freeze-drag-line");
    if (freezeDragLine) {
        const ele = freezeDragLine;
        ele.style.height = `${cellArea.getBoundingClientRect().height + scrollTop}px`;
        ele.style.borderWidth = "0 3px 0 0";
        ele.style.top = "0";
        ele.style.left = `${col - 3}px`;
        ele.style.width = "1px";
    }
    const changeSizeLine = workbookContainer.querySelector(".fortune-change-size-line");
    if (changeSizeLine) {
        const ele = changeSizeLine;
        ele.style.height = `${cellArea.getBoundingClientRect().height + scrollTop}px`;
        ele.style.borderWidth = "0 1px 0 0";
        ele.style.top = "0";
        ele.style.left = `${col - 3}px`;
        ele.style.width = "1px";
    }
    e.stopPropagation();
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} headerContainer
 * @param {HTMLDivElement} workbookContainer
 * @param {HTMLDivElement} cellArea
 */
export function handleRowFreezeHandleMouseDown(ctx, globalCache, e, headerContainer, workbookContainer, cellArea) {
    removeEditingComment(ctx, globalCache);
    cancelActiveImgItem(ctx, globalCache);
    ctx.luckysheetCellUpdate = [];
    const { scrollLeft } = ctx;
    const { scrollTop } = ctx;
    const y = e.pageY - headerContainer.getBoundingClientRect().top + scrollTop;
    const row_location = rowLocation(y, ctx.visibledatarow);
    const row = row_location[1];
    ctx.luckysheet_rows_freeze_drag = true;
    ctx.luckysheet_scroll_status = true;
    const freezeDragLine = workbookContainer.querySelector(".fortune-freeze-drag-line");
    if (freezeDragLine) {
        const ele = freezeDragLine;
        ele.style.width = `${cellArea.getBoundingClientRect().width + scrollLeft}px`;
        ele.style.borderWidth = "0 0 3px 0";
        ele.style.top = `${row - 3}px`;
        ele.style.left = "0";
        ele.style.height = "1px";
    }
    const changeSizeLine = workbookContainer.querySelector(".fortune-change-size-line");
    if (changeSizeLine) {
        const ele = changeSizeLine;
        ele.style.width = `${cellArea.getBoundingClientRect().width + scrollLeft}px`;
        ele.style.borderWidth = "0 0 1px 0";
        ele.style.top = `${row - 3}px`;
        ele.style.left = "0";
        ele.style.height = "1px";
    }
    e.stopPropagation();
}

/**
 * @typedef {import("./index.js").Freezen} Freezen
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./settings.js").Settings} Settings
 * @typedef {import("./types.js").GlobalCache} GlobalCache
 */
