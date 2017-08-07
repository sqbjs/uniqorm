/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */

/* External module dependencies. */
const assert = require('assert');

/**
 *
 * @constructor
 */
class InsertQuery {

  constructor(model, values) {
    this.model = model;
    this._values = values;
  }

  execute(...args) {
    return this._prepare().execute(...args);
  }

  then(...args) {
    return this._prepare().then(...args);
  }

  /**
   * @private
   * @return {Object}
   */
  _prepare() {
    const self = this;
    const model = self.model;
    const database = model.schema.owner.dbPool;
    const defaultSchema = this.model._orm.defaultSchema || database.schema;
    const schema = model.schema.name &&
    model.schema.name !== defaultSchema ? model.schema.name : '';

    /* Prepare values */
    assert(self._values, 'Nothing to insert');

    // Test fields
    const columns = {};
    const params = {};
    Object.getOwnPropertyNames(self._values).forEach(key => {
      model.meta.getField(key);
      columns[key] = new RegExp('/' + key + '/');
      params[key] = self._values[key];
    });
    return database
        .insert(columns)
        .into((schema ? schema + '.' : '') + model.tableName)
        .params(params);
  }

}

module.exports = InsertQuery;
