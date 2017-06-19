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
class CLOB extends Field {

  constructor(cfg) {
    super(cfg);
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'CLOB';
  }
}

module.exports = CLOB;
