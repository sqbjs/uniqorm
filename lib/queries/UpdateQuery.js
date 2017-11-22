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
const errorex = require('errorex');
const ReturningQuery = require('./ReturningQuery');

module.exports = UpdateQuery;

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;

/**
 * @param {Model} model
 * @param {Object} values
 * @constructor
 */
function UpdateQuery(model, values) {
  ReturningQuery.apply(this, arguments);
  if (typeof values !== 'object' &&
      Array.isArray(values))
    throw new ArgumentError('Invalid argument');
  this._values = values;
}

const proto = UpdateQuery.prototype = {};
Object.setPrototypeOf(proto, ReturningQuery.prototype);
proto.constructor = UpdateQuery;
/**
 * @private
 * @return {Object}
 */
proto._prepare = function() {
  const self = this;
  const model = self.model;
  const database = model.schema.owner.dbPool;
  const defaultSchema = this.model._orm.defaultSchema || database.schema;
  const schema = model.schema.name &&
  model.schema.name !== defaultSchema ? model.schema.name : '';

  /* Prepare values */
  if (!self._values)
    throw new Error('Nothing to update');

  // Test fields
  const columns = {};
  const where = [];
  const params = {};
  Object.getOwnPropertyNames(self._values).forEach(function(key) {
    const v = self._values[key];
    if (!(v === null || v === undefined)) {
      const f = model.meta.get(key);
      if (f.primaryKey) {
        where.push([key, self._values[key]]);
      } else {
        columns[key] = new RegExp(key);
        params[key] = self._values[key];
      }
    }
  });
  const query = database
      .update((schema ? schema + '.' : '') + model.tableName)
      .set(columns)
      .where(where)
      .params(params);
  if (self._returning) {
    const ret = {};
    self._returning.forEach(function(n) {
      const f = model.meta.get(n);
      ret[n] = String(f.jsType).toLowerCase();
    });
    query.returning(ret);
  }
  return query;
};

