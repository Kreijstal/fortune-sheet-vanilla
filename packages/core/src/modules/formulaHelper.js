import _ from "lodash";
import { execfunction, getcellFormula, getcellrange, iscelldata, isFunctionRange, } from "..";
/**
 * @param {Context} ctx
 * @param {FormulaCell} formulaCell
 * @param {CellMatrix} [data]
 */
export function setFormulaCellInfo(ctx, formulaCell, data) {
    var _a;
    const key = `r${formulaCell.r}c${formulaCell.c}i${formulaCell.id}`;
    const calc_funcStr = getcellFormula(ctx, formulaCell.r, formulaCell.c, formulaCell.id, data);
    if (_.isNil(calc_funcStr)) {
        (_a = ctx.formulaCache.formulaCellInfoMap) === null || _a === void 0 ? true : delete _a[key];
        return;
    }
    const txt1 = calc_funcStr.toUpperCase();
    const isOffsetFunc = txt1.indexOf("INDIRECT(") > -1 ||
        txt1.indexOf("OFFSET(") > -1 ||
        txt1.indexOf("INDEX(") > -1;
    const formulaDependency = [];
    if (isOffsetFunc) {
        isFunctionRange(ctx, calc_funcStr, null, null, formulaCell.id, null, (str_nb) => {
            const range = getcellrange(ctx, _.trim(str_nb), formulaCell.id, data);
            if (!_.isNil(range)) {
                formulaDependency.push(range);
            }
        });
    }
    else if (!(calc_funcStr.substring(0, 2) === '="' &&
        calc_funcStr.substring(calc_funcStr.length - 1, 1) === '"')) {
        let point = 0;
        let squote = -1;
        let dquote = -1;
        const formulaTextArray = [];
        const sq_end_array = [];
        const calc_funcStr_length = calc_funcStr.length;
        for (let j = 0; j < calc_funcStr_length; j += 1) {
            const char = calc_funcStr.charAt(j);
            if (char === "'" && dquote === -1) {
                if (squote === -1) {
                    if (point !== j) {
                        formulaTextArray.push(...calc_funcStr
                            .substring(point, j)
                            .split(/==|!=|<>|<=|>=|[,()=+-/*%&^><]/));
                    }
                    squote = j;
                    point = j;
                }
                else {
                    if (j < calc_funcStr_length - 1 &&
                        calc_funcStr.charAt(j + 1) === "'") {
                        j += 1;
                    }
                    else {
                        point = j + 1;
                        formulaTextArray.push(calc_funcStr.substring(squote, point));
                        sq_end_array.push(formulaTextArray.length - 1);
                        squote = -1;
                    }
                }
            }
            else if (char === '"' && squote === -1) {
                if (dquote === -1) {
                    if (point !== j) {
                        formulaTextArray.push(...calc_funcStr
                            .substring(point, j)
                            .split(/==|!=|<>|<=|>=|[,()=+-/*%&^><]/));
                    }
                    dquote = j;
                    point = j;
                }
                else {
                    if (j < calc_funcStr_length - 1 &&
                        calc_funcStr.charAt(j + 1) === '"') {
                        j += 1;
                    }
                    else {
                        point = j + 1;
                        formulaTextArray.push(calc_funcStr.substring(dquote, point));
                        dquote = -1;
                    }
                }
            }
        }
        if (point !== calc_funcStr_length) {
            formulaTextArray.push(...calc_funcStr
                .substring(point, calc_funcStr_length)
                .split(/==|!=|<>|<=|>=|[,()=+-/*%&^><]/));
        }
        for (let j = sq_end_array.length - 1; j >= 0; j -= 1) {
            if (sq_end_array[j] !== formulaTextArray.length - 1) {
                formulaTextArray[sq_end_array[j]] +=
                    formulaTextArray[sq_end_array[j] + 1];
                formulaTextArray.splice(sq_end_array[j] + 1, 1);
            }
        }
        for (let j = 0; j < formulaTextArray.length; j += 1) {
            const t = formulaTextArray[j];
            if (t.length <= 1) {
                continue;
            }
            if ((t.substring(0, 1) === '"' && t.substring(t.length - 1, 1) === '"') ||
                !iscelldata(t)) {
                continue;
            }
            const range = getcellrange(ctx, _.trim(t), formulaCell.id, data);
            if (_.isNil(range)) {
                continue;
            }
            formulaDependency.push(range);
        }
    }
    const item = {
        formulaDependency,
        calc_funcStr,
        key,
        r: formulaCell.r,
        c: formulaCell.c,
        id: formulaCell.id,
        parents: {},
        chidren: {},
        color: "w",
    };
    if (!ctx.formulaCache.formulaCellInfoMap)
        ctx.formulaCache.formulaCellInfoMap = {};
    ctx.formulaCache.formulaCellInfoMap[key] = item;
}
/**
 * @param {Context} ctx
 * @param {Array<any>} formulaRunList
 * @param {any} calcChains
 */
export function executeAffectedFormulas(ctx, formulaRunList, calcChains) {
    const calcChainSet = new Set();
    calcChains.forEach((item) => {
        calcChainSet.add(`${item.r}_${item.c}_${item.id}`);
    });
    for (let i = 0; i < formulaRunList.length; i += 1) {
        const formulaCell = formulaRunList[i];
        if (formulaCell.level === Math.max) {
            continue;
        }
        const { calc_funcStr } = formulaCell;
        const v = execfunction(ctx, calc_funcStr, formulaCell.r, formulaCell.c, formulaCell.id, calcChainSet);
        ctx.groupValuesRefreshData.push({
            r: formulaCell.r,
            c: formulaCell.c,
            v: v[1],
            f: v[2],
            spe: v[3],
            id: formulaCell.id,
        });
        ctx.formulaCache.execFunctionGlobalData[`${formulaCell.r}_${formulaCell.c}_${formulaCell.id}`] = {
            v: v[1],
            f: v[2],
        };
    }
}
/**
 * @param {Array<any>} updateValueArray
 * @param {any} formulaCellInfoMap
 * @returns {Array<any>}
 */
export function getFormulaRunList(updateValueArray, formulaCellInfoMap) {
    const formulaRunList = [];
    let stack = updateValueArray;
    const existsFormulaRunList = {};
    while (stack.length > 0) {
        const formulaObject = stack.pop();
        if (_.isNil(formulaObject) || formulaObject.key in existsFormulaRunList) {
            continue;
        }
        if (formulaObject.color === "b") {
            formulaObject.color = "w";
            formulaRunList.push(formulaObject);
            existsFormulaRunList[formulaObject.key] = 1;
            continue;
        }
        const cacheStack = [];
        Object.keys(formulaObject.parents).forEach((parentKey) => {
            const parentFormulaObject = formulaCellInfoMap[parentKey];
            if (!_.isNil(parentFormulaObject)) {
                cacheStack.push(parentFormulaObject);
            }
        });
        if (cacheStack.length === 0) {
            formulaRunList.push(formulaObject);
            existsFormulaRunList[formulaObject.key] = 1;
        }
        else {
            formulaObject.color = "b";
            stack.push(formulaObject);
            stack = stack.concat(cacheStack);
        }
    }
    formulaRunList.reverse();
    return formulaRunList;
}
/**
 * @type {function(any, any, any, any, any): void;}
 */
export const arrayMatch = (arrayMatchCache, formulaDependency, _formulaCellInfoMap, _updateValueObjects, func) => {
    for (let a = 0; a < formulaDependency.length; a += 1) {
        const range = formulaDependency[a];
        const cacheKey = `r${range.row[0]}${range.row[1]}c${range.column[0]}${range.column[1]}id${range.sheetId}`;
        if (cacheKey in arrayMatchCache) {
            const amc = arrayMatchCache[cacheKey];
            amc.forEach((item) => {
                func(item.key, item.r, item.c, item.sheetId);
            });
        }
        else {
            const functionArr = [];
            for (let r = range.row[0]; r <= range.row[1]; r += 1) {
                for (let c = range.column[0]; c <= range.column[1]; c += 1) {
                    const key = `r${r}c${c}i${range.sheetId}`;
                    func(key, r, c, range.sheetId);
                    if ((_formulaCellInfoMap && key in _formulaCellInfoMap) ||
                        (_updateValueObjects && key in _updateValueObjects)) {
                        functionArr.push({
                            key,
                            r,
                            c,
                            sheetId: range.sheetId,
                        });
                    }
                }
            }
            if (_formulaCellInfoMap || _updateValueObjects) {
                arrayMatchCache[cacheKey] = functionArr;
            }
        }
    }
};

/**
 * @typedef {import("./index.js").CellMatrix} CellMatrix
 * @typedef {import("./index.js").Context} Context
 * @typedef {import("./index.js").FormulaCell} FormulaCell
 */
