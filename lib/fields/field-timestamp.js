/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Field = require('../field');

/**
 * @class
 */
class TIMESTAMP extends Field {

  constructor() {
    super();
  }

  /**
   * @param {*} value
   * @return {TIMESTAMP}
   */
  setDefaultValue(value) {
    super.setDefaultValue(!value ||
    value instanceof Date ? value : new Date(value));
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'TIMESTAMP';
  }

}

module.exports = TIMESTAMP;
