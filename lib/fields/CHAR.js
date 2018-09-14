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
const VARCHAR = require('./VARCHAR');

/**
 *
 * @class
 * @extends VARCHAR
 */
class CHAR extends VARCHAR {

  /**
   *
   * @return {string}
   * @override
   */
  get sqlType() {
    return this.charLength ?
        'CHAR(' + (this.charLength) + ')' : 'CHAR';
  }

}

/**
 * Expose `CHAR`.
 */
module.exports = CHAR;
