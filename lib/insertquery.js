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
const sqb = require('sqb');

/**
 *
 * @constructor
 */
class InsertQuery {

  constructor(model, ...columns) {
    this.model = model;
    this._columns = columns;
  }

  values(values) {
    this._values = values;
    return this;
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

    const columns = {};
    Object.getOwnPropertyNames(self._values).forEach(key => {
      const f = model.meta.fields[key];
      if (f &&
          (!self._columns.length ||
              self._columns.findIndex(
                  item => item.toUpperCase() === key.toUpperCase()
              ) >= 0
          )) {
        columns[f.fieldName] = new RegExp(key);
      }
    });
    return database
        .insert(columns)
        .into((schema ? schema + '.' : '') + model.tableName)
        .params(self._values);
  }

  then(...args) {
    return this._prepare().then(...args);
  }

}

module.exports = InsertQuery;
