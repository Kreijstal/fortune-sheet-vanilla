/**
 * Canvas redraw routine. Ported from the redraw useEffect in
 * @fortune-sheet/react/src/components/Sheet/index.tsx (MIT).
 */
import { Canvas, initFreeze } from './core/index.js';

export function redraw(canvas, ctx, cache, sheetId) {
  // wait for group values to be refreshed before drawing
  if (ctx.groupValuesRefreshData.length > 0) {
    return;
  }

  initFreeze(ctx, cache, sheetId);

  const tableCanvas = new Canvas(canvas, ctx);
  const freeze = cache.freezen?.[sheetId];
  if (
    freeze?.horizontal?.freezenhorizontaldata ||
    freeze?.vertical?.freezenverticaldata
  ) {
    // with frozen panes
    const horizontalData = freeze?.horizontal?.freezenhorizontaldata;
    const verticallData = freeze?.vertical?.freezenverticaldata;
    if (horizontalData && verticallData) {
      const [horizontalPx, , horizontalScrollTop] = horizontalData;
      const [verticalPx, , verticalScrollWidth] = verticallData;
      // main
      tableCanvas.drawMain({
        scrollWidth: ctx.scrollLeft + verticalPx - verticalScrollWidth,
        scrollHeight: ctx.scrollTop + horizontalPx - horizontalScrollTop,
        offsetLeft: verticalPx - verticalScrollWidth + ctx.rowHeaderWidth,
        offsetTop: horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight,
        clear: true,
      });
      // right top
      tableCanvas.drawMain({
        scrollWidth: ctx.scrollLeft + verticalPx - verticalScrollWidth,
        scrollHeight: horizontalScrollTop,
        drawHeight: horizontalPx,
        offsetLeft: verticalPx - verticalScrollWidth + ctx.rowHeaderWidth,
      });
      // left down
      tableCanvas.drawMain({
        scrollWidth: verticalScrollWidth,
        scrollHeight: ctx.scrollTop + horizontalPx - horizontalScrollTop,
        drawWidth: verticalPx,
        offsetTop: horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight,
      });
      // left top
      tableCanvas.drawMain({
        scrollWidth: verticalScrollWidth,
        scrollHeight: horizontalScrollTop,
        drawWidth: verticalPx,
        drawHeight: horizontalPx,
      });
      // headers
      tableCanvas.drawColumnHeader(
        ctx.scrollLeft + verticalPx - verticalScrollWidth,
        undefined,
        verticalPx - verticalScrollWidth + ctx.rowHeaderWidth
      );
      tableCanvas.drawColumnHeader(verticalScrollWidth, verticalPx);
      tableCanvas.drawRowHeader(
        ctx.scrollTop + horizontalPx - horizontalScrollTop,
        undefined,
        horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight
      );
      tableCanvas.drawRowHeader(horizontalScrollTop, horizontalPx);
      tableCanvas.drawFreezeLine({
        horizontalTop:
          horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight - 2,
        verticalLeft: verticalPx - verticalScrollWidth + ctx.rowHeaderWidth - 2,
      });
    } else if (horizontalData) {
      const [horizontalPx, , horizontalScrollTop] = horizontalData;
      // main
      tableCanvas.drawMain({
        scrollWidth: ctx.scrollLeft,
        scrollHeight: ctx.scrollTop + horizontalPx - horizontalScrollTop,
        offsetTop: horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight,
        clear: true,
      });
      // top
      tableCanvas.drawMain({
        scrollWidth: ctx.scrollLeft,
        scrollHeight: horizontalScrollTop,
        drawHeight: horizontalPx,
      });
      // headers
      tableCanvas.drawColumnHeader(ctx.scrollLeft);
      tableCanvas.drawRowHeader(
        ctx.scrollTop + horizontalPx - horizontalScrollTop,
        undefined,
        horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight
      );
      tableCanvas.drawRowHeader(horizontalScrollTop, horizontalPx);
      tableCanvas.drawFreezeLine({
        horizontalTop:
          horizontalPx - horizontalScrollTop + ctx.columnHeaderHeight - 2,
      });
    } else if (verticallData) {
      const [verticalPx, , verticalScrollWidth] = verticallData;
      // main
      tableCanvas.drawMain({
        scrollWidth: ctx.scrollLeft + verticalPx - verticalScrollWidth,
        scrollHeight: ctx.scrollTop,
        offsetLeft: verticalPx - verticalScrollWidth + ctx.rowHeaderWidth,
      });
      // left
      tableCanvas.drawMain({
        scrollWidth: verticalScrollWidth,
        scrollHeight: ctx.scrollTop,
        drawWidth: verticalPx,
      });
      // headers
      tableCanvas.drawRowHeader(ctx.scrollTop);
      tableCanvas.drawColumnHeader(
        ctx.scrollLeft + verticalPx - verticalScrollWidth,
        undefined,
        verticalPx - verticalScrollWidth + ctx.rowHeaderWidth
      );
      tableCanvas.drawColumnHeader(verticalScrollWidth, verticalPx);
      tableCanvas.drawFreezeLine({
        verticalLeft: verticalPx - verticalScrollWidth + ctx.rowHeaderWidth - 2,
      });
    }
  } else {
    // without frozen
    tableCanvas.drawMain({
      scrollWidth: ctx.scrollLeft,
      scrollHeight: ctx.scrollTop,
      clear: true,
    });
    tableCanvas.drawColumnHeader(ctx.scrollLeft);
    tableCanvas.drawRowHeader(ctx.scrollTop);
  }
}
