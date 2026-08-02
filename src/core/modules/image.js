import filter from 'lodash.filter';
import find from 'lodash.find';
import set from 'lodash.set';
import { mergeBorder } from './index.js';
import { getFlowdata } from './../context.js';
import { getSheetIndex } from './../utils/index.js';
/**
 * @type {ImageProps}
 */
export const imageProps = {
  defaultWidth: 144,
  defaultHeight: 84,
  currentObj: null,
  currentWinW: null,
  currentWinH: null,
  resize: null,
  resizeXY: null,
  move: false,
  moveXY: null,
  cursorStartPosition: null,
};
/**
 * @param {string} prefix
 * @returns {string}
 */
export function generateRandomId(prefix) {
  if (prefix == null) {
    prefix = 'img';
  }
  const userAgent = window.navigator.userAgent
    .replace(/[^a-zA-Z0-9]/g, '')
    .split('');
  let mid = '';
  for (let i = 0; i < 12; i += 1) {
    mid += userAgent[Math.round(Math.random() * (userAgent.length - 1))];
  }
  const time = new Date().getTime();
  return `${prefix}_${mid}_${time}`;
}
export function showImgChooser() {
  const chooser = document.getElementById('fortune-img-upload');
  if (chooser) chooser.click();
}
/**
 * @param {Context} ctx
 */
export function saveImage(ctx) {
  const index = getSheetIndex(ctx, ctx.currentSheetId);
  if (index == null) return;
  const file = ctx.luckysheetfile[index];
  file.images = ctx.insertedImgs;
}
/**
 * @param {Context} ctx
 */
export function removeActiveImage(ctx) {
  ctx.insertedImgs = filter(
    ctx.insertedImgs,
    (image) => image.id !== ctx.activeImg
  );
  ctx.activeImg = undefined;
  saveImage(ctx);
}
/**
 * @param {Context} ctx
 * @param {HTMLImageElement} image
 */
export function insertImage(ctx, image) {
  try {
    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    let rowIndex = last?.row_focus;
    let colIndex = last?.column_focus;
    if (!last) {
      rowIndex = 0;
      colIndex = 0;
    } else {
      if (rowIndex == null) {
        [rowIndex] = last.row;
      }
      if (colIndex == null) {
        [colIndex] = last.column;
      }
    }
    const flowdata = getFlowdata(ctx);
    let left = colIndex === 0 ? 0 : ctx.visibledatacolumn[colIndex - 1];
    let top = rowIndex === 0 ? 0 : ctx.visibledatarow[rowIndex - 1];
    if (flowdata) {
      const margeset = mergeBorder(ctx, flowdata, rowIndex, colIndex);
      if (margeset) {
        [top] = margeset.row;
        [left] = margeset.column;
      }
    }
    const { width } = image;
    const { height } = image;
    const img = {
      id: generateRandomId('img'),
      src: image.src,
      left,
      top,
      width: width * 0.5,
      height: height * 0.5,
      originWidth: width,
      originHeight: height,
    };
    ctx.insertedImgs = (ctx.insertedImgs || []).concat(img);
    saveImage(ctx);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.info(err);
  }
}
function getImagePosition() {
  const box = document.getElementById('luckysheet-modal-dialog-activeImage');
  if (!box) return undefined;
  const { width, height } = box.getBoundingClientRect();
  const left = box.offsetLeft;
  const top = box.offsetTop;
  return { left, top, width, height };
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 */
export function cancelActiveImgItem(ctx, globalCache) {
  ctx.activeImg = undefined;
  globalCache.image = undefined;
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 */
export function onImageMoveStart(
  ctx,
  globalCache,
  e
  // { r, c, rc }: { r: number; c: number; rc: string },
) {
  const position = getImagePosition();
  if (position) {
    const { top, left } = position;
    set(globalCache, 'image', {
      cursorMoveStartPosition: {
        x: e.pageX,
        y: e.pageY,
      },
      // movingId,
      // imageRC: { r, c, rc },
      imgInitialPosition: { left, top },
    });
  }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @returns {boolean}
 */
export function onImageMove(ctx, globalCache, e) {
  if (ctx.allowEdit === false) return false;
  const image = globalCache?.image;
  const img = document.getElementById('luckysheet-modal-dialog-activeImage');
  if (img && image && !image.resizingSide) {
    const { x: startX, y: startY } = image.cursorMoveStartPosition;
    let { top, left } = image.imgInitialPosition;
    left += e.pageX - startX;
    top += e.pageY - startY;
    if (top < 0) top = 0;
    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
    return true;
  }
  return false;
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 */
export function onImageMoveEnd(ctx, globalCache) {
  const position = getImagePosition();
  if (!globalCache.image?.resizingSide) {
    globalCache.image = undefined;
    if (position) {
      const img = find(ctx.insertedImgs, (v) => v.id === ctx.activeImg);
      if (img) {
        img.left = position.left / ctx.zoomRatio;
        img.top = position.top / ctx.zoomRatio;
        saveImage(ctx);
      }
    }
  }
}
/**
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @param {string} resizingSide
 */
export function onImageResizeStart(globalCache, e, resizingSide) {
  const position = getImagePosition();
  if (position) {
    set(globalCache, 'image', {
      cursorMoveStartPosition: { x: e.pageX, y: e.pageY },
      resizingSide,
      imgInitialPosition: position,
    });
  }
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 * @param {MouseEvent} e
 * @returns {boolean}
 */
export function onImageResize(ctx, globalCache, e) {
  if (ctx.allowEdit === false) return false;
  const image = globalCache?.image;
  if (image?.resizingSide) {
    const imgContainer = document.getElementById(
      'luckysheet-modal-dialog-activeImage'
    );
    const img = imgContainer?.querySelector('.luckysheet-modal-dialog-content');
    if (img == null) return false;
    const { x: startX, y: startY } = image.cursorMoveStartPosition;
    let { top, left, width, height } = image.imgInitialPosition;
    const dx = e.pageX - startX;
    const dy = e.pageY - startY;
    const minHeight = 60 * ctx.zoomRatio;
    const minWidth = 1.5 * 60 * ctx.zoomRatio;
    if (['lm', 'lt', 'lb'].includes(image.resizingSide)) {
      if (width - dx < minWidth) {
        left += width - minWidth;
        width = minWidth;
      } else {
        left += dx;
        width -= dx;
      }
      if (left < 0) left = 0;
      img.style.left = `${left}px`;
      imgContainer.style.left = `${left}px`;
    }
    if (['rm', 'rt', 'rb'].includes(image.resizingSide)) {
      width = width + dx < minWidth ? minWidth : width + dx;
    }
    if (['mt', 'lt', 'rt'].includes(image.resizingSide)) {
      if (height - dy < minHeight) {
        top += height - minHeight;
        height = minHeight;
      } else {
        top += dy;
        height -= dy;
      }
      if (top < 0) top = 0;
      img.style.top = `${top}px`;
      imgContainer.style.top = `${top}px`;
    }
    if (['mb', 'lb', 'rb'].includes(image.resizingSide)) {
      height = height + dy < minHeight ? minHeight : height + dy;
    }
    img.style.width = `${width}px`;
    imgContainer.style.width = `${width}px`;
    img.style.height = `${height}px`;
    imgContainer.style.height = `${height}px`;
    img.style.backgroundSize = `${width}px ${height}px`;
    return true;
  }
  return false;
}
/**
 * @param {Context} ctx
 * @param {GlobalCache} globalCache
 */
export function onImageResizeEnd(ctx, globalCache) {
  if (globalCache.image?.resizingSide) {
    globalCache.image = undefined;
    const position = getImagePosition();
    if (position) {
      const img = find(ctx.insertedImgs, (v) => v.id === ctx.activeImg);
      if (img) {
        img.left = position.left / ctx.zoomRatio;
        img.top = position.top / ctx.zoomRatio;
        img.width = position.width / ctx.zoomRatio;
        img.height = position.height / ctx.zoomRatio;
        saveImage(ctx);
      }
    }
  }
}

/**
 * @typedef {Object} ImageProps
 */

/**
 * @typedef {import("./types.js").GlobalCache} GlobalCache
 * @typedef {import("./context.js").Context} Context
 */
