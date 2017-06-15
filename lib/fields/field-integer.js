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
class INTEGER extends Field {

  constructor(cfg) {
    super(cfg);
    if (typeof cfg === 'object') {
      this.setUnsigned(cfg.unsigned);
    }
  }

  /**
   * @type {boolean}
   */
  get unsigned() {
    return this._unsigned;
  }

  /**
   * @param {boolean} val
   */
  set unsigned(val) {
    this._unsigned = val;
  }

  //noinspection JSCheckFunctionSignatures
  /**
   *
   * @param {int} value
   * @return {INTEGER}
   * @override
   */
  setDefaultValue(value) {
    super.setDefaultValue(parseInt(value));
    return this;
  }

  /**
   *
   * @param {boolean} [value = true]
   * @return {INTEGER}
   */
  setUnsigned(value = true) {
    this.unsigned = value;
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'INTEGER';
  }

}

module.exports = INTEGER;
