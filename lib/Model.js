/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * Module dependencies
 * @private
 */
const errorex = require('errorex');
const sqb = require('sqb');
const FindOne = require('./model/FindOne');
const FindRows = require('./model/FindRows');
const FindCursor = require('./model/FindCursor');
//const RelationO2O = require('./relation-one2one');

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;

/**
 * Expose `Model`.
 */
module.exports = Model;

/**
 * @param {Object} dbObj
 * @constructor
 */
function Model(dbObj) {
  if (dbObj &&
      !(typeof dbObj.select === 'function' &&
          typeof dbObj.execute === 'function'))
    throw new ArgumentError('`dbObj` argument must be a SQB pool or Connection instance');
  this._dbObj = dbObj || this.orm.pool;
}

/**
 * Searches for one specific element in the database
 *
 * @param {...String} columns
 * @return {FindOne}
 */
Model.prototype.findOne = function(columns) {
  return new FindOne(this, Array.prototype.slice.call(arguments));
};

/**
 * Searches for multiple elements in the database
 *
 * @param {...String} columns
 * @return {FindRows}
 */
Model.prototype.findRows = function(columns) {
  return new FindRows(this, Array.prototype.slice.call(arguments));
};

/**
 * Creates a Cursor that searches for multiple elements in the database
 *
 * @param {...String} columns
 * @return {FindCursor}
 */
Model.prototype.findCursor = function(columns) {
  return new FindCursor(this, Array.prototype.slice.call(arguments));
};

Model.Op = sqb.Op;

Model.belongsTo = function(other, from, to) {
  /*
  if (!(other && typeof other.prototype.findOne === 'function'))
    throw new ArgumentError('Foreign model required as first argument');
  const model = this.prototype;
  model.relations.push({
    type: '1:1',
    foreignModel: other,
    from: from,
    to: to
  });*/
  //console.log(this.prototype.tableName, other.prototype.tableName);
};

Model.hasOne = function(model, field, pk) {
  /*
  if (!field) {
    field = field || model.meta.tableName + '_ID';
  }
  const p = this.meta.fields[field];
  field = p.fieldName;

  if (pk) {
    const p = model.meta.fields[pk];
    assert.ok(p, `Model (${model.name}) has no field (${pk})`);
    pk = p.fieldName;
  } else {
    const p = model.meta.getPrimaryKeys();
    assert.ok(p.length, `Model (${model.name}) has no primary key`);
    assert.equal(p.length, 1, `Model (${model.name}) has more than one primary key`);
    pk = p[0].fieldName;
  }

  assert.ok(model.prototype instanceof Model, 'Invalid argument');
  const relation = new RelationO2O(this, field, model, pk);
  this.prototype._relations.push(relation);
  return relation;*/
};


