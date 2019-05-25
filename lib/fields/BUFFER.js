/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
 */

/**
 * Module dependencies.
 * @private
 */
const DataField = require('../DataField');

/**
 *
 * @class
 * @extends DataField
 */
class BUFFER extends DataField {

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get jsType() {
    return 'Buffer';
  }

  // noinspection JSMethodCanBeStatic
  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return 'BUFFER';
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @type {*}
   */
  get defaultValue() {
    return this._defaultValue;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {*} value
   */
  set defaultValue(value) {
    this._defaultValue = null;
  }

}

/**
 * Expose `BUFFER`.
 */
module.exports = BUFFER;
