import en from './en.js';
import zh from './zh.js';
import es from './es.js';
import hi from './hi.js';
import ru from './ru.js';
import zh_tw from './zh_tw.js';
const localeObj = {
  en,
  zh,
  es,
  'zh-TW': zh_tw,
  hi,
  ru,
};
function locale(ctx) {
  const langsToTry = [ctx.lang || '', ctx.lang?.split('-')[0] || ''];
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
