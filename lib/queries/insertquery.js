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
const ReturningQuery = require('./returningquery');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;

/**
 * Expose `InsertQuery`.
 */
module.exports = InsertQuery;

/**
 * @param {Model} model
 * @param {Object} values
 * @constructor
 */
function InsertQuery(model, values) {
  ReturningQuery.apply(this, arguments);
  if (typeof values !== 'object' ||
      Array.isArray(values))
    throw new ArgumentError('Invalid argument');
  this._values = values;
}

const proto = InsertQuery.prototype = {};
Object.setPrototypeOf(proto, ReturningQuery.prototype);
proto.constructor = InsertQuery;

/**
 * @protected
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
    throw new Error('Nothing to insert');

  // Test fields
  const columns = {};
  const params = {};
  Object.getOwnPropertyNames(self._values).forEach(function(key) {
    const v = self._values[key];
    if (!(v === null || v === undefined)) {
      model.meta.get(key);
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
    self._returning.forEach(function(n) {
      const f = model.meta.get(n);
      ret[n] = String(f.jsType).toLowerCase();
    });
    query.returning(ret);
  }
  return query;
};
