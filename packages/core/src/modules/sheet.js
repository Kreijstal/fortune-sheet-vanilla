import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { initSheetData } from "../api/sheet";
import { locale } from "../locale";
import { generateRandomSheetName, getSheetIndex } from "../utils";
import { setFormulaCellInfo } from "./formulaHelper";
function storeSheetParam(ctx) {
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    if (index == null)
        return;
    const file = ctx.luckysheetfile[index];
    file.config = ctx.config;
    file.luckysheet_select_save = ctx.luckysheet_select_save;
    file.luckysheet_selection_range = ctx.luckysheet_selection_range;
    file.zoomRatio = ctx.zoomRatio;
}
/**
 * @param {Context} ctx
 */
export function storeSheetParamALL(ctx) {
    storeSheetParam(ctx);
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    if (index == null)
        return;
    ctx.luckysheetfile[index].config = ctx.config;
}
/**
 * @param {Context} ctx
 * @param {string} id
 * @param {boolean} [isPivotInitial]
 * @param {boolean} [isNewSheet]
 * @param {boolean} [isCopySheet]
 */
export function changeSheet(ctx, id, isPivotInitial, isNewSheet, isCopySheet) {
    var _a, _b;
    if (id === ctx.currentSheetId) {
        return;
    }
    const file = ctx.luckysheetfile[getSheetIndex(ctx, id)];
    if (((_b = (_a = ctx.hooks).beforeActivateSheet) === null || _b === void 0 ? void 0 : _b.call(_a, id)) === false) {
        return;
    }
    storeSheetParamALL(ctx);
    ctx.currentSheetId = id;
    if (file.isPivotTable) {
        ctx.luckysheetcurrentisPivotTable = true;
    }
    else {
        ctx.luckysheetcurrentisPivotTable = false;
    }
    if (ctx.hooks.afterActivateSheet) {
        setTimeout(() => {
            var _a, _b;
            (_b = (_a = ctx.hooks).afterActivateSheet) === null || _b === void 0 ? void 0 : _b.call(_a, id);
        });
    }
}
/**
 * @param {Context} ctx
 * @param {Required<Settings>} [settings]
 * @param {string | undefined} [newSheetID]
 * @param {boolean} [isPivotTable]
 * @param {string | undefined} [sheetName]
 * @param {Sheet | undefined} [sheetData]
 */
export function addSheet(ctx, settings, newSheetID = undefined, isPivotTable = false, sheetName = undefined, sheetData = undefined) {
    var _a, _b;
    if (ctx.allowEdit === false) {
        return;
    }
    const order = ctx.luckysheetfile.length;
    const id = newSheetID !== null && newSheetID !== void 0 ? newSheetID : settings === null || settings === void 0 ? void 0 : settings.generateSheetId();
    const sheetname = sheetName || generateRandomSheetName(ctx.luckysheetfile, isPivotTable, ctx);
    if (!_.isNil(sheetData)) {
        delete sheetData.data;
        ctx.luckysheetfile.forEach((sheet) => {
            sheet.order =
                sheet.order < sheetData.order
                    ? sheet.order
                    : sheet.order + 1;
            return sheet;
        });
    }
    const sheetconfig = _.isNil(sheetData)
        ? {
            name: sheetName === undefined ? sheetname : sheetName,
            status: 0,
            order,
            id,
            row: ctx.defaultrowNum,
            column: ctx.defaultcolumnNum,
            config: {},
            pivotTable: null,
            isPivotTable: !!isPivotTable,
            zoomRatio: 1,
        }
        : sheetData;
    if (sheetName !== undefined)
        sheetconfig.name = sheetName;
    if (sheetconfig.id === undefined)
        sheetconfig.id = uuidv4();
    if (((_b = (_a = ctx.hooks).beforeAddSheet) === null || _b === void 0 ? void 0 : _b.call(_a, sheetconfig)) === false) {
        return;
    }
    ctx.luckysheetfile.push(sheetconfig);
    if (!newSheetID) {
        changeSheet(ctx, id, isPivotTable, true);
    }
    if (ctx.hooks.afterAddSheet) {
        setTimeout(() => {
            var _a, _b;
            (_b = (_a = ctx.hooks).afterAddSheet) === null || _b === void 0 ? void 0 : _b.call(_a, sheetconfig);
        });
    }
}
/**
 * @param {Context} ctx
 * @param {string} id
 */
export function deleteSheet(ctx, id) {
    var _a, _b, _c;
    if (ctx.allowEdit === false) {
        return;
    }
    const arrIndex = getSheetIndex(ctx, id);
    if (arrIndex == null) {
        return;
    }
    if (((_b = (_a = ctx.hooks).beforeDeleteSheet) === null || _b === void 0 ? void 0 : _b.call(_a, id)) === false) {
        return;
    }
    ctx.luckysheetfile = ctx.luckysheetfile.map((sheet) => {
        sheet.order =
            sheet.order < ctx.luckysheetfile[arrIndex].order
                ? sheet.order
                : sheet.order - 1;
        return sheet;
    });
    ctx.luckysheetfile.splice(arrIndex, 1);
    if (id === ctx.currentSheetId) {
        const shownSheets = _.cloneDeep(ctx.luckysheetfile).filter((singleSheet) => _.isUndefined(singleSheet.hide) || singleSheet.hide !== 1);
        const orderSheets = _.sortBy(shownSheets, (sheet) => sheet.order);
        ctx.currentSheetId = (_c = orderSheets === null || orderSheets === void 0 ? void 0 : orderSheets[0]) === null || _c === void 0 ? void 0 : _c.id;
    }
    if (ctx.hooks.afterDeleteSheet) {
        setTimeout(() => {
            var _a, _b;
            (_b = (_a = ctx.hooks).afterDeleteSheet) === null || _b === void 0 ? void 0 : _b.call(_a, id);
        });
    }
}
/**
 * @param {Context} ctx
 * @param {Array<Sheet>} newData
 */
export function updateSheet(ctx, newData) {
    newData.forEach((newDatum) => {
        var _a;
        const { data, row, column } = newDatum;
        const index = getSheetIndex(ctx, newDatum.id);
        if (data != null) {
            let lastRowNum = data.length;
            let lastColNum = data[0].length;
            if (row != null && column != null && row > 0 && column > 0) {
                lastRowNum = Math.max(lastRowNum, row);
                lastColNum = Math.max(lastColNum, column);
            }
            else {
                lastRowNum = Math.max(lastRowNum, ctx.defaultrowNum);
                lastColNum = Math.max(lastColNum, ctx.defaultcolumnNum);
            }
            const expandedData = _.times(lastRowNum, () => _.times(lastColNum, () => null));
            for (let i = 0; i < data.length; i += 1) {
                for (let j = 0; j < data[i].length; j += 1) {
                    expandedData[i][j] = data[i][j];
                    setFormulaCellInfo(ctx, { r: i, c: j, id: newDatum.id }, data);
                }
            }
            newDatum.data = expandedData;
            if (ctx.luckysheetfile[index] == null) {
                ctx.luckysheetfile.push(newDatum);
            }
            else {
                ctx.luckysheetfile[index] = newDatum;
            }
        }
        else if (newDatum.celldata != null) {
            initSheetData(ctx, index, newDatum);
            const _index = getSheetIndex(ctx, newDatum.id);
            (_a = newDatum.celldata) === null || _a === void 0 ? void 0 : _a.forEach((d) => {
                setFormulaCellInfo(ctx, { r: d.r, c: d.c, id: newDatum.id }, ctx.luckysheetfile[_index].data);
            });
        }
    });
}
/**
 * @param {Context} ctx
 * @param {HTMLSpanElement} editable
 */
export function editSheetName(ctx, editable) {
    var _a, _b;
    const index = getSheetIndex(ctx, ctx.currentSheetId);
    if (ctx.allowEdit === false) {
        if (index == null)
            return;
        editable.innerText = ctx.luckysheetfile[index].name;
        return;
    }
    const { sheetconfig } = locale(ctx);
    const oldtxt = editable.dataset.oldText || "";
    const txt = editable.innerText;
    if (((_b = (_a = ctx.hooks).beforeUpdateSheetName) === null || _b === void 0 ? void 0 : _b.call(_a, ctx.currentSheetId, oldtxt, txt)) === false) {
        return;
    }
    if (txt.length === 0) {
        editable.innerText = oldtxt;
        throw new Error(sheetconfig.sheetNamecannotIsEmptyError);
    }
    if (txt.length > 31 ||
        txt.charAt(0) === "'" ||
        txt.charAt(txt.length - 1) === "'" ||
        /[：:\\/？?*[\]]+/.test(txt)) {
        editable.innerText = oldtxt;
        throw new Error(sheetconfig.sheetNameSpecCharError);
    }
    if (index == null)
        return;
    for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
        if (index !== i && ctx.luckysheetfile[i].name === txt) {
            editable.innerText = oldtxt;
            return;
        }
    }
    ctx.luckysheetfile[index].name = txt;
    if (ctx.hooks.afterUpdateSheetName) {
        setTimeout(() => {
            var _a, _b;
            (_b = (_a = ctx.hooks).afterUpdateSheetName) === null || _b === void 0 ? void 0 : _b.call(_a, ctx.currentSheetId, oldtxt, txt);
        });
    }
}
/**
 * @param {CellMatrix} data
 * @param {number} rowsToAdd
 * @param {number} columnsToAdd
 * @returns {CellMatrix}
 */
export function expandRowsAndColumns(data, rowsToAdd, columnsToAdd) {
    if (rowsToAdd <= 0 && columnsToAdd <= 0) {
        return data;
    }
    if (data.length + rowsToAdd >= 10000) {
        throw new Error("This action would increase the number of rows in the workbook above the limit of 10000.");
    }
    if (data[0].length + columnsToAdd >= 1000) {
        throw new Error("This action would increase the number of columns in the workbook above the limit of 1000.");
    }
    if (rowsToAdd <= 0) {
        rowsToAdd = 0;
    }
    if (columnsToAdd <= 0) {
        columnsToAdd = 0;
    }
    let currentColLen = 0;
    if (data.length > 0) {
        currentColLen = data[0].length;
    }
    for (let r = 0; r < data.length; r += 1) {
        for (let i = 0; i < columnsToAdd; i += 1) {
            data[r].push(null);
        }
    }
    for (let r = 0; r < rowsToAdd; r += 1) {
        data.push(_.times(currentColLen + columnsToAdd, () => null));
    }
    return data;
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./settings.js").Settings} Settings
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").Sheet} Sheet
 */
