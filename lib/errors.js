/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const {ErrorEx} = require('errorex');

class ValueRequiredError extends ErrorEx {
  constructor(column) {
    super('Value required for column "%s"', column);
  }
}

class ValueTooLargeError extends ErrorEx {
  constructor(column, actual, maximum) {
    super('Value too large for column "%s" (actual: %d, maximum: %d)',
        column, actual, maximum);
  }
}

module.exports = {
  ValueRequiredError,
  ValueTooLargeError
};
