/**
 * DOM event wiring. Ported from
 * @fortune-sheet/react Workbook (keydown/paste), Sheet (wheel/resize) and
 * SheetOverlay (mouse/touch) components (MIT).
 */
import _ from "lodash";
import {
  handleGlobalWheel,
  handleCellAreaMouseDown,
  handleOverlayMouseMove,
  handleOverlayMouseUp,
  handleCellAreaDoubleClick,
  handleGlobalKeyDown,
  handlePaste,
  handleRowHeaderMouseDown,
  handleColumnHeaderMouseDown,
  handleOverlayTouchStart,
  handleOverlayTouchMove,
  handleOverlayTouchEnd,
  insertRowCol,
  getSheetIndex,
  selectAll,
} from "@fortune-sheet/core";
import { updateSheetSize } from "./sync.js";

export function bindEvents(store, overlay, dom, onResize) {
  const { refs } = store;

  const cellInput = () => refs.cellInput.current;
  const fxInput = () => refs.fxInput.current;
  const cellArea = () => refs.cellArea.current || overlay.cellArea;
  const canvasCtx = () => refs.canvas.current?.getContext("2d") || null;

  // ---------- wheel ----------
  const onWheel = (e) => {
    store.setContext((draftCtx) => {
      handleGlobalWheel(
        draftCtx,
        e,
        refs.globalCache,
        overlay.scrollbarX,
        overlay.scrollbarY
      );
    });
    e.preventDefault();
  };
  overlay.cellArea.addEventListener("wheel", onWheel, { passive: false });

  // ---------- mouse on cell area ----------
  const onMouseDown = (e) => {
    if (e.button !== 2) {
      // onContextMenu event will not call onMouseDown
      store.setContext((draftCtx) => {
        handleCellAreaMouseDown(
          draftCtx,
          refs.globalCache,
          e,
          cellInput(),
          cellArea(),
          fxInput(),
          canvasCtx()
        );
        if (!_.isEmpty(draftCtx.luckysheet_select_save?.[0]) && cellInput()) {
          setTimeout(() => {
            cellInput()?.focus();
          });
        }
      });
    }
  };
  overlay.cellArea.addEventListener("mousedown", onMouseDown);

  const onDoubleClick = (e) => {
    store.setContext((draftCtx) => {
      handleCellAreaDoubleClick(
        draftCtx,
        refs.globalCache,
        store.settings,
        e,
        cellArea()
      );
    });
  };
  overlay.cellArea.addEventListener("dblclick", onDoubleClick);

  const onMouseMove = (e) => {
    store.setContext((draftCtx) => {
      handleOverlayMouseMove(
        draftCtx,
        refs.globalCache,
        e,
        cellInput(),
        overlay.scrollbarX,
        overlay.scrollbarY,
        overlay.container,
        fxInput()
      );
    });
  };
  overlay.cellArea.addEventListener("mousemove", onMouseMove);

  const onMouseUp = (e) => {
    store.setContext((draftCtx) => {
      try {
        handleOverlayMouseUp(
          draftCtx,
          refs.globalCache,
          store.settings,
          e,
          overlay.scrollbarX,
          overlay.scrollbarY,
          overlay.container,
          cellInput(),
          fxInput()
        );
      } catch (err) {
        console.error(err);
      }
    });
  };
  overlay.cellArea.addEventListener("mouseup", onMouseUp);

  // ---------- touch ----------
  const onTouchStart = (e) => {
    store.setContext((draftContext) => {
      handleOverlayTouchStart(draftContext, e, refs.globalCache);
    });
    e.stopPropagation();
  };
  const onTouchMove = (e) => {
    store.setContext((draftCtx) => {
      handleOverlayTouchMove(
        draftCtx,
        e,
        refs.globalCache,
        overlay.scrollbarX,
        overlay.scrollbarY
      );
    });
  };
  const onTouchEnd = () => {
    handleOverlayTouchEnd(refs.globalCache);
  };
  overlay.container.addEventListener("touchstart", onTouchStart);
  overlay.container.addEventListener("touchmove", onTouchMove);
  overlay.container.addEventListener("touchend", onTouchEnd);

  // ---------- column / row header clicks ----------
  const onLeftTopClick = () => {
    store.setContext((draftCtx) => {
      selectAll(draftCtx);
    });
  };
  const onColHeaderMouseDown = (e) => {
    store.setContext((draftCtx) => {
      handleColumnHeaderMouseDown(
        draftCtx,
        refs.globalCache,
        e,
        overlay.container,
        cellInput(),
        fxInput()
      );
    });
  };
  const onRowHeaderMouseDown = (e) => {
    store.setContext((draftCtx) => {
      handleRowHeaderMouseDown(
        draftCtx,
        refs.globalCache,
        e,
        overlay.container,
        cellInput(),
        fxInput()
      );
    });
  };
  dom.leftTop.addEventListener("click", onLeftTopClick);
  dom.colHeader.addEventListener("mousedown", onColHeaderMouseDown);
  dom.rowHeader.addEventListener("mousedown", onRowHeaderMouseDown);

  // ---------- keyboard ----------
  const onKeyDown = (e) => {
    // handling undo and redo ahead because handleUndo/handleRedo call
    // setContext themselves and should not be nested inside setContext.
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
      if (e.shiftKey) {
        store.handleRedo();
      } else {
        store.handleUndo();
      }
      e.stopPropagation();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyY") {
      store.handleRedo();
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    store.setContext((draftCtx) => {
      handleGlobalKeyDown(
        draftCtx,
        cellInput(),
        fxInput(),
        e,
        refs.globalCache,
        store.handleUndo,
        store.handleRedo,
        canvasCtx()
      );
    });
  };
  dom.container.addEventListener("keydown", onKeyDown);

  // ---------- paste ----------
  const onPaste = (e) => {
    // only the focused sheet handles the paste
    if (
      cellInput() === document.activeElement ||
      document.activeElement?.className === "fortune-sheet-overlay"
    ) {
      let { clipboardData } = e;
      if (!clipboardData) {
        // IE
        clipboardData = window.clipboardData;
      }
      const txtdata =
        clipboardData.getData("text/html") ||
        clipboardData.getData("text/plain");
      const ele = document.createElement("div");
      ele.innerHTML = txtdata;
      const trList = ele.querySelectorAll("table tr");
      const selection = store.ctx.luckysheet_select_save?.[0];
      const maxRow = trList.length + (selection?.row[0] ?? 0);
      const sheetIndex = getSheetIndex(store.ctx, store.ctx.currentSheetId);
      const rowToBeAdded =
        maxRow - store.ctx.luckysheetfile[sheetIndex].data.length;
      const range = store.ctx.luckysheet_select_save;
      if (rowToBeAdded > 0) {
        const insertRowColOp = {
          type: "row",
          index: store.ctx.luckysheetfile[sheetIndex].data.length - 1,
          count: rowToBeAdded,
          direction: "rightbottom",
          id: store.ctx.currentSheetId,
        };
        store.setContext(
          (draftCtx) => {
            insertRowCol(draftCtx, insertRowColOp);
            draftCtx.luckysheet_select_save = range;
          },
          { insertRowColOp }
        );
      }
      store.setContext((draftCtx) => {
        try {
          handlePaste(draftCtx, e);
        } catch (err) {
          console.error(err);
        }
      });
    }
  };
  document.addEventListener("paste", onPaste);

  // ---------- resize ----------
  const onWindowResize = () => {
    updateSheetSize(store, overlay, dom.sheetContainer);
    onResize?.();
  };
  window.addEventListener("resize", onWindowResize);

  // ---------- cleanup ----------
  return () => {
    overlay.cellArea.removeEventListener("wheel", onWheel);
    overlay.cellArea.removeEventListener("mousedown", onMouseDown);
    overlay.cellArea.removeEventListener("dblclick", onDoubleClick);
    overlay.cellArea.removeEventListener("mousemove", onMouseMove);
    overlay.cellArea.removeEventListener("mouseup", onMouseUp);
    overlay.container.removeEventListener("touchstart", onTouchStart);
    overlay.container.removeEventListener("touchmove", onTouchMove);
    overlay.container.removeEventListener("touchend", onTouchEnd);
    dom.leftTop.removeEventListener("click", onLeftTopClick);
    dom.colHeader.removeEventListener("mousedown", onColHeaderMouseDown);
    dom.rowHeader.removeEventListener("mousedown", onRowHeaderMouseDown);
    dom.container.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("paste", onPaste);
    window.removeEventListener("resize", onWindowResize);
  };
}
