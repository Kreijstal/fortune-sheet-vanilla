/**
 * @param {HTMLDivElement} obj
 */
export function moveToEnd(obj) {
    if (document.createRange) {
        if (obj.innerHTML !== obj.innerText || obj.innerHTML === "") {
            obj.focus();
            const range = window.getSelection();
            range === null || range === void 0 ? void 0 : range.selectAllChildren(obj);
            range === null || range === void 0 ? void 0 : range.collapseToEnd();
        }
        else {
            const len = obj.innerText.length;
            const range = document.createRange();
            range.selectNodeContents(obj);
            range.setStart(obj.childNodes[0], len);
            range.collapse(true);
            const selection = window.getSelection();
            selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
            selection === null || selection === void 0 ? void 0 : selection.addRange(range);
        }
    }
    else if (document.selection) {
        const range = document.body.createTextRange();
        range.moveToElementText(obj);
        range.collapse(false);
        range.select();
    }
}
function isInPage(node) {
    return node === document.body ? false : document.body.contains(node);
}
/**
 * @param {HTMLElement} ele
 */
export function selectTextContent(ele) {
    var _a, _b;
    if (window.getSelection) {
        const range = document.createRange();
        const content = ele.firstChild;
        if (content) {
            range.setStart(content, 0);
            range.setEnd(content, content.length);
            if (range.startContainer && isInPage(range.startContainer)) {
                (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
                (_b = window.getSelection()) === null || _b === void 0 ? void 0 : _b.addRange(range);
            }
        }
    }
    else if (document.selection) {
        const range = document.body.createTextRange();
        range.moveToElementText(ele);
        range.select();
    }
}
/**
 * @param {HTMLElement} sEle
 * @param {HTMLElement} eEle
 */
export function selectTextContentCross(sEle, eEle) {
    var _a, _b;
    if (window.getSelection) {
        const range = document.createRange();
        const sContent = sEle.firstChild;
        const eContent = eEle.firstChild;
        if (sContent && eContent) {
            range.setStart(sContent, 0);
            range.setEnd(eContent, eContent.length);
            if (range.startContainer && isInPage(range.startContainer)) {
                (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
                (_b = window.getSelection()) === null || _b === void 0 ? void 0 : _b.addRange(range);
            }
        }
    }
}
