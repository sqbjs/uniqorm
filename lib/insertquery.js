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

  returning(columns) {
    if (typeof columns === 'string') {
      const cols = columns.split(/\s*,\s*/);
      const allFields = this.model.meta.getFieldNames();
      let a = [];
      cols.forEach(n => {
        if (n === '*')
          a = a.concat(allFields.filter((item) => {
            return a.indexOf(item) < 0;
          }));
        if (n.startsWith('-')) {
          let i = a.indexOf(n.substring(1));
          if (i >= 0)
            a.splice(i, 1);
        }
      });
      this._returning = a;
    } else this._returning =
        columns ? Array.prototype.slice.call(arguments) : undefined;
    return this;
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
