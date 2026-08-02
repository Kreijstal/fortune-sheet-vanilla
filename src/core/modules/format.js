import numeral from 'numeral';
import { isRealNum, valueIsError, isdatetime } from './validation.js';
import SSF from './ssf.js';
import { getCellValue } from './cell.js';
const base1904 = new Date(1900, 2, 1, 0, 0, 0);
/**
 * @param {Date} v
 * @param {number} [date1904]
 * @returns {number}
 */
export function datenum_local(v, date1904) {
  let epoch = Date.UTC(
    v.getFullYear(),
    v.getMonth(),
    v.getDate(),
    v.getHours(),
    v.getMinutes(),
    v.getSeconds()
  );
  const dnthresh_utc = Date.UTC(1899, 11, 31, 0, 0, 0);
  if (date1904) epoch -= 1461 * 24 * 60 * 60 * 1000;
  else if (v >= base1904) epoch += 24 * 60 * 60 * 1000;
  return (epoch - dnthresh_utc) / (24 * 60 * 60 * 1000);
}
let good_pd_date = new Date('2017-02-19T19:06:09.000Z');
if (Number.isNaN(good_pd_date.getFullYear()))
  good_pd_date = new Date('2/19/17');
const good_pd = good_pd_date.getFullYear() === 2017;
/* parses a date as a local date */
function parseDate(str, fixdate) {
  const d = new Date(str);
  // console.log(d);
  if (good_pd) {
    if (fixdate != null) {
      if (fixdate > 0)
        d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
      else if (fixdate < 0)
        d.setTime(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
    }
    return d;
  }
  if (str instanceof Date) return str;
  if (good_pd_date.getFullYear() === 1917 && !Number.isNaN(d.getFullYear())) {
    const s = d.getFullYear();
    if (str.indexOf(`${s}`) > -1) return d;
    d.setFullYear(d.getFullYear() + 100);
    return d;
  }
  const n = str.match(/\d+/g) || ['2017', '2', '19', '0', '0', '0'];
  let out = new Date(
    +n[0],
    +n[1] - 1,
    +n[2],
    +n[3] || 0,
    +n[4] || 0,
    +n[5] || 0
  );
  if (str.indexOf('Z') > -1)
    out = new Date(out.getTime() - out.getTimezoneOffset() * 60 * 1000);
  return out;
}
/**
 * @param {string | number | boolean} value
 * @returns {Array<any>}
 */
export function genarate(value) {
  // 万 单位格式增加！！！
  let m = null;
  let ct = {};
  let v = value;
  if (value == null) {
    return null;
  }
  if (/^-?[0-9]{1,}[,][0-9]{3}(.[0-9]{1,2})?$/.test(value)) {
    value = value;
    // 表述金额的字符串，如：12,000.00 或者 -12,000.00
    m = value;
    v = Number(value.split('.')[0].replace(',', ''));
    let fa = '#,##0';
    if (value.split('.')[1]) {
      fa = '#,##0.';
      for (let i = 0; i < value.split('.')[1].length; i += 1) {
        fa += 0;
      }
    }
    ct = { fa, t: 'n' };
  } else if (value.toString().substring(0, 1) === "'") {
    m = value.toString().substring(1);
    ct = { fa: '@', t: 's' };
  } else if (value.toString().toUpperCase() === 'TRUE') {
    m = 'TRUE';
    ct = { fa: 'General', t: 'b' };
    v = true;
  } else if (value.toString().toUpperCase() === 'FALSE') {
    m = 'FALSE';
    ct = { fa: 'General', t: 'b' };
    v = false;
  } else if (valueIsError(value.toString())) {
    m = value.toString();
    ct = { fa: 'General', t: 'e' };
  } else if (
    /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(
      value
    )
  ) {
    m = value.toString();
    ct = { fa: '@', t: 's' };
  } else if (
    isRealNum(value) &&
    Math.abs(parseFloat(value)) > 0 &&
    (Math.abs(parseFloat(value)) >= 1e11 || Math.abs(parseFloat(value)) < 1e-9)
  ) {
    v = parseFloat(value);
    const str = v.toExponential();
    if (str.indexOf('.') > -1) {
      let strlen = str.split('.')[1].split('e')[0].length;
      if (strlen > 5) {
        strlen = 5;
      }
      ct = { fa: `#0.${new Array(strlen + 1).join('0')}E+00`, t: 'n' };
    } else {
      ct = { fa: '#0.E+00', t: 'n' };
    }
    m = SSF.format(ct.fa, v);
  } else if (value.toString().indexOf('%') > -1) {
    const index = value.toString().indexOf('%');
    const value2 = value.toString().substring(0, index);
    const value3 = value2.replace(/,/g, '');
    if (index === value.toString().length - 1 && isRealNum(value3)) {
      if (value2.indexOf('.') > -1) {
        if (value2.indexOf('.') === value2.lastIndexOf('.')) {
          const value4 = value2.split('.')[0];
          const value5 = value2.split('.')[1];
          let len = value5.length;
          if (len > 9) {
            len = 9;
          }
          if (value4.indexOf(',') > -1) {
            let isThousands = true;
            const ThousandsArr = value4.split(',');
            for (let i = 1; i < ThousandsArr.length; i += 1) {
              if (ThousandsArr[i].length < 3) {
                isThousands = false;
                break;
              }
            }
            if (isThousands) {
              ct = {
                fa: `#,##0.${new Array(len + 1).join('0')}%`,
                t: 'n',
              };
              v = numeral(value).value();
              m = SSF.format(ct.fa, v);
            } else {
              m = value.toString();
              ct = { fa: '@', t: 's' };
            }
          } else {
            ct = { fa: `0.${new Array(len + 1).join('0')}%`, t: 'n' };
            v = numeral(value).value();
            m = SSF.format(ct.fa, v);
          }
        } else {
          m = value.toString();
          ct = { fa: '@', t: 's' };
        }
      } else if (value2.indexOf(',') > -1) {
        let isThousands = true;
        const ThousandsArr = value2.split(',');
        for (let i = 1; i < ThousandsArr.length; i += 1) {
          if (ThousandsArr[i].length < 3) {
            isThousands = false;
            break;
          }
        }
        if (isThousands) {
          ct = { fa: '#,##0%', t: 'n' };
          v = numeral(value).value();
          m = SSF.format(ct.fa, v);
        } else {
          m = value.toString();
          ct = { fa: '@', t: 's' };
        }
      } else {
        ct = { fa: '0%', t: 'n' };
        v = numeral(value).value();
        m = SSF.format(ct.fa, v);
      }
    } else {
      m = value.toString();
      ct = { fa: '@', t: 's' };
    }
  } else if (value.toString().indexOf('.') > -1) {
    if (value.toString().indexOf('.') === value.toString().lastIndexOf('.')) {
      const value1 = value.toString().split('.')[0];
      const value2 = value.toString().split('.')[1];
      let len = value2.length;
      if (len > 9) {
        len = 9;
      }
      if (value1.indexOf(',') > -1) {
        let isThousands = true;
        const ThousandsArr = value1.split(',');
        for (let i = 1; i < ThousandsArr.length; i += 1) {
          if (!isRealNum(ThousandsArr[i]) || ThousandsArr[i].length < 3) {
            isThousands = false;
            break;
          }
        }
        if (isThousands) {
          ct = { fa: `#,##0.${new Array(len + 1).join('0')}`, t: 'n' };
          v = numeral(value).value();
          m = SSF.format(ct.fa, v);
        } else {
          m = value.toString();
          ct = { fa: '@', t: 's' };
        }
      } else {
        if (isRealNum(value1) && isRealNum(value2)) {
          ct = { fa: `0.${new Array(len + 1).join('0')}`, t: 'n' };
          v = numeral(value).value();
          m = SSF.format(ct.fa, v);
        } else {
          m = value.toString();
          ct = { fa: '@', t: 's' };
        }
      }
    } else {
      m = value.toString();
      ct = { fa: '@', t: 's' };
    }
  } else if (isRealNum(value)) {
    m = parseFloat(value).toString();
    ct = { fa: 'General', t: 'n' };
    v = parseFloat(value);
  } else if (
    isdatetime(value, '24') &&
    (value.toString().indexOf('.') > -1 ||
      value.toString().indexOf(':') > -1 ||
      value.toString().length < 16)
  ) {
    v = datenum_local(parseDate(value.toString().replace(/-/g, '/')));
    if (v.toString().indexOf('.') > -1) {
      if (value.toString().length > 18) {
        ct.fa = 'yyyy-MM-dd hh:mm:ss';
      } else if (value.toString().length > 11) {
        ct.fa = 'yyyy-MM-dd hh:mm';
      } else {
        ct.fa = 'yyyy-MM-dd';
      }
    } else {
      ct.fa = 'yyyy-MM-dd';
    }
    ct.t = 'd';
    m = SSF.format(ct.fa, v);
  } else if (
    isdatetime(value, '12') &&
    (value.toString().indexOf('.') > -1 ||
      value.toString().indexOf(':') > -1 ||
      value.toString().length < 20)
  ) {
    v = datenum_local(
      parseDate(
        value
          .toString()
          .replace(/-/g, '/')
          .replace(/(AM|PM)/gi, ' $1')
          .replace(/  +/g, ' ')
      )
    );
    if (v.toString().indexOf('.') > -1) {
      if (value.toString().length > 20) {
        ct.fa = 'yyyy-MM-dd hh:mm:ss AM/PM';
      } else if (value.toString().length > 13) {
        ct.fa = 'yyyy-MM-dd hh:mm AM/PM';
      } else {
        ct.fa = 'yyyy-MM-dd';
      }
    } else {
      ct.fa = 'yyyy-MM-dd';
    }
    ct.t = 'd';
    m = SSF.format(ct.fa, v);
  } else {
    m = value;
    ct.fa = 'General';
    ct.t = 'g';
  }
  return [m, ct, v];
}
/**
 * @param {string} fmt
 * @param {any} v
 * @returns {any}
 */
export function update(fmt, v) {
  return SSF.format(fmt, v);
}
/**
 * @param {string} fmt
 * @param {any} [v]
 * @returns {any}
 */
export function is_date(fmt, v) {
  return SSF.is_date(fmt, v);
}
function fuzzynum(s) {
  let v = Number(s);
  if (typeof s === 'number') {
    return s;
  }
  if (!Number.isNaN(v)) return v;
  let wt = 1;
  let ss = s
    .replace(/([\d]),([\d])/g, '$1$2')
    .replace(/[$]/g, '')
    .replace(/[%]/g, () => {
      wt *= 100;
      return '';
    });
  v = Number(ss);
  if (!Number.isNaN(v)) return v / wt;
  ss = ss.replace(/[(](.*)[)]/, ($$, $1) => {
    wt = -wt;
    return $1;
  });
  v = Number(ss);
  if (!Number.isNaN(v)) return v / wt;
  return v;
}
/**
 * @param {number} r
 * @param {number} c
 * @param {CellMatrix} d
 * @returns {any}
 */
export function valueShowEs(r, c, d) {
  let value = getCellValue(r, c, d, 'm');
  if (value == null) {
    value = getCellValue(r, c, d, 'v');
  } else {
    if (!Number.isNaN(fuzzynum(value))) {
      if (isString(value) && value.indexOf('%') > -1) {
      } else {
        value = getCellValue(r, c, d, 'v');
      }
    }
    // else if (!isNaN(parseDate(value).getDate())){
    else if (d[r]?.[c]?.ct?.t === 'd') {
    } else if (d[r]?.[c]?.ct?.t === 'b') {
    } else {
      value = getCellValue(r, c, d, 'v');
    }
  }
  return value;
}

/**
 * @typedef {import("./types.js").CellMatrix} CellMatrix
 */
