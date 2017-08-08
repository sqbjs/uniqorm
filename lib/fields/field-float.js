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
class FLOAT extends Field {

  constructor(cfg) {
    super(cfg);
  }

  // noinspection JSMethodCanBeStatic
  get jsType() {
    return 'Number';
  }

  //noinspection JSCheckFunctionSignatures
  /**
   *
   * @param {int} value
   * @return {INTEGER}
   * @override
   */
  setDefaultValue(value) {
    super.setDefaultValue(parseFloat(value));
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string}
   * @public
   */
  toSql() {
    return 'FLOAT';
  }

}

module.exports = FLOAT;
