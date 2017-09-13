/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 *
 * @constructor
 */
class Query {

  constructor(model) {
    this.model = model;
  }

  execute(...args) {
    return this._prepare().execute(...args);
  }

  then(...args) {
    return this._prepare().then(...args);
  }

  /**
   * @protected
   */
  _prepare() {
    throw new Error('Abstract error');
  }

}

module.exports = Query;
