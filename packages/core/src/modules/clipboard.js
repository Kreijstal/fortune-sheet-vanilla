export default class clipboard {
    static writeHtml(str) {
        var _a;
        try {
            let ele = document.getElementById("fortune-copy-content");
            if (!ele) {
                ele = document.createElement("div");
                ele.setAttribute("contentEditable", "true");
                ele.id = "fortune-copy-content";
                ele.style.position = "fixed";
                ele.style.height = "0";
                ele.style.width = "0";
                ele.style.left = "-10000px";
                (_a = document.querySelector(".fortune-container")) === null || _a === void 0 ? void 0 : _a.append(ele);
            }
            const previouslyFocusedElement = document.activeElement;
            ele.style.display = "block";
            ele.innerHTML = str;
            ele.focus({ preventScroll: true });
            document.execCommand("selectAll");
            document.execCommand("copy");
            const plainText = ele.innerText || ele.textContent || "";
            sessionStorage.setItem("localClipboard", plainText);
            setTimeout(() => {
                var _a;
                ele === null || ele === void 0 ? void 0 : ele.blur();
                (_a = previouslyFocusedElement === null || previouslyFocusedElement === void 0 ? void 0 : previouslyFocusedElement.focus) === null || _a === void 0 ? void 0 : _a.call(previouslyFocusedElement);
            }, 10);
        }
        catch (e) {
            console.error(e);
        }
    }
}
