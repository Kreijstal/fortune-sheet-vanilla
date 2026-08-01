import _ from "lodash";
import { getFlowdata } from "../context";
import { locale } from "../locale";
import { delFunctionGroup, execfunction, execFunctionGroup, functionCopy, } from "../modules/formula";
import { getdatabyselection, getQKBorder } from "../modules/cell";
import { genarate, update } from "../modules/format";
import { normalizeSelection, selectionCache } from "../modules/selection";
import { getSheetIndex, isAllowEdit } from "../utils";
import { hasPartMC, isRealNum } from "../modules/validation";
import { getBorderInfoCompute } from "../modules/border";
import { expandRowsAndColumns, storeSheetParamALL } from "../modules/sheet";
import { jfrefreshgrid } from "../modules/refresh";
import { setRowHeight } from "../api";
import { CFSplitRange } from "../modules";
import clipboard from "../modules/clipboard";
import { setFormulaCellInfo } from "../modules/formulaHelper";
function postPasteCut(ctx, source, target, RowlChange) {
    const execF_rc = {};
    ctx.formulaCache.execFunctionExist = [];
    for (let r = source.range.row[0]; r <= source.range.row[1]; r += 1) {
        for (let c = source.range.column[0]; c <= source.range.column[1]; c += 1) {
            setFormulaCellInfo(ctx, { r, c, id: source.sheetId });
            if (`${r}_${c}_${source.sheetId}` in execF_rc) {
                continue;
            }
            execF_rc[`${r}_${c}_${source.sheetId}`] = 0;
            ctx.formulaCache.execFunctionExist.push({ r, c, i: source.sheetId });
        }
    }
    for (let r = target.range.row[0]; r <= target.range.row[1]; r += 1) {
        for (let c = target.range.column[0]; c <= target.range.column[1]; c += 1) {
            setFormulaCellInfo(ctx, { r, c, id: source.sheetId });
            if (`${r}_${c}_${target.sheetId}` in execF_rc) {
                continue;
            }
            execF_rc[`${r}_${c}_${target.sheetId}`] = 0;
            ctx.formulaCache.execFunctionExist.push({ r, c, i: target.sheetId });
        }
    }
    let rowHeight;
    if (ctx.currentSheetId === source.sheetId) {
        ctx.config = source.curConfig;
        rowHeight = source.curData.length;
        ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)].config =
            target.curConfig;
    }
    else if (ctx.currentSheetId === target.sheetId) {
        ctx.config = target.curConfig;
        rowHeight = target.curData.length;
        ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)].config =
            source.curConfig;
    }
    if (RowlChange) {
        ctx.visibledatarow = [];
        ctx.rh_height = 0;
        for (let i = 0; i < rowHeight; i += 1) {
            let rowlen = ctx.defaultrowlen;
            if (ctx.config.rowlen != null && ctx.config.rowlen[i] != null) {
                rowlen = ctx.config.rowlen[i];
            }
            if (ctx.config.rowhidden != null && ctx.config.rowhidden[i] != null) {
                rowlen = ctx.config.rowhidden[i];
                ctx.visibledatarow.push(ctx.rh_height);
                continue;
            }
            else {
                ctx.rh_height += rowlen + 1;
            }
            ctx.visibledatarow.push(ctx.rh_height);
        }
        ctx.rh_height += 80;
        if (ctx.currentSheetId === source.sheetId) {
        }
        else if (ctx.currentSheetId === target.sheetId) {
        }
    }
    if (ctx.currentSheetId === source.sheetId) {
        ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)].data =
            target.curData;
    }
    else if (ctx.currentSheetId === target.sheetId) {
        ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)].data =
            source.curData;
    }
    if (ctx.currentSheetId === target.sheetId) {
        ctx.luckysheet_select_save = [
            { row: target.range.row, column: target.range.column },
        ];
    }
    else {
        ctx.luckysheet_select_save = [
            { row: source.range.row, column: source.range.column },
        ];
    }
    if (ctx.luckysheet_select_save.length > 0) {
    }
    ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)].luckysheet_conditionformat_save = source.curCdformat;
    ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)].luckysheet_conditionformat_save = target.curCdformat;
    ctx.luckysheetfile[getSheetIndex(ctx, source.sheetId)].dataVerification =
        source.curDataVerification;
    ctx.luckysheetfile[getSheetIndex(ctx, target.sheetId)].dataVerification =
        target.curDataVerification;
    ctx.formulaCache.execFunctionExist.reverse();
    execFunctionGroup(ctx, null, null, null, null, target.curData);
    ctx.formulaCache.execFunctionGlobalData = null;
    storeSheetParamALL(ctx);
}
function pasteHandler(ctx, data, borderInfo) {
    var _a, _b, _c, _d, _e, _f;
    const allowEdit = isAllowEdit(ctx);
    if (!allowEdit)
        return;
    if (((_b = (_a = ctx.luckysheet_select_save) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) !== 1) {
        return;
    }
    if (typeof data === "object") {
        if (data.length === 0) {
            return;
        }
        const cfg = ctx.config || {};
        if (cfg.merge == null) {
            cfg.merge = {};
        }
        if (JSON.stringify(borderInfo).length > 2 && cfg.borderInfo == null) {
            cfg.borderInfo = [];
        }
        const copyh = data.length;
        const copyc = data[0].length;
        const minh = ctx.luckysheet_select_save[0].row[0];
        const maxh = minh + copyh - 1;
        const minc = ctx.luckysheet_select_save[0].column[0];
        const maxc = minc + copyc - 1;
        let has_PartMC = false;
        if (cfg.merge != null) {
            has_PartMC = hasPartMC(ctx, cfg, minh, maxh, minc, maxc);
        }
        if (has_PartMC) {
            return;
        }
        const d = getFlowdata(ctx);
        if (!d)
            return;
        const rowMaxLength = d.length;
        const cellMaxLength = d[0].length;
        const addr = maxh - rowMaxLength + 1;
        const addc = maxc - cellMaxLength + 1;
        if (addr > 0 || addc > 0) {
            expandRowsAndColumns(d, addr, addc);
        }
        if (!d)
            return;
        if (cfg.rowlen == null) {
            cfg.rowlen = {};
        }
        const RowlChange = false;
        const offsetMC = {};
        for (let h = minh; h <= maxh; h += 1) {
            const x = d[h];
            let currentRowLen = ctx.defaultrowlen;
            if (cfg.rowlen[h] != null) {
                currentRowLen = cfg.rowlen[h];
            }
            for (let c = minc; c <= maxc; c += 1) {
                if ((_c = x === null || x === void 0 ? void 0 : x[c]) === null || _c === void 0 ? void 0 : _c.mc) {
                    if ("rs" in x[c].mc) {
                        delete cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`];
                    }
                    delete x[c].mc;
                }
                let value = null;
                if (data[h - minh] != null && data[h - minh][c - minc] != null) {
                    value = data[h - minh][c - minc];
                }
                x[c] = value;
                if (value != null && ((_d = x === null || x === void 0 ? void 0 : x[c]) === null || _d === void 0 ? void 0 : _d.mc)) {
                    if (x[c].mc.rs != null) {
                        x[c].mc.r = h;
                        x[c].mc.c = c;
                        cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`] = x[c].mc;
                        offsetMC[`${value.mc.r}_${value.mc.c}`] = [
                            x[c].mc.r,
                            x[c].mc.c,
                        ];
                    }
                    else {
                        x[c] = {
                            mc: {
                                r: offsetMC[`${value.mc.r}_${value.mc.c}`][0],
                                c: offsetMC[`${value.mc.r}_${value.mc.c}`][1],
                            },
                        };
                    }
                }
                if (borderInfo[`${h - minh}_${c - minc}`]) {
                    const bd_obj = {
                        rangeType: "cell",
                        value: {
                            row_index: h,
                            col_index: c,
                            l: borderInfo[`${h - minh}_${c - minc}`].l,
                            r: borderInfo[`${h - minh}_${c - minc}`].r,
                            t: borderInfo[`${h - minh}_${c - minc}`].t,
                            b: borderInfo[`${h - minh}_${c - minc}`].b,
                        },
                    };
                    (_e = cfg.borderInfo) === null || _e === void 0 ? void 0 : _e.push(bd_obj);
                }
            }
            d[h] = x;
            if (currentRowLen !== ctx.defaultrowlen) {
                cfg.rowlen[h] = currentRowLen;
            }
        }
        ctx.luckysheet_select_save = [{ row: [minh, maxh], column: [minc, maxc] }];
        if (addr > 0 || addc > 0 || RowlChange) {
            ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)].config = cfg;
        }
        else {
            ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)].config = cfg;
        }
        jfrefreshgrid(ctx, null, undefined);
    }
    else {
        data = data.replace(/\r/g, "");
        const dataChe = [];
        const che = data.split("\n");
        const colchelen = che[0].split("\t").length;
        for (let i = 0; i < che.length; i += 1) {
            if (che[i].split("\t").length < colchelen) {
                continue;
            }
            dataChe.push(che[i].split("\t"));
        }
        const d = getFlowdata(ctx);
        if (!d)
            return;
        const last = (_f = ctx.luckysheet_select_save) === null || _f === void 0 ? void 0 : _f[ctx.luckysheet_select_save.length - 1];
        if (!last)
            return;
        const curR = last.row == null ? 0 : last.row[0];
        const curC = last.column == null ? 0 : last.column[0];
        const rlen = dataChe.length;
        const clen = dataChe[0].length;
        let has_PartMC = false;
        if (ctx.config.merge != null) {
            has_PartMC = hasPartMC(ctx, ctx.config, curR, curR + rlen - 1, curC, curC + clen - 1);
        }
        if (has_PartMC) {
            return;
        }
        const addr = curR + rlen - d.length;
        const addc = curC + clen - d[0].length;
        if (addr > 0 || addc > 0) {
            expandRowsAndColumns(d, addr, addc);
        }
        if (!d)
            return;
        for (let r = 0; r < rlen; r += 1) {
            const x = d[r + curR];
            for (let c = 0; c < clen; c += 1) {
                const originCell = x[c + curC];
                let value = dataChe[r][c];
                if (isRealNum(value)) {
                    if (originCell && originCell.ct && originCell.ct.fa === "@") {
                        value = String(value);
                    }
                    else {
                        value = parseFloat(value);
                    }
                }
                if (originCell) {
                    originCell.v = value;
                    if (originCell.ct != null && originCell.ct.fa != null) {
                        originCell.m = update(originCell.ct.fa, value);
                    }
                    else {
                        originCell.m = value;
                    }
                    if (originCell.f != null && originCell.f.length > 0) {
                        originCell.f = "";
                        delFunctionGroup(ctx, r + curR, c + curC, ctx.currentSheetId);
                    }
                }
                else {
                    const cell = {};
                    const mask = genarate(value);
                    [cell.m, cell.ct, cell.v] = mask;
                    x[c + curC] = cell;
                }
            }
            d[r + curR] = x;
        }
        last.row = [curR, curR + rlen - 1];
        last.column = [curC, curC + clen - 1];
        jfrefreshgrid(ctx, null, undefined);
    }
}
function setCellHyperlink(ctx, id, r, c, link) {
    const index = getSheetIndex(ctx, id);
    if (!ctx.luckysheetfile[index].hyperlink) {
        ctx.luckysheetfile[index].hyperlink = {};
    }
    ctx.luckysheetfile[index].hyperlink[`${r}_${c}`] = link;
}
function pasteHandlerOfCutPaste(ctx, copyRange) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const allowEdit = isAllowEdit(ctx);
    if (!allowEdit)
        return;
    if (!copyRange)
        return;
    const cfg = ctx.config || {};
    if (cfg.merge == null) {
        cfg.merge = {};
    }
    const copyHasMC = copyRange.HasMC;
    const copyRowlChange = copyRange.RowlChange;
    const copySheetId = copyRange.dataSheetId;
    const c_r1 = copyRange.copyRange[0].row[0];
    const c_r2 = copyRange.copyRange[0].row[1];
    const c_c1 = copyRange.copyRange[0].column[0];
    const c_c2 = copyRange.copyRange[0].column[1];
    const copyData = _.cloneDeep(getdatabyselection(ctx, { row: [c_r1, c_r2], column: [c_c1, c_c2] }, copySheetId));
    const copyh = copyData.length;
    const copyc = copyData[0].length;
    const last = (_a = ctx.luckysheet_select_save) === null || _a === void 0 ? void 0 : _a[ctx.luckysheet_select_save.length - 1];
    if (!last || last.row_focus == null || last.column_focus == null)
        return;
    const minh = last.row_focus;
    const maxh = minh + copyh - 1;
    const minc = last.column_focus;
    const maxc = minc + copyc - 1;
    let has_PartMC = false;
    if (cfg.merge != null) {
        has_PartMC = hasPartMC(ctx, cfg, minh, maxh, minc, maxc);
    }
    if (has_PartMC) {
        return;
    }
    const d = getFlowdata(ctx);
    if (!d)
        return;
    const rowMaxLength = d.length;
    const cellMaxLength = d[0].length;
    const addr = copyh + minh - rowMaxLength;
    const addc = copyc + minc - cellMaxLength;
    if (addr > 0 || addc > 0) {
        expandRowsAndColumns(d, addr, addc);
    }
    const borderInfoCompute = getBorderInfoCompute(ctx, copySheetId);
    const c_dataVerification = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)].dataVerification) || {};
    const dataVerification = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
        .dataVerification) || {};
    if (((_b = ctx.luckysheet_select_save) === null || _b === void 0 ? void 0 : _b.length) === 1 &&
        ((_c = ctx.luckysheet_copy_save) === null || _c === void 0 ? void 0 : _c.copyRange.length) === 1) {
        _.forEach((_d = ctx.luckysheet_copy_save) === null || _d === void 0 ? void 0 : _d.copyRange, (range) => {
            var _a, _b, _c;
            for (let r = 0; r <= range.row[1] - range.row[0]; r += 1) {
                for (let c = 0; c <= range.column[1] - range.column[0]; c += 1) {
                    const index = getSheetIndex(ctx, (_a = ctx.luckysheet_copy_save) === null || _a === void 0 ? void 0 : _a.dataSheetId);
                    if (((_b = ctx.luckysheetfile[index].data[r + range.row[0]][c + range.column[0]]) === null || _b === void 0 ? void 0 : _b.hl) &&
                        ctx.luckysheetfile[index].hyperlink[`${r}_${c}`]) {
                        setCellHyperlink(ctx, (_c = ctx.luckysheet_copy_save) === null || _c === void 0 ? void 0 : _c.dataSheetId, r + ctx.luckysheet_select_save[0].row[0], c + ctx.luckysheet_select_save[0].column[0], ctx.luckysheetfile[index].hyperlink[`${r}_${c}`]);
                    }
                }
            }
        });
    }
    if (ctx.currentSheetId === copySheetId) {
        for (let i = c_r1; i <= c_r2; i += 1) {
            for (let j = c_c1; j <= c_c2; j += 1) {
                const cell = d[i][j];
                if (cell && _.isPlainObject(cell) && "mc" in cell) {
                    if (((_e = cell.mc) === null || _e === void 0 ? void 0 : _e.rs) != null) {
                        delete cfg.merge[`${cell.mc.r}_${cell.mc.c}`];
                    }
                    delete cell.mc;
                }
                d[i][j] = null;
                delete dataVerification[`${i}_${j}`];
                (_f = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)].hyperlink) === null || _f === void 0 ? true : delete _f[`${i}_${j}`];
            }
        }
        if (cfg.borderInfo && cfg.borderInfo.length > 0) {
            const source_borderInfo = [];
            for (let i = 0; i < cfg.borderInfo.length; i += 1) {
                const bd_rangeType = cfg.borderInfo[i].rangeType;
                if (bd_rangeType === "range") {
                    const bd_range = cfg.borderInfo[i].range;
                    let bd_emptyRange = [];
                    for (let j = 0; j < bd_range.length; j += 1) {
                        bd_emptyRange = bd_emptyRange.concat(CFSplitRange(bd_range[j], { row: [c_r1, c_r2], column: [c_c1, c_c2] }, { row: [minh, maxh], column: [minc, maxc] }, "restPart"));
                    }
                    cfg.borderInfo[i].range = bd_emptyRange;
                    source_borderInfo.push(cfg.borderInfo[i]);
                }
                else if (bd_rangeType === "cell") {
                    const bd_r = cfg.borderInfo[i].value.row_index;
                    const bd_c = cfg.borderInfo[i].value.col_index;
                    if (!(bd_r >= c_r1 && bd_r <= c_r2 && bd_c >= c_c1 && bd_c <= c_c2)) {
                        source_borderInfo.push(cfg.borderInfo[i]);
                    }
                }
            }
            cfg.borderInfo = source_borderInfo;
        }
    }
    const offsetMC = {};
    for (let h = minh; h <= maxh; h += 1) {
        const x = d[h];
        for (let c = minc; c <= maxc; c += 1) {
            if (borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`] &&
                !borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s) {
                const bd_obj = {
                    rangeType: "cell",
                    value: {
                        row_index: h,
                        col_index: c,
                        l: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].l,
                        r: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].r,
                        t: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].t,
                        b: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].b,
                    },
                };
                if (cfg.borderInfo == null) {
                    cfg.borderInfo = [];
                }
                cfg.borderInfo.push(bd_obj);
            }
            else if (borderInfoCompute[`${h}_${c}`]) {
                const bd_obj = {
                    rangeType: "cell",
                    value: {
                        row_index: h,
                        col_index: c,
                        l: null,
                        r: null,
                        t: null,
                        b: null,
                    },
                };
                if (cfg.borderInfo == null) {
                    cfg.borderInfo = [];
                }
                cfg.borderInfo.push(bd_obj);
            }
            else if (borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`]) {
                const bd_obj = {
                    rangeType: "range",
                    borderType: "border-slash",
                    color: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s.color,
                    style: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s.style,
                    range: normalizeSelection(ctx, [{ row: [h, h], column: [c, c] }]),
                };
                if (cfg.borderInfo == null) {
                    cfg.borderInfo = [];
                }
                cfg.borderInfo.push(bd_obj);
            }
            if (c_dataVerification[`${c_r1 + h - minh}_${c_c1 + c - minc}`]) {
                dataVerification[`${h}_${c}`] =
                    c_dataVerification[`${c_r1 + h - minh}_${c_c1 + c - minc}`];
            }
            if ((_g = x[c]) === null || _g === void 0 ? void 0 : _g.mc) {
                if (((_j = (_h = x[c]) === null || _h === void 0 ? void 0 : _h.mc) === null || _j === void 0 ? void 0 : _j.rs) != null) {
                    delete cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`];
                }
                delete x[c].mc;
            }
            let value = null;
            if (copyData[h - minh] != null && copyData[h - minh][c - minc] != null) {
                value = copyData[h - minh][c - minc];
            }
            x[c] = _.cloneDeep(value);
            if (value != null && copyHasMC && ((_k = x[c]) === null || _k === void 0 ? void 0 : _k.mc)) {
                if (x[c].mc.rs != null) {
                    x[c].mc.r = h;
                    x[c].mc.c = c;
                    cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`] = x[c].mc;
                    offsetMC[`${value.mc.r}_${value.mc.c}`] = [
                        x[c].mc.r,
                        x[c].mc.c,
                    ];
                }
                else {
                    x[c] = {
                        mc: {
                            r: offsetMC[`${value.mc.r}_${value.mc.c}`][0],
                            c: offsetMC[`${value.mc.r}_${value.mc.c}`][1],
                        },
                    };
                }
            }
        }
        d[h] = x;
    }
    last.row = [minh, maxh];
    last.column = [minc, maxc];
    if (copyRowlChange) {
    }
    let source;
    let target;
    if (ctx.currentSheetId !== copySheetId) {
        const sourceData = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)].data);
        const sourceConfig = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)].config);
        const sourceCurData = _.cloneDeep(sourceData);
        const sourceCurConfig = _.cloneDeep(sourceConfig) || {};
        if (sourceCurConfig.merge == null) {
            sourceCurConfig.merge = {};
        }
        for (let source_r = c_r1; source_r <= c_r2; source_r += 1) {
            for (let source_c = c_c1; source_c <= c_c2; source_c += 1) {
                const cell = sourceCurData[source_r][source_c];
                if (cell === null || cell === void 0 ? void 0 : cell.mc) {
                    if ("rs" in cell.mc) {
                        delete sourceCurConfig.merge[`${cell.mc.r}_${cell.mc.c}`];
                    }
                    delete cell.mc;
                }
                sourceCurData[source_r][source_c] = null;
            }
        }
        if (copyRowlChange) {
        }
        if (sourceCurConfig.borderInfo && sourceCurConfig.borderInfo.length > 0) {
            const source_borderInfo = [];
            for (let i = 0; i < sourceCurConfig.borderInfo.length; i += 1) {
                const bd_rangeType = sourceCurConfig.borderInfo[i].rangeType;
                if (bd_rangeType === "range") {
                    const bd_range = sourceCurConfig.borderInfo[i].range;
                    let bd_emptyRange = [];
                    for (let j = 0; j < bd_range.length; j += 1) {
                        bd_emptyRange = bd_emptyRange.concat(CFSplitRange(bd_range[j], { row: [c_r1, c_r2], column: [c_c1, c_c2] }, { row: [minh, maxh], column: [minc, maxc] }, "restPart"));
                    }
                    sourceCurConfig.borderInfo[i].range = bd_emptyRange;
                    source_borderInfo.push(sourceCurConfig.borderInfo[i]);
                }
                else if (bd_rangeType === "cell") {
                    const bd_r = sourceCurConfig.borderInfo[i].value.row_index;
                    const bd_c = sourceCurConfig.borderInfo[i].value.col_index;
                    if (!(bd_r >= c_r1 && bd_r <= c_r2 && bd_c >= c_c1 && bd_c <= c_c2)) {
                        source_borderInfo.push(sourceCurConfig.borderInfo[i]);
                    }
                }
            }
            sourceCurConfig.borderInfo = source_borderInfo;
        }
        const source_cdformat = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)]
            .luckysheet_conditionformat_save);
        const source_curCdformat = _.cloneDeep(source_cdformat);
        const ruleArr = [];
        if (source_curCdformat != null && source_curCdformat.length > 0) {
            for (let i = 0; i < source_curCdformat.length; i += 1) {
                const source_curCdformat_cellrange = source_curCdformat[i].cellrange;
                let emptyRange = [];
                let emptyRange2 = [];
                for (let j = 0; j < source_curCdformat_cellrange.length; j += 1) {
                    const range = CFSplitRange(source_curCdformat_cellrange[j], { row: [c_r1, c_r2], column: [c_c1, c_c2] }, { row: [minh, maxh], column: [minc, maxc] }, "restPart");
                    emptyRange = emptyRange.concat(range);
                    const range2 = CFSplitRange(source_curCdformat_cellrange[j], { row: [c_r1, c_r2], column: [c_c1, c_c2] }, { row: [minh, maxh], column: [minc, maxc] }, "operatePart");
                    if (range2.length > 0) {
                        emptyRange2 = emptyRange2.concat(range2);
                    }
                }
                source_curCdformat[i].cellrange = emptyRange;
                if (emptyRange2.length > 0) {
                    const ruleObj = (_l = source_curCdformat[i]) !== null && _l !== void 0 ? _l : {};
                    ruleObj.cellrange = emptyRange2;
                    ruleArr.push(ruleObj);
                }
            }
        }
        const target_cdformat = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
            .luckysheet_conditionformat_save);
        let target_curCdformat = _.cloneDeep(target_cdformat);
        if (ruleArr.length > 0) {
            target_curCdformat = target_curCdformat === null || target_curCdformat === void 0 ? void 0 : target_curCdformat.concat(ruleArr);
        }
        for (let i = c_r1; i <= c_r2; i += 1) {
            for (let j = c_c1; j <= c_c2; j += 1) {
                delete c_dataVerification[`${i}_${j}`];
            }
        }
        source = {
            sheetId: copySheetId,
            data: sourceData,
            curData: sourceCurData,
            config: sourceConfig,
            curConfig: sourceCurConfig,
            cdformat: source_cdformat,
            curCdformat: source_curCdformat,
            dataVerification: _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, copySheetId)].dataVerification),
            curDataVerification: c_dataVerification,
            range: {
                row: [c_r1, c_r2],
                column: [c_c1, c_c2],
            },
        };
        target = {
            sheetId: ctx.currentSheetId,
            data: getFlowdata(ctx),
            curData: d,
            config: _.cloneDeep(ctx.config),
            curConfig: cfg,
            cdformat: target_cdformat,
            curCdformat: target_curCdformat,
            dataVerification: _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
                .dataVerification),
            curDataVerification: dataVerification,
            range: {
                row: [minh, maxh],
                column: [minc, maxc],
            },
        };
    }
    else {
        const cdformat = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
            .luckysheet_conditionformat_save);
        const curCdformat = _.cloneDeep(cdformat);
        if (curCdformat != null && curCdformat.length > 0) {
            for (let i = 0; i < curCdformat.length; i += 1) {
                const { cellrange } = curCdformat[i];
                let emptyRange = [];
                for (let j = 0; j < cellrange.length; j += 1) {
                    const range = CFSplitRange(cellrange[j], { row: [c_r1, c_r2], column: [c_c1, c_c2] }, { row: [minh, maxh], column: [minc, maxc] }, "allPart");
                    emptyRange = emptyRange.concat(range);
                }
                curCdformat[i].cellrange = emptyRange;
            }
        }
        source = {
            sheetId: ctx.currentSheetId,
            data: getFlowdata(ctx),
            curData: d,
            config: _.cloneDeep(ctx.config),
            curConfig: cfg,
            cdformat,
            curCdformat,
            dataVerification: _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
                .dataVerification),
            curDataVerification: dataVerification,
            range: {
                row: [c_r1, c_r2],
                column: [c_c1, c_c2],
            },
        };
        target = {
            sheetId: ctx.currentSheetId,
            data: getFlowdata(ctx),
            curData: d,
            config: _.cloneDeep(ctx.config),
            curConfig: cfg,
            cdformat,
            curCdformat,
            dataVerification: _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
                .dataVerification),
            curDataVerification: dataVerification,
            range: {
                row: [minh, maxh],
                column: [minc, maxc],
            },
        };
    }
    if (addr > 0 || addc > 0) {
        postPasteCut(ctx, source, target, true);
    }
    else {
        postPasteCut(ctx, source, target, copyRowlChange);
    }
}
function pasteHandlerOfCopyPaste(ctx, copyRange) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const allowEdit = isAllowEdit(ctx);
    if (!allowEdit)
        return;
    if (!copyRange)
        return;
    const cfg = ctx.config;
    if (_.isNil(cfg.merge)) {
        cfg.merge = {};
    }
    const copyHasMC = copyRange.HasMC;
    const copyRowlChange = copyRange.RowlChange;
    const copySheetIndex = copyRange.dataSheetId;
    const c_r1 = copyRange.copyRange[0].row[0];
    const c_r2 = copyRange.copyRange[0].row[1];
    const c_c1 = copyRange.copyRange[0].column[0];
    const c_c2 = copyRange.copyRange[0].column[1];
    let arr = [];
    let isSameRow = false;
    for (let i = 0; i < copyRange.copyRange.length; i += 1) {
        let arrData = getdatabyselection(ctx, {
            row: copyRange.copyRange[i].row,
            column: copyRange.copyRange[i].column,
        }, copySheetIndex);
        if (copyRange.copyRange.length > 1) {
            if (c_r1 === copyRange.copyRange[1].row[0] &&
                c_r2 === copyRange.copyRange[1].row[1]) {
                arrData = arrData[0].map((col, a) => {
                    return arrData.map((row) => {
                        return row[a];
                    });
                });
                arr = arr.concat(arrData);
                isSameRow = true;
            }
            else if (c_c1 === copyRange.copyRange[1].column[0] &&
                c_c2 === copyRange.copyRange[1].column[1]) {
                arr = arr.concat(arrData);
            }
        }
        else {
            arr = arrData;
        }
    }
    if (isSameRow) {
        arr = arr[0].map((col, b) => {
            return arr.map((row) => {
                return row[b];
            });
        });
    }
    const copyData = _.cloneDeep(arr);
    if (copyRange.copyRange.length > 1) {
        for (let i = 0; i < copyData.length; i += 1) {
            for (let j = 0; j < copyData[i].length; j += 1) {
                if (copyData[i][j] != null && copyData[i][j].f != null) {
                    delete copyData[i][j].f;
                    delete copyData[i][j].spl;
                }
            }
        }
    }
    const copyh = copyData.length;
    const copyc = copyData[0].length;
    const last = (_a = ctx.luckysheet_select_save) === null || _a === void 0 ? void 0 : _a[ctx.luckysheet_select_save.length - 1];
    if (!last)
        return;
    const minh = last.row[0];
    let maxh = last.row[1];
    const minc = last.column[0];
    let maxc = last.column[1];
    const mh = (maxh - minh + 1) % copyh;
    const mc = (maxc - minc + 1) % copyc;
    if (mh !== 0 || mc !== 0) {
        maxh = minh + copyh - 1;
        maxc = minc + copyc - 1;
    }
    let has_PartMC = false;
    if (!_.isNil(cfg.merge)) {
        has_PartMC = hasPartMC(ctx, cfg, minh, maxh, minc, maxc);
    }
    if (has_PartMC) {
        return;
    }
    const timesH = (maxh - minh + 1) / copyh;
    const timesC = (maxc - minc + 1) / copyc;
    const d = getFlowdata(ctx);
    if (!d)
        return;
    const rowMaxLength = d.length;
    const cellMaxLength = d[0].length;
    const addr = copyh + minh - rowMaxLength;
    const addc = copyc + minc - cellMaxLength;
    if (addr > 0 || addc > 0) {
        expandRowsAndColumns(d, addr, addc);
    }
    const borderInfoCompute = getBorderInfoCompute(ctx, copySheetIndex);
    const c_dataVerification = _.cloneDeep(ctx.luckysheetfile[getSheetIndex(ctx, copySheetIndex)].dataVerification) || {};
    let dataVerification = null;
    let mth = 0;
    let mtc = 0;
    let maxcellCahe = 0;
    let maxrowCache = 0;
    const file = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)];
    const hiddenRows = new Set(Object.keys(((_b = file.config) === null || _b === void 0 ? void 0 : _b.rowhidden) || {}));
    const hiddenCols = new Set(Object.keys(((_c = file.config) === null || _c === void 0 ? void 0 : _c.colhidden) || {}));
    for (let th = 1; th <= timesH; th += 1) {
        for (let tc = 1; tc <= timesC; tc += 1) {
            mth = minh + (th - 1) * copyh;
            mtc = minc + (tc - 1) * copyc;
            maxrowCache = minh + th * copyh;
            maxcellCahe = minc + tc * copyc;
            const offsetRow = mth - c_r1;
            const offsetCol = mtc - c_c1;
            const offsetMC = {};
            for (let h = mth; h < maxrowCache; h += 1) {
                if (hiddenRows === null || hiddenRows === void 0 ? void 0 : hiddenRows.has(h.toString()))
                    continue;
                const x = d[h];
                for (let c = mtc; c < maxcellCahe; c += 1) {
                    if (hiddenCols === null || hiddenCols === void 0 ? void 0 : hiddenCols.has(c.toString()))
                        continue;
                    if (borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`] &&
                        !borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].s) {
                        const bd_obj = {
                            rangeType: "cell",
                            value: {
                                row_index: h,
                                col_index: c,
                                l: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].l,
                                r: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].r,
                                t: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].t,
                                b: borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`].b,
                            },
                        };
                        if (_.isNil(cfg.borderInfo)) {
                            cfg.borderInfo = [];
                        }
                        cfg.borderInfo.push(bd_obj);
                    }
                    else if (borderInfoCompute[`${h}_${c}`]) {
                        const bd_obj = {
                            rangeType: "cell",
                            value: {
                                row_index: h,
                                col_index: c,
                                l: null,
                                r: null,
                                t: null,
                                b: null,
                            },
                        };
                        if (_.isNil(cfg.borderInfo)) {
                            cfg.borderInfo = [];
                        }
                        cfg.borderInfo.push(bd_obj);
                    }
                    else if (borderInfoCompute[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
                        const bd_obj = {
                            rangeType: "range",
                            borderType: "border-slash",
                            color: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s
                                .color,
                            style: borderInfoCompute[`${c_r1 + h - minh}_${c_c1 + c - minc}`].s
                                .style,
                            range: normalizeSelection(ctx, [{ row: [h, h], column: [c, c] }]),
                        };
                        if (cfg.borderInfo == null) {
                            cfg.borderInfo = [];
                        }
                        cfg.borderInfo.push(bd_obj);
                    }
                    if (c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`]) {
                        if (_.isNil(dataVerification)) {
                            dataVerification = _.cloneDeep(((_d = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]) === null || _d === void 0 ? void 0 : _d.dataVerification) || {});
                        }
                        dataVerification[`${h}_${c}`] =
                            c_dataVerification[`${c_r1 + h - mth}_${c_c1 + c - mtc}`];
                    }
                    if (((_e = x[c]) === null || _e === void 0 ? void 0 : _e.mc) != null) {
                        if ("rs" in x[c].mc) {
                            delete cfg.merge[`${x[c].mc.r}_${x[c].mc.c}`];
                        }
                        delete x[c].mc;
                    }
                    let value = null;
                    if ((_f = copyData[h - mth]) === null || _f === void 0 ? void 0 : _f[c - mtc]) {
                        value = _.cloneDeep(copyData[h - mth][c - mtc]);
                    }
                    if (!_.isNil(value) && !_.isNil(value.f)) {
                        let func = value.f;
                        if (offsetRow > 0) {
                            func = `=${functionCopy(ctx, func, "down", offsetRow)}`;
                        }
                        if (offsetRow < 0) {
                            func = `=${functionCopy(ctx, func, "up", Math.abs(offsetRow))}`;
                        }
                        if (offsetCol > 0) {
                            func = `=${functionCopy(ctx, func, "right", offsetCol)}`;
                        }
                        if (offsetCol < 0) {
                            func = `=${functionCopy(ctx, func, "left", Math.abs(offsetCol))}`;
                        }
                        const funcV = execfunction(ctx, func, h, c, undefined, undefined, true);
                        if (!_.isNil(value.spl)) {
                        }
                        else {
                            [, value.v, value.f] = funcV;
                            if (!_.isNil(value.ct) && !_.isNil(value.ct.fa)) {
                                value.m = update(value.ct.fa, funcV[1]);
                            }
                            else {
                                value.m = update("General", funcV[1]);
                            }
                        }
                    }
                    x[c] = _.cloneDeep(value);
                    if (value != null && copyHasMC && ((_g = x === null || x === void 0 ? void 0 : x[c]) === null || _g === void 0 ? void 0 : _g.mc)) {
                        if (((_j = (_h = x === null || x === void 0 ? void 0 : x[c]) === null || _h === void 0 ? void 0 : _h.mc) === null || _j === void 0 ? void 0 : _j.rs) != null) {
                            x[c].mc.r = h;
                            x[c].mc.c = c;
                            cfg.merge[`${h}_${c}`] = x[c].mc;
                            offsetMC[`${value.mc.r}_${value.mc.c}`] = [
                                x[c].mc.r,
                                x[c].mc.c,
                            ];
                        }
                        else {
                            x[c] = {
                                mc: {
                                    r: offsetMC[`${value.mc.r}_${value.mc.c}`][0],
                                    c: offsetMC[`${value.mc.r}_${value.mc.c}`][1],
                                },
                            };
                        }
                    }
                }
                d[h] = x;
            }
        }
    }
    let cdformat = null;
    if (copyRange.copyRange.length === 1) {
        const c_file = ctx.luckysheetfile[getSheetIndex(ctx, copySheetIndex)];
        const a_file = ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)];
        const ruleArr_cf = _.cloneDeep(c_file.luckysheet_conditionformat_save);
        if (!_.isNil(ruleArr_cf) && ruleArr_cf.length > 0) {
            cdformat = (_k = _.cloneDeep(a_file.luckysheet_conditionformat_save)) !== null && _k !== void 0 ? _k : [];
            for (let i = 0; i < ruleArr_cf.length; i += 1) {
                const cf_range = ruleArr_cf[i].cellrange;
                let emptyRange = [];
                for (let th = 1; th <= timesH; th += 1) {
                    for (let tc = 1; tc <= timesC; tc += 1) {
                        mth = minh + (th - 1) * copyh;
                        mtc = minc + (tc - 1) * copyc;
                        maxrowCache = minh + th * copyh;
                        maxcellCahe = minc + tc * copyc;
                        for (let j = 0; j < cf_range.length; j += 1) {
                            const range = CFSplitRange(cf_range[j], { row: [c_r1, c_r2], column: [c_c1, c_c2] }, { row: [mth, maxrowCache - 1], column: [mtc, maxcellCahe - 1] }, "operatePart");
                            if (range.length > 0) {
                                emptyRange = emptyRange.concat(range);
                            }
                        }
                    }
                }
                if (emptyRange.length > 0) {
                    ruleArr_cf[i].cellrange = emptyRange;
                    cdformat.push(ruleArr_cf[i]);
                }
            }
        }
    }
    last.row = [minh, maxh];
    last.column = [minc, maxc];
    file.config = cfg;
    file.luckysheet_conditionformat_save = cdformat;
    file.dataVerification = { ...file.dataVerification, ...dataVerification };
    if (((_l = ctx.luckysheet_select_save) === null || _l === void 0 ? void 0 : _l.length) === 1 &&
        ((_m = ctx.luckysheet_copy_save) === null || _m === void 0 ? void 0 : _m.copyRange.length) === 1) {
        _.forEach((_o = ctx.luckysheet_copy_save) === null || _o === void 0 ? void 0 : _o.copyRange, (range) => {
            var _a, _b, _c;
            for (let r = 0; r <= range.row[1] - range.row[0]; r += 1) {
                for (let c = 0; c <= range.column[1] - range.column[0]; c += 1) {
                    const index = getSheetIndex(ctx, (_a = ctx.luckysheet_copy_save) === null || _a === void 0 ? void 0 : _a.dataSheetId);
                    if (((_b = ctx.luckysheetfile[index].data[r + range.row[0]][c + range.column[0]]) === null || _b === void 0 ? void 0 : _b.hl) &&
                        ctx.luckysheetfile[index].hyperlink[`${r}_${c}`]) {
                        setCellHyperlink(ctx, (_c = ctx.luckysheet_copy_save) === null || _c === void 0 ? void 0 : _c.dataSheetId, r + ctx.luckysheet_select_save[0].row[0], c + ctx.luckysheet_select_save[0].column[0], ctx.luckysheetfile[index].hyperlink[`${r}_${c}`]);
                    }
                }
            }
        });
    }
    if (copyRowlChange || addr > 0 || addc > 0) {
        jfrefreshgrid(ctx, d, ctx.luckysheet_select_save);
    }
    else {
        jfrefreshgrid(ctx, d, ctx.luckysheet_select_save);
    }
}
function handleFormulaStringPaste(ctx, formulaStr) {
    const r = ctx.luckysheet_select_save[0].row[0];
    const c = ctx.luckysheet_select_save[0].column[0];
    const funcV = execfunction(ctx, formulaStr, r, c, undefined, undefined, true);
    const val = funcV[1];
    const d = getFlowdata(ctx);
    if (!d)
        return;
    if (!d[r][c])
        d[r][c] = {};
    d[r][c].m = val.toString();
    d[r][c].v = val;
    d[r][c].f = formulaStr;
}
/**
 * @param {Context} ctx
 * @param {ClipboardEvent} e
 */
export function handlePaste(ctx, e) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const allowEdit = isAllowEdit(ctx);
    if (!allowEdit)
        return;
    if (selectionCache.isPasteAction) {
        ctx.luckysheetCellUpdate = [];
        selectionCache.isPasteAction = false;
        let { clipboardData } = e;
        if (!clipboardData) {
            clipboardData = window.clipboardData;
        }
        if (!clipboardData)
            return;
        let txtdata = clipboardData.getData("text/html") || clipboardData.getData("text/plain");
        let isEqual = true;
        if (txtdata.indexOf("fortune-copy-action-table") > -1 &&
            ((_a = ctx.luckysheet_copy_save) === null || _a === void 0 ? void 0 : _a.copyRange) != null &&
            ctx.luckysheet_copy_save.copyRange.length > 0) {
            const cpDataArr = [];
            const reg = /<tr.*?>(.*?)<\/tr>/g;
            const reg2 = /<td.*?>(.*?)<\/td>/g;
            const regArr = txtdata.match(reg) || [];
            for (let i = 0; i < regArr.length; i += 1) {
                const cpRowArr = [];
                const reg2Arr = regArr[i].match(reg2);
                if (!_.isNil(reg2Arr)) {
                    for (let j = 0; j < reg2Arr.length; j += 1) {
                        const cpValue = reg2Arr[j]
                            .replace(/<td.*?>/g, "")
                            .replace(/<\/td>/g, "");
                        cpRowArr.push(cpValue);
                    }
                }
                cpDataArr.push(cpRowArr);
            }
            const copy_r1 = ctx.luckysheet_copy_save.copyRange[0].row[0];
            const copy_r2 = ctx.luckysheet_copy_save.copyRange[0].row[1];
            const copy_c1 = ctx.luckysheet_copy_save.copyRange[0].column[0];
            const copy_c2 = ctx.luckysheet_copy_save.copyRange[0].column[1];
            const copy_index = ctx.luckysheet_copy_save.dataSheetId;
            let d;
            if (copy_index === ctx.currentSheetId) {
                d = getFlowdata(ctx);
            }
            else {
                const index = getSheetIndex(ctx, copy_index);
                if (_.isNil(index))
                    return;
                d = ctx.luckysheetfile[index].data;
            }
            if (!d)
                return;
            for (let r = copy_r1; r <= copy_r2; r += 1) {
                if (r - copy_r1 > cpDataArr.length - 1) {
                    break;
                }
                for (let c = copy_c1; c <= copy_c2; c += 1) {
                    const cell = d[r][c];
                    let isInlineStr = false;
                    if (!_.isNil(cell) && !_.isNil(cell.mc) && _.isNil(cell.mc.rs)) {
                        continue;
                    }
                    let v;
                    if (!_.isNil(cell)) {
                        if (((_d = (_c = (_b = cell.ct) === null || _b === void 0 ? void 0 : _b.fa) === null || _c === void 0 ? void 0 : _c.indexOf("w")) !== null && _d !== void 0 ? _d : -1) > -1) {
                            v = (_f = (_e = d[r]) === null || _e === void 0 ? void 0 : _e[c]) === null || _f === void 0 ? void 0 : _f.v;
                        }
                        else {
                            v = (_h = (_g = d[r]) === null || _g === void 0 ? void 0 : _g[c]) === null || _h === void 0 ? void 0 : _h.m;
                        }
                    }
                    else {
                        v = "";
                    }
                    if (_.isNil(v) && ((_l = (_k = (_j = d[r]) === null || _j === void 0 ? void 0 : _j[c]) === null || _k === void 0 ? void 0 : _k.ct) === null || _l === void 0 ? void 0 : _l.t) === "inlineStr") {
                        v = d[r][c].ct.s.map((val) => val.v).join("");
                        isInlineStr = true;
                    }
                    if (_.isNil(v)) {
                        v = "";
                    }
                    if (isInlineStr) {
                    }
                    else {
                        if (_.trim(cpDataArr[r - copy_r1][c - copy_c1]) !== _.trim(v)) {
                            isEqual = false;
                            break;
                        }
                    }
                }
            }
        }
        const locale_fontjson = locale(ctx).fontjson;
        if (((_o = (_m = ctx.hooks).beforePaste) === null || _o === void 0 ? void 0 : _o.call(_m, ctx.luckysheet_select_save, txtdata)) === false) {
            return;
        }
        if (txtdata.indexOf("fortune-copy-action-table") > -1 &&
            ((_p = ctx.luckysheet_copy_save) === null || _p === void 0 ? void 0 : _p.copyRange) != null &&
            ctx.luckysheet_copy_save.copyRange.length > 0 &&
            isEqual) {
            if (ctx.luckysheet_paste_iscut) {
                ctx.luckysheet_paste_iscut = false;
                pasteHandlerOfCutPaste(ctx, ctx.luckysheet_copy_save);
                ctx.luckysheet_selection_range = [];
            }
            else {
                pasteHandlerOfCopyPaste(ctx, ctx.luckysheet_copy_save);
            }
        }
        else if (txtdata.indexOf("fortune-copy-action-image") > -1) {
        }
        else {
            if (txtdata.indexOf("table") > -1) {
                const ele = document.createElement("div");
                ele.innerHTML = txtdata;
                const trList = ele.querySelectorAll("table tr");
                if (trList.length === 0) {
                    ele.remove();
                    return;
                }
                const data = new Array(trList.length);
                let colLen = 0;
                _.forEach(trList[0].querySelectorAll("td"), (td) => {
                    let colspan = td.colSpan;
                    if (Number.isNaN(colspan)) {
                        colspan = 1;
                    }
                    colLen += colspan;
                });
                for (let i = 0; i < data.length; i += 1) {
                    data[i] = new Array(colLen);
                }
                let r = 0;
                const borderInfo = {};
                const styleInner = ((_q = ele.querySelectorAll("style")[0]) === null || _q === void 0 ? void 0 : _q.innerHTML) || "";
                const patternReg = /{([^}]*)}/g;
                const patternStyle = styleInner.match(patternReg);
                const nameReg = /^[^\t].*/gm;
                const patternName = _.initial(styleInner.match(nameReg));
                const allStyleList = patternName.length === (patternStyle === null || patternStyle === void 0 ? void 0 : patternStyle.length) &&
                    typeof patternName === typeof patternStyle
                    ? _.fromPairs(_.zip(patternName, patternStyle))
                    : {};
                const index = getSheetIndex(ctx, ctx.currentSheetId);
                if (!_.isNil(index)) {
                    if (_.isNil(ctx.luckysheetfile[index].config)) {
                        ctx.luckysheetfile[index].config = {};
                    }
                    if (_.isNil(ctx.luckysheetfile[index].config.rowlen)) {
                        ctx.luckysheetfile[index].config.rowlen = {};
                    }
                    const rowHeightList = ctx.luckysheetfile[index].config.rowlen;
                    _.forEach(trList, (tr) => {
                        let c = 0;
                        const targetR = ctx.luckysheet_select_save[0].row[0] + r;
                        const targetRowHeight = !_.isNil(tr.getAttribute("height"))
                            ? parseInt(tr.getAttribute("height"), 10)
                            : null;
                        if ((_.has(ctx.luckysheetfile[index].config.rowlen, targetR) &&
                            ctx.luckysheetfile[index].config.rowlen[targetR] !==
                                targetRowHeight) ||
                            (!_.has(ctx.luckysheetfile[index].config.rowlen, targetR) &&
                                ctx.luckysheetfile[index].defaultRowHeight !== targetRowHeight)) {
                            rowHeightList[targetR] = targetRowHeight;
                        }
                        _.forEach(tr.querySelectorAll("td"), (td) => {
                            const { className } = td;
                            const cell = {};
                            const txt = td.innerText || td.innerHTML;
                            if (_.trim(txt).length === 0) {
                                cell.v = undefined;
                                cell.m = "";
                            }
                            else {
                                const mask = genarate(txt);
                                [cell.m, cell.ct, cell.v] = mask;
                            }
                            const styleString = typeof allStyleList[`.${className}`] === "string"
                                ? allStyleList[`.${className}`]
                                    .substring(1, allStyleList[`.${className}`].length - 1)
                                    .split("\n\t")
                                : [];
                            const styles = {};
                            _.forEach(styleString, (s) => {
                                const styleList = s.split(":");
                                styles[styleList[0]] = styleList === null || styleList === void 0 ? void 0 : styleList[1].replace(";", "");
                            });
                            if (!_.isNil(styles.border))
                                td.style.border = styles.border;
                            let bg = td.style.backgroundColor || styles.background;
                            if (bg === "rgba(0, 0, 0, 0)" || _.isEmpty(bg)) {
                                bg = undefined;
                            }
                            cell.bg = bg;
                            const fontWight = td.style.fontWeight;
                            cell.bl =
                                (fontWight.toString() === "400" ||
                                    fontWight === "normal" ||
                                    _.isEmpty(fontWight)) &&
                                    !_.includes(styles["font-style"], "bold") &&
                                    (!styles["font-weight"] || styles["font-weight"] === "400")
                                    ? 0
                                    : 1;
                            cell.it =
                                (td.style.fontStyle === "normal" ||
                                    _.isEmpty(td.style.fontStyle)) &&
                                    !_.includes(styles["font-style"], "italic")
                                    ? 0
                                    : 1;
                            cell.un = !_.includes(styles["text-decoration"], "underline")
                                ? undefined
                                : 1;
                            cell.cl = !_.includes(td.innerHTML, "<s>") ? undefined : 1;
                            const ff = td.style.fontFamily || styles["font-family"] || "";
                            const ffs = ff.split(",");
                            for (let i = 0; i < ffs.length; i += 1) {
                                let fa = _.trim(ffs[i].toLowerCase());
                                fa = locale_fontjson[fa];
                                if (_.isNil(fa)) {
                                    cell.ff = 0;
                                }
                                else {
                                    cell.ff = fa;
                                    break;
                                }
                            }
                            const fs = Math.round(styles["font-size"]
                                ? parseInt(styles["font-size"].replace("pt", ""), 10)
                                : (parseInt(td.style.fontSize || "13", 10) * 72) / 96);
                            cell.fs = fs;
                            cell.fc = td.style.color || styles.color;
                            const ht = td.style.textAlign || styles["text-align"] || "left";
                            if (ht === "center") {
                                cell.ht = 0;
                            }
                            else if (ht === "right") {
                                cell.ht = 2;
                            }
                            else {
                                cell.ht = 1;
                            }
                            const regex = /vertical-align:\s*(.*?);/;
                            const vt = td.style.verticalAlign ||
                                styles["vertical-align"] ||
                                (!_.isNil(allStyleList.td) &&
                                    allStyleList.td.match(regex).length > 0 &&
                                    allStyleList.td.match(regex)[1]) ||
                                "top";
                            if (vt === "middle") {
                                cell.vt = 0;
                            }
                            else if (vt === "top" || vt === "text-top") {
                                cell.vt = 1;
                            }
                            else {
                                cell.vt = 2;
                            }
                            if ("mso-rotate" in styles) {
                                const rt = styles["mso-rotate"];
                                cell.rt = parseFloat(rt);
                            }
                            while (c < colLen && !_.isNil(data[r][c])) {
                                c += 1;
                            }
                            if (c === colLen) {
                                return true;
                            }
                            if (_.isNil(data[r][c])) {
                                data[r][c] = cell;
                                let rowspan = parseInt(td.getAttribute("rowspan"), 10);
                                let colspan = parseInt(td.getAttribute("colspan"), 10);
                                if (Number.isNaN(rowspan)) {
                                    rowspan = 1;
                                }
                                if (Number.isNaN(colspan)) {
                                    colspan = 1;
                                }
                                const r_ab = ctx.luckysheet_select_save[0].row[0] + r;
                                const c_ab = ctx.luckysheet_select_save[0].column[0] + c;
                                for (let rp = 0; rp < rowspan; rp += 1) {
                                    for (let cp = 0; cp < colspan; cp += 1) {
                                        if (rp === 0) {
                                            const bt = td.style.borderTop;
                                            if (!_.isEmpty(bt) &&
                                                bt.substring(0, 3).toLowerCase() !== "0px") {
                                                const width = td.style.borderTopWidth;
                                                const type = td.style.borderTopStyle;
                                                const color = td.style.borderTopColor;
                                                const borderconfig = getQKBorder(width, type, color);
                                                if (!borderInfo[`${r + rp}_${c + cp}`]) {
                                                    borderInfo[`${r + rp}_${c + cp}`] = {};
                                                }
                                                borderInfo[`${r + rp}_${c + cp}`].t = {
                                                    style: borderconfig[0],
                                                    color: borderconfig[1],
                                                };
                                            }
                                        }
                                        if (rp === rowspan - 1) {
                                            const bb = td.style.borderBottom;
                                            if (!_.isEmpty(bb) &&
                                                bb.substring(0, 3).toLowerCase() !== "0px") {
                                                const width = td.style.borderBottomWidth;
                                                const type = td.style.borderBottomStyle;
                                                const color = td.style.borderBottomColor;
                                                const borderconfig = getQKBorder(width, type, color);
                                                if (!borderInfo[`${r + rp}_${c + cp}`]) {
                                                    borderInfo[`${r + rp}_${c + cp}`] = {};
                                                }
                                                borderInfo[`${r + rp}_${c + cp}`].b = {
                                                    style: borderconfig[0],
                                                    color: borderconfig[1],
                                                };
                                            }
                                        }
                                        if (cp === 0) {
                                            const bl = td.style.borderLeft;
                                            if (!_.isEmpty(bl) &&
                                                bl.substring(0, 3).toLowerCase() !== "0px") {
                                                const width = td.style.borderLeftWidth;
                                                const type = td.style.borderLeftStyle;
                                                const color = td.style.borderLeftColor;
                                                const borderconfig = getQKBorder(width, type, color);
                                                if (!borderInfo[`${r + rp}_${c + cp}`]) {
                                                    borderInfo[`${r + rp}_${c + cp}`] = {};
                                                }
                                                borderInfo[`${r + rp}_${c + cp}`].l = {
                                                    style: borderconfig[0],
                                                    color: borderconfig[1],
                                                };
                                            }
                                        }
                                        if (cp === colspan - 1) {
                                            const br = td.style.borderLeft;
                                            if (!_.isEmpty(br) &&
                                                br.substring(0, 3).toLowerCase() !== "0px") {
                                                const width = td.style.borderRightWidth;
                                                const type = td.style.borderRightStyle;
                                                const color = td.style.borderRightColor;
                                                const borderconfig = getQKBorder(width, type, color);
                                                if (!borderInfo[`${r + rp}_${c + cp}`]) {
                                                    borderInfo[`${r + rp}_${c + cp}`] = {};
                                                }
                                                borderInfo[`${r + rp}_${c + cp}`].r = {
                                                    style: borderconfig[0],
                                                    color: borderconfig[1],
                                                };
                                            }
                                        }
                                        if (rp === 0 && cp === 0) {
                                            continue;
                                        }
                                        data[r + rp][c + cp] = { mc: { r: r_ab, c: c_ab } };
                                    }
                                }
                                if (rowspan > 1 || colspan > 1) {
                                    const first = { rs: rowspan, cs: colspan, r: r_ab, c: c_ab };
                                    data[r][c].mc = first;
                                }
                            }
                            c += 1;
                            if (c === colLen) {
                                return true;
                            }
                            return true;
                        });
                        r += 1;
                    });
                    setRowHeight(ctx, rowHeightList);
                }
                ctx.luckysheet_selection_range = [];
                pasteHandler(ctx, data, borderInfo);
                ele.remove();
            }
            else if (clipboardData.files.length === 1 &&
                clipboardData.files[0].type.indexOf("image") > -1) {
            }
            else {
                txtdata = clipboardData.getData("text/plain");
                const isExcelFormula = txtdata.startsWith("=");
                if (isExcelFormula) {
                    handleFormulaStringPaste(ctx, txtdata);
                }
                else {
                    pasteHandler(ctx, txtdata);
                }
            }
        }
    }
    else if (ctx.luckysheetCellUpdate.length > 0) {
        e.preventDefault();
        let { clipboardData } = e;
        if (!clipboardData) {
            clipboardData = window.clipboardData;
        }
        const text = clipboardData === null || clipboardData === void 0 ? void 0 : clipboardData.getData("text/plain");
        if (text) {
            document.execCommand("insertText", false, text);
        }
    }
}
/**
 * @param {Context} ctx
 * @param {string} clipboardData
 * @param {string} [triggerType]
 */
export function handlePasteByClick(ctx, clipboardData, triggerType) {
    var _a, _b, _c;
    const allowEdit = isAllowEdit(ctx);
    if (!allowEdit)
        return;
    if (clipboardData)
        clipboard.writeHtml(clipboardData);
    const textarea = document.querySelector("#fortune-copy-content");
    const data = (textarea === null || textarea === void 0 ? void 0 : textarea.innerHTML) || (textarea === null || textarea === void 0 ? void 0 : textarea.textContent);
    if (!data)
        return;
    if (((_b = (_a = ctx.hooks).beforePaste) === null || _b === void 0 ? void 0 : _b.call(_a, ctx.luckysheet_select_save, data)) === false) {
        return;
    }
    if (data.indexOf("fortune-copy-action-table") > -1 &&
        ((_c = ctx.luckysheet_copy_save) === null || _c === void 0 ? void 0 : _c.copyRange) != null &&
        ctx.luckysheet_copy_save.copyRange.length > 0) {
        if (ctx.luckysheet_paste_iscut) {
            ctx.luckysheet_paste_iscut = false;
            pasteHandlerOfCutPaste(ctx, ctx.luckysheet_copy_save);
        }
        else {
            pasteHandlerOfCopyPaste(ctx, ctx.luckysheet_copy_save);
        }
    }
    else if (data.indexOf("fortune-copy-action-image") > -1) {
    }
    else if (triggerType !== "btn") {
        const isExcelFormula = clipboardData.startsWith("=");
        if (isExcelFormula) {
            handleFormulaStringPaste(ctx, clipboardData);
        }
        else {
            pasteHandler(ctx, clipboardData);
        }
    }
    else {
    }
}

/**
 * @typedef {import("./context.js").Context} Context
 */
