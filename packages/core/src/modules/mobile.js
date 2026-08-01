/**
 * @param {Context} ctx
 * @param {TouchEvent} e
 * @param {GlobalCache} globalCache
 */
export function handleOverlayTouchStart(ctx, e, globalCache) {
    globalCache.touchMoveStatus = true;
    const touch = e.targetTouches[0];
    globalCache.touchMoveStartPos = {
        x: touch.pageX,
        y: touch.pageY,
        vy: 0,
        moveType: "y",
    };
}
/**
 * @param {Context} ctx
 * @param {TouchEvent} e
 * @param {GlobalCache} globalCache
 * @param {HTMLDivElement} scrollbarX
 * @param {HTMLDivElement} scrollbarY
 */
export function handleOverlayTouchMove(ctx, e, globalCache, scrollbarX, scrollbarY) {
    if (e.targetTouches.length > 1)
        return;
    const touch = e.targetTouches[0];
    if (globalCache.touchMoveStatus) {
        if (!globalCache.touchMoveStartPos)
            return;
        const slideX = touch.pageX - globalCache.touchMoveStartPos.x;
        const slideY = touch.pageY - globalCache.touchMoveStartPos.y;
        let { scrollLeft } = ctx;
        let { scrollTop } = ctx;
        scrollLeft -= slideX;
        scrollTop -= slideY;
        scrollbarY.scrollTop = scrollTop;
        globalCache.touchMoveStartPos.vy_y = slideY;
        globalCache.touchMoveStartPos.scrollTop = scrollTop;
        scrollbarX.scrollLeft = scrollLeft;
        globalCache.touchMoveStartPos.vy_x = slideX;
        globalCache.touchMoveStartPos.scrollLeft = scrollLeft;
    }
}
/**
 * @param {GlobalCache} globalCache
 */
export function handleOverlayTouchEnd(globalCache) {
    globalCache.touchMoveStatus = false;
    globalCache.touchHandleStatus = false;
}

/**
 * @typedef {import("./index.js").Context} Context
 * @typedef {import("./types.js").GlobalCache} GlobalCache
 */
