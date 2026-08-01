const ZOOM_STEP = 0.1;
/**
 * @type {number}
 */
export const MAX_ZOOM_RATIO = 4;
/**
 * @type {number}
 */
export const MIN_ZOOM_RATIO = 0.1;
/**
 * @param {KeyboardEvent} ev
 * @param {number} currentZoom
 * @returns {number}
 */
export function handleKeydownForZoom(ev, currentZoom) {
    if (!ev.ctrlKey) {
        return currentZoom;
    }
    let handled = false;
    let zoom = currentZoom || 1;
    if (ev.key === "-" || ev.which === 189) {
        zoom -= ZOOM_STEP;
        handled = true;
    }
    else if (ev.key === "+" || ev.which === 187) {
        zoom += ZOOM_STEP;
        handled = true;
    }
    else if (ev.key === "0" || ev.which === 48) {
        zoom = 1;
        handled = true;
    }
    if (handled) {
        ev.preventDefault();
        if (zoom >= MAX_ZOOM_RATIO) {
            zoom = MAX_ZOOM_RATIO;
        }
        else if (zoom < MIN_ZOOM_RATIO) {
            zoom = MIN_ZOOM_RATIO;
        }
    }
    return parseFloat(zoom.toFixed(1));
}
