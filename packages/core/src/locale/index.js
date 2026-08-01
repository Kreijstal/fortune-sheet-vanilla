import en from "./en";
import zh from "./zh";
import es from "./es";
import hi from "./hi";
import ru from "./ru";
import zh_tw from "./zh_tw";
const localeObj = {
    en,
    zh,
    es,
    "zh-TW": zh_tw,
    hi,
    ru,
};
function locale(ctx) {
    var _a;
    const langsToTry = [ctx.lang || "", ((_a = ctx.lang) === null || _a === void 0 ? void 0 : _a.split("-")[0]) || ""];
    for (let i = 0; i < langsToTry.length; i += 1) {
        if (langsToTry[i] in localeObj) {
            return localeObj[langsToTry[i]];
        }
    }
    return localeObj.en;
}
export { locale };

/**
 * @typedef {import("./index.js").Context} Context
 */
