/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const assert = require('assert');
const ReturningQuery = require('./returningquery');

/**
 *
 * @constructor
 */
class InsertQuery extends ReturningQuery {

  constructor(model, values) {
    super(model);
    assert(typeof values === 'object' &&
        !Array.isArray(values), 'Invalid argument');
    this._values = values;
  }

  /**
   * @protected
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
      const v = self._values[key];
      if (!(v === null || v === undefined)) {
        model.meta.getField(key);
        columns[key] = new RegExp(key);
        params[key] = self._values[key];
      }
    });
    const query = database
        .insert(columns)
        .into((schema ? schema + '.' : '') + model.tableName)
        .params(params);
    if (self._returning) {
      const ret = {};
      self._returning.forEach(n => {
        const f = model.meta.getField(n);
        ret[n] = String(f.jsType).toLowerCase();
      });
      query.returning(ret);
    }
    return query;
  }

}

module.exports = InsertQuery;
