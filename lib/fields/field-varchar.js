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
class VARCHAR extends Field {

  constructor(length) {
    super(length);
    if (typeof length === 'object') {
      this.setLength(length.length);
    }
  }

  /**
   * @param {*} value
   * @return {VARCHAR}
   */
  setDefaultValue(value) {
    super.setDefaultValue(String(value));
    return this;
  }

  /**
   *
   * @param {int} [value = 1]
   * @return {VARCHAR}
   */
  setLength(value = 1) {
    this._length = parseInt(value);
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'VARCHAR' + (this._length ? '(' + this._length + ')' : '');
  }
}

module.exports = VARCHAR;
