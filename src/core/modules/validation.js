import forEach from 'lodash.foreach';
import isNil from 'lodash.isnil';
import dayjs from 'dayjs';
import { hasChinaword } from './text.js';
/**
 * @type {{
    v: string;
    n: string;
    na: string;
    r: string;
    d: string;
    nm: string;
    nl: string;
    sp: string;
}}
 */
export const error = {
  v: '#VALUE!',
  n: '#NAME?',
  na: '#N/A',
  r: '#REF!',
  d: '#DIV/0!',
  nm: '#NUM!',
  nl: '#NULL!',
  sp: '#SPILL!', // 数组范围有其它值
};
const errorValues = Object.values(error);
/**
 * @param {string} value
 * @returns {boolean}
 */
export function valueIsError(value) {
  return errorValues.includes(value);
}
// 是否是空值
/**
 * @param {any} val
 * @returns {boolean}
 */
export function isRealNull(val) {
  return isNil(val) || val.toString().replace(/\s/g, '') === '';
}
// 是否是纯数字
/**
 * @param {any} val
 * @returns {boolean}
 */
export function isRealNum(val) {
  if (isNil(val) || val.toString().replace(/\s/g, '') === '') {
    return false;
  }
  if (typeof val === 'boolean') {
    return false;
  }
  return !Number.isNaN(Number(val));
}
function checkDateTime(str, format) {
  const reg1 =
    format === '24'
      ? /^(\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/
      : /^(\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?\s?(AM|PM)?$/;
  const reg2 =
    format === '24'
      ? /^(\d{4})\/(\d{1,2})\/(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/
      : /^(\d{4})\/(\d{1,2})\/(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?\s?(AM|PM)?$/;
  if (!reg1.test(str) && !reg2.test(str)) {
    return false;
  }
  const year = Number(RegExp.$1);
  const month = Number(RegExp.$2);
  const day = Number(RegExp.$3);
  if (year < 1900) {
    return false;
  }
  if (month > 12) {
    return false;
  }
  if (day > 31) {
    return false;
  }
  if (month === 2) {
    if (new Date(year, 1, 29).getDate() === 29 && day > 29) {
      return false;
    }
    if (new Date(year, 1, 29).getDate() !== 29 && day > 28) {
      return false;
    }
  }
  return true;
}
/**
 * @param {any} s
 * @param {string} [format]
 * @returns {boolean}
 */
export function isdatetime(s, format = '24') {
  if (s === null || s.toString().length < 5) {
    return false;
  }
  if (checkDateTime(s, format)) {
    return true;
  }
  return false;
}
/**
 * @param {any} now
 * @param {any} then
 * @returns {number}
 */
export function diff(now, then) {
  return dayjs(now).diff(dayjs(then));
}
/**
 * @param {any} s
 * @returns {any}
 */
export function isdatatypemulti(s) {
  const type = {};
  if (isdatetime(s)) {
    type.date = true;
  }
  if (!Number.isNaN(parseFloat(s)) && !hasChinaword(s)) {
    type.num = true;
  }
  return type;
}
/**
 * @param {any} s
 * @returns {string}
 */
export function isdatatype(s) {
  let type = 'string';
  if (isdatetime(s)) {
    type = 'date';
  } else if (!Number.isNaN(parseFloat(s)) && !hasChinaword(s)) {
    type = 'num';
  }
  return type;
}
// 范围是否只包含部分合并单元格
/**
 * @param {Context} ctx
 * @param {any} cfg
 * @param {number} r1
 * @param {number} r2
 * @param {number} c1
 * @param {number} c2
 * @returns {boolean}
 */
export function hasPartMC(ctx, cfg, r1, r2, c1, c2) {
  let ret = false;
  forEach(ctx.config.merge, (mc) => {
    if (r1 < mc.r) {
      if (r2 >= mc.r && r2 < mc.r + mc.rs - 1) {
        if (c1 >= mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 < mc.c && c2 > mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      } else if (r2 >= mc.r && r2 === mc.r + mc.rs - 1) {
        if (c1 > mc.c && c1 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 > mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 === mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 > mc.c && c2 === mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      } else if (r2 > mc.r + mc.rs - 1) {
        if (c1 > mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 === mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 > mc.c && c2 === mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      }
    } else if (r1 === mc.r) {
      if (r2 < mc.r + mc.rs - 1) {
        if (c1 >= mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 < mc.c && c2 > mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      } else if (r2 >= mc.r + mc.rs - 1) {
        if (c1 > mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 === mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 > mc.c && c2 === mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      }
    } else if (r1 <= mc.r + mc.rs - 1) {
      if (c1 >= mc.c && c1 <= mc.c + mc.cs - 1) {
        ret = true;
        return false;
      }
      if (c2 >= mc.c && c2 <= mc.c + mc.cs - 1) {
        ret = true;
        return false;
      }
      if (c1 < mc.c && c2 > mc.c + mc.cs - 1) {
        ret = true;
        return false;
      }
    }
    return true;
  });
  return ret;
}

/**
 * @typedef {import("./context.js").Context} Context
 */
