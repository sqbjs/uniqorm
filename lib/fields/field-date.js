/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const TIMESTAMP = require('./field-timestamp');

/**
 * @class
 */
class DATE extends TIMESTAMP {

  constructor() {
    super();
  }

  /**
   * @param {*} value
   * @return {TIMESTAMP}
   */
  setDefaultValue(value) {
    if (value) {
      value = value instanceof Date ? value : new Date(value);
      value.setHours(0);
      value.setMinutes(0);
      value.setSeconds(0);
      value.setMilliseconds(0);
    }
    super.setDefaultValue(value);
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'DATE';
  }

}

module.exports = DATE;
