import _ from "lodash";
import { getFlowdata } from "../context";
import { getSheetIndex } from "../utils";
/**
 * @param {Context} ctx
 * @param {number} dataset_row_st
 * @param {number} dataset_row_ed
 * @param {number} dataset_col_st
 * @param {number} dataset_col_ed
 * @param {string} [sheetId]
 * @returns {Record<string, any>}
 */
export function getBorderInfoComputeRange(ctx, dataset_row_st, dataset_row_ed, dataset_col_st, dataset_col_ed, sheetId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102, _103, _104, _105, _106, _107, _108, _109, _110, _111, _112, _113, _114, _115, _116, _117, _118, _119, _120, _121, _122, _123, _124, _125, _126, _127, _128, _129, _130, _131, _132, _133, _134, _135, _136;
    const borderInfoCompute = {};
    const flowdata = getFlowdata(ctx);
    let cfg;
    let data;
    if (!sheetId) {
        cfg = ctx.config;
        data = flowdata;
    }
    else {
        const index = getSheetIndex(ctx, sheetId);
        if (!_.isNil(index)) {
            cfg = ctx.luckysheetfile[index].config;
            data = ctx.luckysheetfile[index].data;
        }
        else {
            return borderInfoCompute;
        }
    }
    if (!data || !cfg)
        return borderInfoCompute;
    const { borderInfo } = cfg;
    if (!borderInfo || _.isEmpty(borderInfo))
        return borderInfoCompute;
    for (let i = 0; i < borderInfo.length; i += 1) {
        const { rangeType } = borderInfo[i];
        if (rangeType === "range") {
            const { borderType } = borderInfo[i];
            const borderColor = borderInfo[i].color;
            const borderStyle = borderInfo[i].style;
            const borderRange = borderInfo[i].range;
            for (let j = 0; j < borderRange.length; j += 1) {
                let bd_r1 = borderRange[j].row[0];
                let bd_r2 = borderRange[j].row[1];
                let bd_c1 = borderRange[j].column[0];
                let bd_c2 = borderRange[j].column[1];
                if (bd_r1 < dataset_row_st) {
                    bd_r1 = dataset_row_st;
                }
                if (bd_r2 > dataset_row_ed) {
                    bd_r2 = dataset_row_ed;
                }
                if (bd_c1 < dataset_col_st) {
                    bd_c1 = dataset_col_st;
                }
                if (bd_c2 > dataset_col_ed) {
                    bd_c2 = dataset_col_ed;
                }
                if (borderType === "border-slash") {
                    const bd_r = borderRange[0].row_focus;
                    const bd_c = borderRange[0].column_focus;
                    if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                        continue;
                    }
                    if (bd_c < dataset_col_st || bd_c > dataset_col_ed)
                        continue;
                    if (bd_r < dataset_row_st || bd_r > dataset_row_ed)
                        continue;
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }
                    borderInfoCompute[`${bd_r}_${bd_c}`].s = {
                        color: borderColor,
                        style: borderStyle,
                    };
                }
                if (borderType === "border-left") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        if (borderInfoCompute[`${bd_r}_${bd_c1}`] === undefined) {
                            borderInfoCompute[`${bd_r}_${bd_c1}`] = {};
                        }
                        borderInfoCompute[`${bd_r}_${bd_c1}`].l = {
                            color: borderColor,
                            style: borderStyle,
                        };
                        const bd_c_left = bd_c1 - 1;
                        if (bd_c_left >= 0 && borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
                            if (!_.isNil((_b = (_a = data[bd_r]) === null || _a === void 0 ? void 0 : _a[bd_c_left]) === null || _b === void 0 ? void 0 : _b.mc)) {
                                const cell_left = data[bd_r][bd_c_left];
                                const mc = (_c = cfg.merge) === null || _c === void 0 ? void 0 : _c[`${(_d = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _d === void 0 ? void 0 : _d.r}_${(_e = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _e === void 0 ? void 0 : _e.c}`];
                                if (mc && mc.c + mc.cs - 1 === bd_c_left) {
                                    borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                            }
                        }
                        const mc = cfg.merge || {};
                        Object.keys(mc).forEach((key) => {
                            const { c, r, cs, rs } = mc[key];
                            if (bd_c1 <= c + cs - 1 &&
                                bd_c1 > c &&
                                bd_r >= r &&
                                bd_r <= r + rs - 1) {
                                borderInfoCompute[`${bd_r}_${bd_c1}`].l = null;
                            }
                        });
                    }
                }
                else if (borderType === "border-right") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        if (borderInfoCompute[`${bd_r}_${bd_c2}`] === undefined) {
                            borderInfoCompute[`${bd_r}_${bd_c2}`] = {};
                        }
                        borderInfoCompute[`${bd_r}_${bd_c2}`].r = {
                            color: borderColor,
                            style: borderStyle,
                        };
                        const bd_c_right = bd_c2 + 1;
                        if (bd_c_right < data[0].length &&
                            borderInfoCompute[`${bd_r}_${bd_c_right}`]) {
                            if (!_.isNil((_g = (_f = data[bd_r]) === null || _f === void 0 ? void 0 : _f[bd_c_right]) === null || _g === void 0 ? void 0 : _g.mc)) {
                                const cell_right = data[bd_r][bd_c_right];
                                const mc = (_h = cfg.merge) === null || _h === void 0 ? void 0 : _h[`${(_j = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _j === void 0 ? void 0 : _j.r}_${(_k = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _k === void 0 ? void 0 : _k.c}`];
                                if (mc && mc.c === bd_c_right) {
                                    borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                            }
                        }
                        const mc = cfg.merge || {};
                        Object.keys(mc).forEach((key) => {
                            const { c, r, cs, rs } = mc[key];
                            if (bd_c2 < c + cs - 1 &&
                                bd_c2 >= c &&
                                bd_r >= r &&
                                bd_r <= r + rs - 1) {
                                borderInfoCompute[`${bd_r}_${bd_c2}`].r = null;
                            }
                        });
                    }
                }
                else if (borderType === "border-top") {
                    if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r1])) {
                        continue;
                    }
                    for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                        if (borderInfoCompute[`${bd_r1}_${bd_c}`] === undefined) {
                            borderInfoCompute[`${bd_r1}_${bd_c}`] = {};
                        }
                        borderInfoCompute[`${bd_r1}_${bd_c}`].t = {
                            color: borderColor,
                            style: borderStyle,
                        };
                        const bd_r_top = bd_r1 - 1;
                        if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                            if (!_.isNil((_m = (_l = data[bd_r_top]) === null || _l === void 0 ? void 0 : _l[bd_c]) === null || _m === void 0 ? void 0 : _m.mc)) {
                                const cell_top = data[bd_r_top][bd_c];
                                const mc = (_o = cfg.merge) === null || _o === void 0 ? void 0 : _o[`${(_p = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _p === void 0 ? void 0 : _p.r}_${(_q = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _q === void 0 ? void 0 : _q.c}`];
                                if (mc && mc.r + mc.rs - 1 === bd_r_top) {
                                    borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                            }
                        }
                        const mc = cfg.merge || {};
                        Object.keys(mc).forEach((key) => {
                            const { c, r, cs, rs } = mc[key];
                            if (bd_r1 <= r + rs - 1 &&
                                bd_r1 > r &&
                                bd_c >= c &&
                                bd_c <= c + cs - 1) {
                                borderInfoCompute[`${bd_r1}_${bd_c}`].t = null;
                            }
                        });
                    }
                }
                else if (borderType === "border-bottom") {
                    if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r2])) {
                        continue;
                    }
                    for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                        if (borderInfoCompute[`${bd_r2}_${bd_c}`] === undefined) {
                            borderInfoCompute[`${bd_r2}_${bd_c}`] = {};
                        }
                        borderInfoCompute[`${bd_r2}_${bd_c}`].b = {
                            color: borderColor,
                            style: borderStyle,
                        };
                        const bd_r_bottom = bd_r2 + 1;
                        if (bd_r_bottom < data.length &&
                            borderInfoCompute[`${bd_r_bottom}_${bd_c}`]) {
                            if (!_.isNil((_s = (_r = data[bd_r_bottom]) === null || _r === void 0 ? void 0 : _r[bd_c]) === null || _s === void 0 ? void 0 : _s.mc)) {
                                const cell_bottom = data[bd_r_bottom][bd_c];
                                const mc = (_t = cfg.merge) === null || _t === void 0 ? void 0 : _t[`${(_u = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _u === void 0 ? void 0 : _u.r}_${(_v = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _v === void 0 ? void 0 : _v.c}`];
                                if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r_bottom) {
                                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                            }
                        }
                        const mc = cfg.merge || {};
                        Object.keys(mc).forEach((key) => {
                            const { c, r, cs, rs } = mc[key];
                            if (bd_r2 < r + rs - 1 &&
                                bd_r2 >= r &&
                                bd_c >= c &&
                                bd_c <= c + cs - 1) {
                                borderInfoCompute[`${bd_r2}_${bd_c}`].b = null;
                            }
                        });
                    }
                }
                else if (borderType === "border-all") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                            if (!_.isNil((_x = (_w = data[bd_r]) === null || _w === void 0 ? void 0 : _w[bd_c]) === null || _x === void 0 ? void 0 : _x.mc)) {
                                const cell = data[bd_r][bd_c];
                                const mc = (_y = cfg.merge) === null || _y === void 0 ? void 0 : _y[`${(_z = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _z === void 0 ? void 0 : _z.r}_${(_0 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _0 === void 0 ? void 0 : _0.c}`];
                                if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r) {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                                if (mc && mc.r + mc.rs - 1 === bd_r) {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                                if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c) {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                                if (mc && mc.c + mc.cs - 1 === bd_c) {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                }
                                borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                            }
                            if (bd_r === bd_r1) {
                                const bd_r_top = bd_r1 - 1;
                                if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                                    if (!_.isNil((_2 = (_1 = data[bd_r_top]) === null || _1 === void 0 ? void 0 : _1[bd_c]) === null || _2 === void 0 ? void 0 : _2.mc)) {
                                        const cell_top = data[bd_r_top][bd_c];
                                        const mc = (_3 = cfg.merge) === null || _3 === void 0 ? void 0 : _3[`${(_4 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _4 === void 0 ? void 0 : _4.r}_${(_5 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _5 === void 0 ? void 0 : _5.c}`];
                                        if (mc && mc.r + mc.rs - 1 === bd_r_top) {
                                            borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            if (bd_r === bd_r2) {
                                const bd_r_bottom = bd_r2 + 1;
                                if (bd_r_bottom < data.length &&
                                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`]) {
                                    if (!_.isNil((_7 = (_6 = data[bd_r_bottom]) === null || _6 === void 0 ? void 0 : _6[bd_c]) === null || _7 === void 0 ? void 0 : _7.mc)) {
                                        const cell_bottom = data[bd_r_bottom][bd_c];
                                        const mc = (_8 = cfg.merge) === null || _8 === void 0 ? void 0 : _8[`${(_9 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _9 === void 0 ? void 0 : _9.r}_${(_10 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _10 === void 0 ? void 0 : _10.c}`];
                                        if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r_bottom) {
                                            borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            if (bd_c === bd_c1) {
                                const bd_c_left = bd_c1 - 1;
                                if (bd_c_left >= 0 &&
                                    borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
                                    if (!_.isNil((_12 = (_11 = data[bd_r]) === null || _11 === void 0 ? void 0 : _11[bd_c_left]) === null || _12 === void 0 ? void 0 : _12.mc)) {
                                        const cell_left = data[bd_r][bd_c_left];
                                        const mc = (_13 = cfg.merge) === null || _13 === void 0 ? void 0 : _13[`${(_14 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _14 === void 0 ? void 0 : _14.r}_${(_15 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _15 === void 0 ? void 0 : _15.c}`];
                                        if (mc && mc.c + mc.cs - 1 === bd_c_left) {
                                            borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            if (bd_c === bd_c2) {
                                const bd_c_right = bd_c2 + 1;
                                if (bd_c_right < data[0].length &&
                                    borderInfoCompute[`${bd_r}_${bd_c_right}`]) {
                                    if (!_.isNil((_17 = (_16 = data[bd_r]) === null || _16 === void 0 ? void 0 : _16[bd_c_right]) === null || _17 === void 0 ? void 0 : _17.mc)) {
                                        const cell_right = data[bd_r][bd_c_right];
                                        const mc = (_18 = cfg.merge) === null || _18 === void 0 ? void 0 : _18[`${(_19 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _19 === void 0 ? void 0 : _19.r}_${(_20 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _20 === void 0 ? void 0 : _20.c}`];
                                        if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c_right) {
                                            borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                else if (borderType === "border-outside") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                            if (!(bd_r === bd_r1 ||
                                bd_r === bd_r2 ||
                                bd_c === bd_c1 ||
                                bd_c === bd_c2)) {
                                continue;
                            }
                            if (bd_r === bd_r1) {
                                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                }
                                borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                const bd_r_top = bd_r1 - 1;
                                if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                                    if (!_.isNil((_22 = (_21 = data[bd_r_top]) === null || _21 === void 0 ? void 0 : _21[bd_c]) === null || _22 === void 0 ? void 0 : _22.mc)) {
                                        const cell_top = data[bd_r_top][bd_c];
                                        const mc = (_23 = cfg.merge) === null || _23 === void 0 ? void 0 : _23[`${(_24 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _24 === void 0 ? void 0 : _24.r}_${(_25 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _25 === void 0 ? void 0 : _25.c}`];
                                        if (mc && mc.r + mc.rs - 1 === bd_r_top) {
                                            borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            if (bd_r === bd_r2) {
                                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                }
                                borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                const bd_r_bottom = bd_r2 + 1;
                                if (bd_r_bottom < data.length &&
                                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`]) {
                                    if (!_.isNil((_27 = (_26 = data[bd_r_bottom]) === null || _26 === void 0 ? void 0 : _26[bd_c]) === null || _27 === void 0 ? void 0 : _27.mc)) {
                                        const cell_bottom = data[bd_r_bottom][bd_c];
                                        const mc = (_28 = cfg.merge) === null || _28 === void 0 ? void 0 : _28[`${(_29 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _29 === void 0 ? void 0 : _29.r}_${(_30 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _30 === void 0 ? void 0 : _30.c}`];
                                        if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r_bottom) {
                                            borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            if (bd_c === bd_c1) {
                                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                }
                                borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                const bd_c_left = bd_c1 - 1;
                                if (bd_c_left >= 0 &&
                                    borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
                                    if (!_.isNil((_32 = (_31 = data[bd_r]) === null || _31 === void 0 ? void 0 : _31[bd_c_left]) === null || _32 === void 0 ? void 0 : _32.mc)) {
                                        const cell_left = data[bd_r][bd_c_left];
                                        const mc = (_33 = cfg.merge) === null || _33 === void 0 ? void 0 : _33[`${(_34 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _34 === void 0 ? void 0 : _34.r}_${(_35 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _35 === void 0 ? void 0 : _35.c}`];
                                        if (mc && mc.c + mc.cs - 1 === bd_c_left) {
                                            borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            if (bd_c === bd_c2) {
                                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                }
                                borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                    color: borderColor,
                                    style: borderStyle,
                                };
                                const bd_c_right = bd_c2 + 1;
                                if (bd_c_right < data[0].length &&
                                    borderInfoCompute[`${bd_r}_${bd_c_right}`]) {
                                    if (!_.isNil((_37 = (_36 = data[bd_r]) === null || _36 === void 0 ? void 0 : _36[bd_c_right]) === null || _37 === void 0 ? void 0 : _37.mc)) {
                                        const cell_right = data[bd_r][bd_c_right];
                                        const mc = (_38 = cfg.merge) === null || _38 === void 0 ? void 0 : _38[`${(_39 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _39 === void 0 ? void 0 : _39.r}_${(_40 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _40 === void 0 ? void 0 : _40.c}`];
                                        if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c_right) {
                                            borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    else {
                                        borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                else if (borderType === "border-inside") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                            if (bd_r === bd_r1 && bd_c === bd_c1) {
                                if (!_.isNil((_42 = (_41 = data[bd_r]) === null || _41 === void 0 ? void 0 : _41[bd_c]) === null || _42 === void 0 ? void 0 : _42.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    if (!bd_r === bd_r2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    if (!bd_c === bd_c2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            else if (bd_r === bd_r2 && bd_c === bd_c1) {
                                if (!_.isNil((_44 = (_43 = data[bd_r]) === null || _43 === void 0 ? void 0 : _43[bd_c]) === null || _44 === void 0 ? void 0 : _44.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    if (!bd_r === bd_r2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else if (bd_r === bd_r1 && bd_c === bd_c2) {
                                if (!_.isNil((_46 = (_45 = data[bd_r]) === null || _45 === void 0 ? void 0 : _45[bd_c]) === null || _46 === void 0 ? void 0 : _46.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_c === bd_c2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            else if (bd_r === bd_r2 && bd_c === bd_c2) {
                                if (!_.isNil((_48 = (_47 = data[bd_r]) === null || _47 === void 0 ? void 0 : _47[bd_c]) === null || _48 === void 0 ? void 0 : _48.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else if (bd_r === bd_r1) {
                                if (!_.isNil((_50 = (_49 = data[bd_r]) === null || _49 === void 0 ? void 0 : _49[bd_c]) === null || _50 === void 0 ? void 0 : _50.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_51 = cfg.merge) === null || _51 === void 0 ? void 0 : _51[`${(_52 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _52 === void 0 ? void 0 : _52.r}_${(_53 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _53 === void 0 ? void 0 : _53.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.c + mc.cs - 1 === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        if (!bd_r === bd_r2) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_r === bd_r2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    if (!bd_c === bd_c2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            else if (bd_r === bd_r2) {
                                if (!_.isNil((_55 = (_54 = data[bd_r]) === null || _54 === void 0 ? void 0 : _54[bd_c]) === null || _55 === void 0 ? void 0 : _55.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_56 = cfg.merge) === null || _56 === void 0 ? void 0 : _56[`${(_57 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _57 === void 0 ? void 0 : _57.r}_${(_58 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _58 === void 0 ? void 0 : _58.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.c + mc.cs - 1 === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        if (!bd_r === bd_r2) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_r === bd_r2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else if (bd_c === bd_c1) {
                                if (!_.isNil((_60 = (_59 = data[bd_r]) === null || _59 === void 0 ? void 0 : _59[bd_c]) === null || _60 === void 0 ? void 0 : _60.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_61 = cfg.merge) === null || _61 === void 0 ? void 0 : _61[`${(_62 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _62 === void 0 ? void 0 : _62.r}_${(_63 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _63 === void 0 ? void 0 : _63.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.r + mc.rs - 1 === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        if (!bd_c === bd_c2) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    if (!bd_r === bd_r2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_c === bd_c2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            else if (bd_c === bd_c2) {
                                if (!_.isNil((_65 = (_64 = data[bd_r]) === null || _64 === void 0 ? void 0 : _64[bd_c]) === null || _65 === void 0 ? void 0 : _65.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_66 = cfg.merge) === null || _66 === void 0 ? void 0 : _66[`${(_67 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _67 === void 0 ? void 0 : _67.r}_${(_68 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _68 === void 0 ? void 0 : _68.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.r + mc.rs - 1 === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        if (!bd_c === bd_c2) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_c === bd_c2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                            else {
                                if (!_.isNil((_70 = (_69 = data[bd_r]) === null || _69 === void 0 ? void 0 : _69[bd_c]) === null || _70 === void 0 ? void 0 : _70.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_71 = cfg.merge) === null || _71 === void 0 ? void 0 : _71[`${(_72 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _72 === void 0 ? void 0 : _72.r}_${(_73 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _73 === void 0 ? void 0 : _73.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.r + mc.rs - 1 === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        if (!bd_c === bd_c2) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                    if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.c + mc.cs - 1 === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        if (!bd_r === bd_r2) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                                color: borderColor,
                                                style: borderStyle,
                                            };
                                        }
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_r === bd_r2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    if (!bd_c === bd_c2) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                else if (borderType === "border-horizontal") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                            if (bd_r === bd_r1) {
                                if (!_.isNil((_75 = (_74 = data[bd_r]) === null || _74 === void 0 ? void 0 : _74[bd_c]) === null || _75 === void 0 ? void 0 : _75.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else if (bd_r === bd_r2) {
                                if (!_.isNil((_77 = (_76 = data[bd_r]) === null || _76 === void 0 ? void 0 : _76[bd_c]) === null || _77 === void 0 ? void 0 : _77.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                if (!_.isNil((_79 = (_78 = data[bd_r]) === null || _78 === void 0 ? void 0 : _78[bd_c]) === null || _79 === void 0 ? void 0 : _79.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_80 = cfg.merge) === null || _80 === void 0 ? void 0 : _80[`${(_81 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _81 === void 0 ? void 0 : _81.r}_${(_82 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _82 === void 0 ? void 0 : _82.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.r) === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.r + mc.rs - 1 === bd_r) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                        }
                    }
                }
                else if (borderType === "border-vertical") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                            if (bd_c === bd_c1) {
                                if (!_.isNil((_84 = (_83 = data[bd_r]) === null || _83 === void 0 ? void 0 : _83[bd_c]) === null || _84 === void 0 ? void 0 : _84.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else if (bd_c === bd_c2) {
                                if (!_.isNil((_86 = (_85 = data[bd_r]) === null || _85 === void 0 ? void 0 : _85[bd_c]) === null || _86 === void 0 ? void 0 : _86.mc)) {
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                            else {
                                if (!_.isNil((_88 = (_87 = data[bd_r]) === null || _87 === void 0 ? void 0 : _87[bd_c]) === null || _88 === void 0 ? void 0 : _88.mc)) {
                                    const cell = data[bd_r][bd_c];
                                    const mc = (_89 = cfg.merge) === null || _89 === void 0 ? void 0 : _89[`${(_90 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _90 === void 0 ? void 0 : _90.r}_${(_91 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _91 === void 0 ? void 0 : _91.c}`];
                                    if ((mc === null || mc === void 0 ? void 0 : mc.c) === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                    else if (mc && mc.c + mc.cs - 1 === bd_c) {
                                        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                            borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                        }
                                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                            color: borderColor,
                                            style: borderStyle,
                                        };
                                    }
                                }
                                else {
                                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                                        borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                                    }
                                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                                        color: borderColor,
                                        style: borderStyle,
                                    };
                                }
                            }
                        }
                    }
                }
                else if (borderType === "border-none") {
                    for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
                        if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                            continue;
                        }
                        for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
                            if (!_.isNil(borderInfoCompute[`${bd_r}_${bd_c}`])) {
                                delete borderInfoCompute[`${bd_r}_${bd_c}`];
                            }
                            if (bd_r === bd_r1) {
                                const bd_r_top = bd_r1 - 1;
                                if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                                    delete borderInfoCompute[`${bd_r_top}_${bd_c}`].b;
                                }
                            }
                            if (bd_r === bd_r2) {
                                const bd_r_bottom = bd_r2 + 1;
                                if (bd_r_bottom < data.length &&
                                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`]) {
                                    delete borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t;
                                }
                            }
                            if (bd_c === bd_c1) {
                                const bd_c_left = bd_c1 - 1;
                                if (bd_c_left >= 0 &&
                                    borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
                                    delete borderInfoCompute[`${bd_r}_${bd_c_left}`].r;
                                }
                            }
                            if (bd_c === bd_c2) {
                                const bd_c_right = bd_c2 + 1;
                                if (bd_c_right < data[0].length &&
                                    borderInfoCompute[`${bd_r}_${bd_c_right}`]) {
                                    delete borderInfoCompute[`${bd_r}_${bd_c_right}`].l;
                                }
                            }
                        }
                    }
                }
            }
        }
        else if (rangeType === "cell") {
            const { value } = borderInfo[i];
            const bd_r = value.row_index;
            const bd_c = value.col_index;
            if (bd_r < dataset_row_st ||
                bd_r > dataset_row_ed ||
                bd_c < dataset_col_st ||
                bd_c > dataset_col_ed) {
                continue;
            }
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
                continue;
            }
            if (!_.isNil(value.l) ||
                !_.isNil(value.r) ||
                !_.isNil(value.t) ||
                !_.isNil(value.b)) {
                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                }
                if (!_.isNil((_93 = (_92 = data[bd_r]) === null || _92 === void 0 ? void 0 : _92[bd_c]) === null || _93 === void 0 ? void 0 : _93.mc)) {
                    const cell = data[bd_r][bd_c];
                    const mc = (_94 = cfg.merge) === null || _94 === void 0 ? void 0 : _94[`${(_95 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _95 === void 0 ? void 0 : _95.r}_${(_96 = cell === null || cell === void 0 ? void 0 : cell.mc) === null || _96 === void 0 ? void 0 : _96.c}`];
                    if (!_.isNil(value.l) && bd_c === (mc === null || mc === void 0 ? void 0 : mc.c)) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                            color: value.l.color,
                            style: value.l.style,
                        };
                        const bd_c_left = bd_c - 1;
                        if (bd_c_left >= 0 && borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
                            if (!_.isNil((_98 = (_97 = data[bd_r]) === null || _97 === void 0 ? void 0 : _97[bd_c_left]) === null || _98 === void 0 ? void 0 : _98.mc)) {
                                const cell_left = data[bd_r][bd_c_left];
                                const mc_l = (_99 = cfg.merge) === null || _99 === void 0 ? void 0 : _99[`${(_100 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _100 === void 0 ? void 0 : _100.r}_${(_101 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _101 === void 0 ? void 0 : _101.c}`];
                                if (mc_l && mc_l.c + mc_l.cs - 1 === bd_c_left) {
                                    borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                        color: value.l.color,
                                        style: value.l.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                    color: value.l.color,
                                    style: value.l.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].l = null;
                    }
                    if (!_.isNil(value.r) && mc && bd_c === mc.c + mc.cs - 1) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                            color: value.r.color,
                            style: value.r.style,
                        };
                        const bd_c_right = bd_c + 1;
                        if (bd_c_right < data[0].length &&
                            borderInfoCompute[`${bd_r}_${bd_c_right}`]) {
                            if (!_.isNil((_103 = (_102 = data[bd_r]) === null || _102 === void 0 ? void 0 : _102[bd_c_right]) === null || _103 === void 0 ? void 0 : _103.mc)) {
                                const cell_right = data[bd_r][bd_c_right];
                                const mc_r = (_104 = cfg.merge) === null || _104 === void 0 ? void 0 : _104[`${(_105 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _105 === void 0 ? void 0 : _105.r}_${(_106 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _106 === void 0 ? void 0 : _106.c}`];
                                if ((mc_r === null || mc_r === void 0 ? void 0 : mc_r.c) === bd_c_right) {
                                    borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                        color: value.r.color,
                                        style: value.r.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                    color: value.r.color,
                                    style: value.r.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].r = null;
                    }
                    if (!_.isNil(value.t) && bd_r === (mc === null || mc === void 0 ? void 0 : mc.r)) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                            color: value.t.color,
                            style: value.t.style,
                        };
                        const bd_r_top = bd_r - 1;
                        if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                            if (!_.isNil((_108 = (_107 = data[bd_r_top]) === null || _107 === void 0 ? void 0 : _107[bd_c]) === null || _108 === void 0 ? void 0 : _108.mc)) {
                                const cell_top = data[bd_r_top][bd_c];
                                const mc_t = (_109 = cfg.merge) === null || _109 === void 0 ? void 0 : _109[`${(_110 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _110 === void 0 ? void 0 : _110.r}_${(_111 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _111 === void 0 ? void 0 : _111.c}`];
                                if (mc_t && mc_t.r + mc_t.rs - 1 === bd_r_top) {
                                    borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                        color: value.t.color,
                                        style: value.t.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                    color: value.t.color,
                                    style: value.t.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].t = null;
                    }
                    if (!_.isNil(value.b) && mc && bd_r === mc.r + mc.rs - 1) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                            color: value.b.color,
                            style: value.b.style,
                        };
                        const bd_r_bottom = bd_r + 1;
                        if (bd_r_bottom < data.length &&
                            borderInfoCompute[`${bd_r_bottom}_${bd_c}`]) {
                            if (!_.isNil((_113 = (_112 = data[bd_r_bottom]) === null || _112 === void 0 ? void 0 : _112[bd_c]) === null || _113 === void 0 ? void 0 : _113.mc)) {
                                const cell_bottom = data[bd_r_bottom][bd_c];
                                const mc_b = (_114 = cfg.merge) === null || _114 === void 0 ? void 0 : _114[`${(_115 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _115 === void 0 ? void 0 : _115.r}_${(_116 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _116 === void 0 ? void 0 : _116.c}`];
                                if ((mc_b === null || mc_b === void 0 ? void 0 : mc_b.r) === bd_r_bottom) {
                                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                        color: value.b.color,
                                        style: value.b.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                    color: value.b.color,
                                    style: value.b.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].b = null;
                    }
                }
                else {
                    if (!_.isNil(value.l)) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                            color: value.l.color,
                            style: value.l.style,
                        };
                        const bd_c_left = bd_c - 1;
                        if (bd_c_left >= 0 && borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
                            if (!_.isNil((_118 = (_117 = data[bd_r]) === null || _117 === void 0 ? void 0 : _117[bd_c_left]) === null || _118 === void 0 ? void 0 : _118.mc)) {
                                const cell_left = data[bd_r][bd_c_left];
                                const mc_l = (_119 = cfg.merge) === null || _119 === void 0 ? void 0 : _119[`${(_120 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _120 === void 0 ? void 0 : _120.r}_${(_121 = cell_left === null || cell_left === void 0 ? void 0 : cell_left.mc) === null || _121 === void 0 ? void 0 : _121.c}`];
                                if (mc_l && mc_l.c + mc_l.cs - 1 === bd_c_left) {
                                    borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                        color: value.l.color,
                                        style: value.l.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                                    color: value.l.color,
                                    style: value.l.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].l = null;
                    }
                    if (!_.isNil(value.r)) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                            color: value.r.color,
                            style: value.r.style,
                        };
                        const bd_c_right = bd_c + 1;
                        if (bd_c_right < data[0].length &&
                            borderInfoCompute[`${bd_r}_${bd_c_right}`]) {
                            if (!_.isNil(data[bd_r]) &&
                                _.isPlainObject(data[bd_r][bd_c_right]) &&
                                !_.isNil((_123 = (_122 = data[bd_r]) === null || _122 === void 0 ? void 0 : _122[bd_c_right]) === null || _123 === void 0 ? void 0 : _123.mc)) {
                                const cell_right = data[bd_r][bd_c_right];
                                const mc_r = (_124 = cfg.merge) === null || _124 === void 0 ? void 0 : _124[`${(_125 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _125 === void 0 ? void 0 : _125.r}_${(_126 = cell_right === null || cell_right === void 0 ? void 0 : cell_right.mc) === null || _126 === void 0 ? void 0 : _126.c}`];
                                if ((mc_r === null || mc_r === void 0 ? void 0 : mc_r.c) === bd_c_right) {
                                    borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                        color: value.r.color,
                                        style: value.r.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                                    color: value.r.color,
                                    style: value.r.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].r = null;
                    }
                    if (!_.isNil(value.t)) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                            color: value.t.color,
                            style: value.t.style,
                        };
                        const bd_r_top = bd_r - 1;
                        if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                            if (!_.isNil((_128 = (_127 = data[bd_r_top]) === null || _127 === void 0 ? void 0 : _127[bd_c]) === null || _128 === void 0 ? void 0 : _128.mc)) {
                                const cell_top = data[bd_r_top][bd_c];
                                const mc_t = (_129 = cfg.merge) === null || _129 === void 0 ? void 0 : _129[`${(_130 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _130 === void 0 ? void 0 : _130.r}_${(_131 = cell_top === null || cell_top === void 0 ? void 0 : cell_top.mc) === null || _131 === void 0 ? void 0 : _131.c}`];
                                if (mc_t && mc_t.r + mc_t.rs - 1 === bd_r_top) {
                                    borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                        color: value.t.color,
                                        style: value.t.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                                    color: value.t.color,
                                    style: value.t.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].t = null;
                    }
                    if (!_.isNil(value.b)) {
                        borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                            color: value.b.color,
                            style: value.b.style,
                        };
                        const bd_r_bottom = bd_r + 1;
                        if (bd_r_bottom < data.length &&
                            borderInfoCompute[`${bd_r_bottom}_${bd_c}`]) {
                            if (!_.isNil((_133 = (_132 = data[bd_r_bottom]) === null || _132 === void 0 ? void 0 : _132[bd_c]) === null || _133 === void 0 ? void 0 : _133.mc)) {
                                const cell_bottom = data[bd_r_bottom][bd_c];
                                const mc_b = (_134 = cfg.merge) === null || _134 === void 0 ? void 0 : _134[`${(_135 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _135 === void 0 ? void 0 : _135.r}_${(_136 = cell_bottom === null || cell_bottom === void 0 ? void 0 : cell_bottom.mc) === null || _136 === void 0 ? void 0 : _136.c}`];
                                if ((mc_b === null || mc_b === void 0 ? void 0 : mc_b.r) === bd_r_bottom) {
                                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                        color: value.b.color,
                                        style: value.b.style,
                                    };
                                }
                            }
                            else {
                                borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                                    color: value.b.color,
                                    style: value.b.style,
                                };
                            }
                        }
                    }
                    else {
                        borderInfoCompute[`${bd_r}_${bd_c}`].b = null;
                    }
                }
            }
            else {
                delete borderInfoCompute[`${bd_r}_${bd_c}`];
            }
        }
    }
    return borderInfoCompute;
}
/**
 * @param {Context} ctx
 * @param {string} [sheetId]
 * @returns {any}
 */
export function getBorderInfoCompute(ctx, sheetId) {
    let borderInfoCompute = {};
    const flowdata = getFlowdata(ctx);
    let data = {};
    if (sheetId === undefined) {
        data = flowdata;
    }
    else {
        const index = getSheetIndex(ctx, sheetId);
        if (!_.isNil(index)) {
            data = ctx.luckysheetfile[index].data;
        }
        else {
            return borderInfoCompute;
        }
    }
    borderInfoCompute = getBorderInfoComputeRange(ctx, 0, data.length, 0, data[0].length, sheetId);
    return borderInfoCompute;
}

/**
 * @typedef {import("./context.js").Context} Context
 */
