/* eslint-disable import/no-named-as-default-member */
import add from './operator/add.js';
import ampersand from './operator/ampersand.js';
import divide from './operator/divide.js';
import equal from './operator/equal.js';
import formulaFunction from './operator/formula-function.js';
import greaterThan from './operator/greater-than.js';
import greaterThanOrEqual from './operator/greater-than-or-equal.js';
import lessThan from './operator/less-than.js';
import lessThanOrEqual from './operator/less-than-or-equal.js';
import minus from './operator/minus.js';
import multiply from './operator/multiply.js';
import notEqual from './operator/not-equal.js';
import power from './operator/power.js';
import { ERROR_NAME } from './../error.js';

const availableOperators = Object.create(null);

/**
 * Evaluate values by operator id.git
 *
 * @param {String} operator Operator id.
 * @param {Array} [params=[]] Arguments to evaluate.
 * @returns {*}
 */
export default function evaluateByOperator(operator, params = []) {
  operator = operator.toUpperCase();

  if (!availableOperators[operator]) {
    throw Error(ERROR_NAME);
  }

  return availableOperators[operator](...params);
}

/**
 * Register operator.
 *
 * @param {String|Array} symbol Symbol to register.
 * @param {Function} func Logic to register for this symbol.
 */
export function registerOperation(symbol, func) {
  if (!Array.isArray(symbol)) {
    symbol = [symbol.toUpperCase()];
  }
  symbol.forEach((s) => {
    if (func.isFactory) {
      availableOperators[s] = func(s);
    } else {
      availableOperators[s] = func;
    }
  });
}

registerOperation(add.SYMBOL, add);
registerOperation(ampersand.SYMBOL, ampersand);
registerOperation(divide.SYMBOL, divide);
registerOperation(equal.SYMBOL, equal);
registerOperation(power.SYMBOL, power);
registerOperation(formulaFunction.SYMBOL, formulaFunction);
registerOperation(greaterThan.SYMBOL, greaterThan);
registerOperation(greaterThanOrEqual.SYMBOL, greaterThanOrEqual);
registerOperation(lessThan.SYMBOL, lessThan);
registerOperation(lessThanOrEqual.SYMBOL, lessThanOrEqual);
registerOperation(multiply.SYMBOL, multiply);
registerOperation(notEqual.SYMBOL, notEqual);
registerOperation(minus.SYMBOL, minus);
