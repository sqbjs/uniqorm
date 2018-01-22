/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies.
 * @private
 */
const DOUBLE = require('../fields/DOUBLE');

/**
 * Expose `NUMBER`.
 */
module.exports = NUMBER;

/**
 *
 * @param {String} alias
 * @param {Object} def
 * @constructor
 * @extends Field
 */
function NUMBER(alias, def) {
  DOUBLE.apply(this, arguments);
  if (def && def.precision != null)
    this._precision = def.precision;
  if (def && def.scale != null)
    this._scale = def.scale;
}

DOUBLE.prototype = {
  /**
   *
   * @return {string}
   * @constructor
   */
  get SqlType() {
    return 'NUMBER' + (this._precision || this._scale ?
        '(' + (this._precision || 18) + ',' +
        (this._scale || 0) + ')' : '');
  }
};

Object.setPrototypeOf(NUMBER.prototype, DOUBLE.prototype);
NUMBER.prototype.constructor = NUMBER;
