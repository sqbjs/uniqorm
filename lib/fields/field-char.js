/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const VARCHAR = require('./field-varchar');

/**
 * @class
 */
class CHAR extends VARCHAR {

  constructor(...args) {
    super(...args);
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'CHAR';
  }

}

module.exports = CHAR;
