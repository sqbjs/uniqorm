/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const INTEGER = require('./field-integer');

/**
 * @class
 */
class BIGINT extends INTEGER {

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
    return 'BIGINT';
  }

}

module.exports = BIGINT;
