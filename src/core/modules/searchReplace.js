import _ from 'lodash';
import { getFlowdata } from './../context.js';
import { locale } from './../locale/index.js';
import {
  chatatABC,
  getRegExpStr,
  getSheetIndex,
  isAllowEdit,
  replaceHtml,
} from './../utils/index.js';
import { setCellValue } from './cell.js';
import { valueShowEs } from './format.js';
import { normalizeSelection, scrollToHighlightCell } from './selection.js';
/**
 * @param {string} searchText
 * @param {Array<{
    row: number[];
    column: number[];
}>} range
 * @param {CellMatrix} flowdata
 * @param {{
    regCheck: boolean;
    wordCheck: boolean;
    caseCheck: boolean;
}} { regCheck, wordCheck, caseCheck }?
 * @returns {Array<any>}
 */
export function getSearchIndexArr(
  searchText,
  range,
  flowdata,
  { regCheck, wordCheck, caseCheck } = {
    regCheck: false,
    wordCheck: false,
    caseCheck: false,
  }
) {
  const arr = [];
  const obj = {};
  for (let s = 0; s < range.length; s += 1) {
    const r1 = range[s].row[0];
    const r2 = range[s].row[1];
    const c1 = range[s].column[0];
    const c2 = range[s].column[1];
    for (let r = r1; r <= r2; r += 1) {
      for (let c = c1; c <= c2; c += 1) {
        const cell = flowdata[r][c];
        if (cell != null) {
          let value = valueShowEs(r, c, flowdata);
          if (value === 0) {
            value = value.toString();
          }
          if (value != null && value !== '') {
            value = value.toString();
            // 1. 勾选整词 直接匹配
            // 2. 勾选了正则 结合是否勾选 构造正则
            // 3. 什么都没选 用字符串 indexOf 匹配
            if (wordCheck) {
              // 整词
              if (caseCheck) {
                if (searchText === value) {
                  if (!(`${r}_${c}` in obj)) {
                    _.set(obj, `${r}_${c}`, 0);
                    arr.push({ r, c });
                  }
                }
              } else {
                const txt = searchText.toLowerCase();
                if (txt === value.toLowerCase()) {
                  if (!(`${r}_${c}` in obj)) {
                    _.set(obj, `${r}_${c}`, 0);
                    arr.push({ r, c });
                  }
                }
              }
            } else if (regCheck) {
              // 正则表达式
              let reg;
              // 是否区分大小写
              if (caseCheck) {
                reg = new RegExp(getRegExpStr(searchText), 'g');
              } else {
                reg = new RegExp(getRegExpStr(searchText), 'ig');
              }
              if (reg.test(value)) {
                if (!(`${r}_${c}` in obj)) {
                  _.set(obj, `${r}_${c}`, 0);
                  arr.push({ r, c });
                }
              }
            } else {
              if (caseCheck) {
                if (~value.indexOf(searchText)) {
                  if (!(`${r}_${c}` in obj)) {
                    _.set(obj, `${r}_${c}`, 0);
                    arr.push({ r, c });
                  }
                }
              } else {
                if (~value.toLowerCase().indexOf(searchText.toLowerCase())) {
                  if (!(`${r}_${c}` in obj)) {
                    _.set(obj, `${r}_${c}`, 0);
                    arr.push({ r, c });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return arr;
}
/**
 * @param {Context} ctx
 * @param {string} searchText
 * @param {{
    regCheck: boolean;
    wordCheck: boolean;
    caseCheck: boolean;
}} checkModes
 * @returns {string}
 */
export function searchNext(ctx, searchText, checkModes) {
  const { findAndReplace } = locale(ctx);
  const flowdata = getFlowdata(ctx);
  if (searchText === '' || searchText == null || flowdata == null) {
    return findAndReplace.searchInputTip;
  }
  let range;
  if (
    _.size(ctx.luckysheet_select_save) === 0 ||
    (ctx.luckysheet_select_save?.length === 1 &&
      ctx.luckysheet_select_save[0].row[0] ===
        ctx.luckysheet_select_save[0].row[1] &&
      ctx.luckysheet_select_save[0].column[0] ===
        ctx.luckysheet_select_save[0].column[1])
  ) {
    range = [
      {
        row: [0, flowdata.length - 1],
        column: [0, flowdata[0].length - 1],
        row_focus: 0,
        column_focus: 0,
      },
    ];
  } else {
    range = _.assign([], ctx.luckysheet_select_save);
  }
  const searchIndexArr = getSearchIndexArr(
    searchText,
    range,
    flowdata,
    checkModes
  );
  if (searchIndexArr.length === 0) {
    return findAndReplace.noFindTip;
  }
  let count = 0;
  if (
    _.size(ctx.luckysheet_select_save) === 0 ||
    (ctx.luckysheet_select_save?.length === 1 &&
      ctx.luckysheet_select_save[0].row[0] ===
        ctx.luckysheet_select_save[0].row[1] &&
      ctx.luckysheet_select_save[0].column[0] ===
        ctx.luckysheet_select_save[0].column[1])
  ) {
    if (_.size(ctx.luckysheet_select_save) === 0) {
      count = 0;
    } else {
      for (let i = 0; i < searchIndexArr.length; i += 1) {
        if (
          searchIndexArr[i].r === ctx.luckysheet_select_save[0].row[0] &&
          searchIndexArr[i].c === ctx.luckysheet_select_save[0].column[0]
        ) {
          if (i === searchIndexArr.length - 1) {
            count = 0;
          } else {
            count = i + 1;
          }
          break;
        }
      }
    }
    ctx.luckysheet_select_save = normalizeSelection(ctx, [
      {
        row: [searchIndexArr[count].r, searchIndexArr[count].r],
        column: [searchIndexArr[count].c, searchIndexArr[count].c],
      },
    ]);
  } else {
    const rf = range[range.length - 1].row_focus;
    const cf = range[range.length - 1].column_focus;
    for (let i = 0; i < searchIndexArr.length; i += 1) {
      if (searchIndexArr[i].r === rf && searchIndexArr[i].c === cf) {
        if (i === searchIndexArr.length - 1) {
          count = 0;
        } else {
          count = i + 1;
        }
        break;
      }
    }
    for (let s = 0; s < range.length; s += 1) {
      const r1 = range[s].row[0];
      const r2 = range[s].row[1];
      const c1 = range[s].column[0];
      const c2 = range[s].column[1];
      if (
        searchIndexArr[count].r >= r1 &&
        searchIndexArr[count].r <= r2 &&
        searchIndexArr[count].c >= c1 &&
        searchIndexArr[count].c <= c2
      ) {
        const obj = range[s];
        obj.row_focus = searchIndexArr[count].r;
        obj.column_focus = searchIndexArr[count].c;
        range.splice(s, 1);
        range.push(obj);
        break;
      }
    }
    ctx.luckysheet_select_save = range;
  }
  // selectHightlightShow();
  scrollToHighlightCell(ctx, searchIndexArr[count].r, searchIndexArr[count].c);
  return null;
}
/**
 * @param {Context} ctx
 * @param {string} searchText
 * @param {{
    regCheck: boolean;
    wordCheck: boolean;
    caseCheck: boolean;
}} checkModes
 * @returns {Array<SearchResult>}
 */
export function searchAll(ctx, searchText, checkModes) {
  const flowdata = getFlowdata(ctx);
  const searchResult = [];
  if (searchText === '' || searchText == null || flowdata == null) {
    return searchResult;
  }
  let range;
  if (
    _.size(ctx.luckysheet_select_save) === 0 ||
    (ctx.luckysheet_select_save?.length === 1 &&
      ctx.luckysheet_select_save[0].row[0] ===
        ctx.luckysheet_select_save[0].row[1] &&
      ctx.luckysheet_select_save[0].column[0] ===
        ctx.luckysheet_select_save[0].column[1])
  ) {
    range = [
      {
        row: [0, flowdata.length - 1],
        column: [0, flowdata[0].length - 1],
      },
    ];
  } else {
    range = _.assign([], ctx.luckysheet_select_save);
  }
  const searchIndexArr = getSearchIndexArr(
    searchText,
    range,
    flowdata,
    checkModes
  );
  if (searchIndexArr.length === 0) {
    // if (isEditMode()) {
    //   alert(locale_findAndReplace.noFindTip);
    // } else {
    //   tooltip.info(locale_findAndReplace.noFindTip, "");
    // }
    return searchResult;
  }
  for (let i = 0; i < searchIndexArr.length; i += 1) {
    const value_ShowEs = valueShowEs(
      searchIndexArr[i].r,
      searchIndexArr[i].c,
      flowdata
    ).toString();
    // if (value_ShowEs.indexOf("</") > -1 && value_ShowEs.indexOf(">") > -1) {
    searchResult.push({
      r: searchIndexArr[i].r,
      c: searchIndexArr[i].c,
      sheetName:
        ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId) || 0]?.name,
      sheetId: ctx.currentSheetId,
      cellPosition: `${chatatABC(searchIndexArr[i].c)}${searchIndexArr[i].r + 1}`,
      value: value_ShowEs,
    });
    // } else {
    // searchAllHtml +=
    //   `<div class="boxItem" data-row="${searchIndexArr[i].r}" data-col="${searchIndexArr[i].c}" data-sheetIndex="${ctx.currentSheetIndex}">` +
    //   `<span>${
    //     ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)].name
    //   }</span>` +
    //   `<span>${chatatABC(searchIndexArr[i].c)}${
    //     searchIndexArr[i].r + 1
    //   }</span>` +
    //   `<span title="${value_ShowEs}">${value_ShowEs}</span>` +
    //   `</div>`;
    // }
  }
  ctx.luckysheet_select_save = normalizeSelection(ctx, [
    {
      row: [searchIndexArr[0].r, searchIndexArr[0].r],
      column: [searchIndexArr[0].c, searchIndexArr[0].c],
    },
  ]);
  return searchResult;
  // selectHightlightShow();
}
/**
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {HTMLDivElement} container
 */
export function onSearchDialogMoveStart(globalCache, e, container) {
  const box = document.getElementById('fortune-search-replace');
  if (!box) return;
  // eslint-disable-next-line prefer-const
  let { top, left, width, height } = box.getBoundingClientRect();
  const rect = container.getBoundingClientRect();
  left -= rect.left;
  top -= rect.top;
  const initialPosition = { left, top, width, height };
  _.set(globalCache, 'searchDialog.moveProps', {
    cursorMoveStartPosition: {
      x: e.pageX,
      y: e.pageY,
    },
    initialPosition,
  });
}
/**
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 */
export function onSearchDialogMove(globalCache, e) {
  const searchDialog = globalCache?.searchDialog;
  const moveProps = searchDialog?.moveProps;
  if (moveProps == null) return;
  const dialog = document.getElementById('fortune-search-replace');
  const { x: startX, y: startY } = moveProps.cursorMoveStartPosition;
  let { top, left } = moveProps.initialPosition;
  left += e.pageX - startX;
  top += e.pageY - startY;
  if (top < 0) top = 0;
  dialog.style.left = `${left}px`;
  dialog.style.top = `${top}px`;
}
/**
 * @param {GlobalCache} globalCache
 */
export function onSearchDialogMoveEnd(globalCache) {
  _.set(globalCache, 'searchDialog.moveProps', undefined);
}
/**
 * @param {Context} ctx
 * @param {string} searchText
 * @param {string} replaceText
 * @param {{
    regCheck: boolean;
    wordCheck: boolean;
    caseCheck: boolean;
}} checkModes
 * @returns {string}
 */
export function replace(ctx, searchText, replaceText, checkModes) {
  const { findAndReplace } = locale(ctx);
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) {
    return findAndReplace.modeTip;
  }
  const flowdata = getFlowdata(ctx);
  if (searchText === '' || searchText == null || flowdata == null) {
    return findAndReplace.searchInputTip;
  }
  let range;
  if (
    _.size(ctx.luckysheet_select_save) === 0 ||
    (ctx.luckysheet_select_save?.length === 1 &&
      ctx.luckysheet_select_save[0].row[0] ===
        ctx.luckysheet_select_save[0].row[1] &&
      ctx.luckysheet_select_save[0].column[0] ===
        ctx.luckysheet_select_save[0].column[1])
  ) {
    range = [
      {
        row: [0, flowdata.length - 1],
        column: [0, flowdata[0].length - 1],
      },
    ];
  } else {
    range = _.assign([], ctx.luckysheet_select_save);
  }
  const searchIndexArr = getSearchIndexArr(
    searchText,
    range,
    flowdata,
    checkModes
  );
  if (searchIndexArr.length === 0) {
    return findAndReplace.noReplceTip;
  }
  let count = null;
  const last =
    ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
  const rf = last?.row_focus;
  const cf = last?.column_focus;
  for (let i = 0; i < searchIndexArr.length; i += 1) {
    if (searchIndexArr[i].r === rf && searchIndexArr[i].c === cf) {
      count = i;
      break;
    }
  }
  if (count == null) {
    if (searchIndexArr.length === 0) {
      return findAndReplace.noMatchTip;
    }
    count = 0;
  }
  const d = flowdata;
  let r;
  let c;
  if (checkModes.wordCheck) {
    r = searchIndexArr[count].r;
    c = searchIndexArr[count].c;
    const v = replaceText;
    // if (!checkProtectionLocked(r, c, ctx.currentSheetId)) {
    //   return;
    // }
    setCellValue(ctx, r, c, d, v);
  } else {
    let reg;
    if (checkModes.caseCheck) {
      reg = new RegExp(getRegExpStr(searchText), 'g');
    } else {
      reg = new RegExp(getRegExpStr(searchText), 'ig');
    }
    r = searchIndexArr[count].r;
    c = searchIndexArr[count].c;
    // if (!checkProtectionLocked(r, c, ctx.currentSheetId)) {
    //   return;
    // }
    const v = valueShowEs(r, c, d).toString().replace(reg, replaceText);
    setCellValue(ctx, r, c, d, v);
  }
  ctx.luckysheet_select_save = normalizeSelection(ctx, [
    { row: [r, r], column: [c, c] },
  ]);
  // jfrefreshgrid(d, ctx.luckysheet_select_save);
  // selectHightlightShow();
  scrollToHighlightCell(ctx, r, c);
  return null;
}
/**
 * @param {Context} ctx
 * @param {string} searchText
 * @param {string} replaceText
 * @param {{
    regCheck: boolean;
    wordCheck: boolean;
    caseCheck: boolean;
}} checkModes
 * @returns {string}
 */
export function replaceAll(ctx, searchText, replaceText, checkModes) {
  const { findAndReplace } = locale(ctx);
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) {
    return findAndReplace.modeTip;
  }
  const flowdata = getFlowdata(ctx);
  if (searchText === '' || searchText == null || flowdata == null) {
    return findAndReplace.searchInputTip;
  }
  let range;
  if (
    _.size(ctx.luckysheet_select_save) === 0 ||
    (ctx.luckysheet_select_save?.length === 1 &&
      ctx.luckysheet_select_save[0].row[0] ===
        ctx.luckysheet_select_save[0].row[1] &&
      ctx.luckysheet_select_save[0].column[0] ===
        ctx.luckysheet_select_save[0].column[1])
  ) {
    range = [
      {
        row: [0, flowdata.length - 1],
        column: [0, flowdata[0].length - 1],
      },
    ];
  } else {
    range = _.assign([], ctx.luckysheet_select_save);
  }
  const searchIndexArr = getSearchIndexArr(
    searchText,
    range,
    flowdata,
    checkModes
  );
  if (searchIndexArr.length === 0) {
    return findAndReplace.noReplceTip;
  }
  const d = flowdata;
  let replaceCount = 0;
  if (checkModes.wordCheck) {
    for (let i = 0; i < searchIndexArr.length; i += 1) {
      const { r } = searchIndexArr[i];
      const { c } = searchIndexArr[i];
      // if (!checkProtectionLocked(r, c, ctx.currentSheetIndex, false)) {
      //   continue;
      // }
      const v = replaceText;
      setCellValue(ctx, r, c, d, v);
      range.push({ row: [r, r], column: [c, c] });
      replaceCount += 1;
    }
  } else {
    let reg;
    if (checkModes.caseCheck) {
      reg = new RegExp(getRegExpStr(searchText), 'g');
    } else {
      reg = new RegExp(getRegExpStr(searchText), 'ig');
    }
    for (let i = 0; i < searchIndexArr.length; i += 1) {
      const { r } = searchIndexArr[i];
      const { c } = searchIndexArr[i];
      // if (!checkProtectionLocked(r, c, ctx.currentSheetIndex, false)) {
      //   continue;
      // }
      const v = valueShowEs(r, c, d).toString().replace(reg, replaceText);
      setCellValue(ctx, r, c, d, v);
      range.push({ row: [r, r], column: [c, c] });
      replaceCount += 1;
    }
  }
  // jfrefreshgrid(d, range);
  ctx.luckysheet_select_save = normalizeSelection(ctx, range);
  const succeedInfo = replaceHtml(findAndReplace.successTip, {
    xlength: replaceCount,
  });
  // if (isEditMode()) {
  //   alert(succeedInfo);
  // } else {
  //   tooltip.info(succeedInfo, "");
  // }
  return succeedInfo;
}

/**
 * @typedef {import("./context.js").Context} Context
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 * @typedef {import("./types.js").SearchResult} SearchResult
 * @typedef {import("./types.js").GlobalCache} GlobalCache
 */
