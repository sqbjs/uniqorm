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
const Find = require('./Find');

/**
 * Expose `FindRows`.
 */
module.exports = FindRows;

/**
 * @param {Model} model
 * @param {...String} columns
 * @constructor
 */
function FindRows(model, columns) {
  Find.apply(this, arguments);
  this._limit = 100;
}

Object.setPrototypeOf(FindRows.prototype, Find.prototype);

/**
 * @param {...*} values
 * @return {FindRows}
 */
FindRows.prototype.orderBy = function(values) {
  this._orderby = Array.prototype.slice.call(arguments);
  return this;
};

/**
 * @param {int} value
 * @return {FindRows}
 */
FindRows.prototype.limit = function(value) {
  this._limit = value;
  return this;
};

/**
 *
 * @param {Object} query
 * @param {Object} options
 * @param {Function} callback
 * @private
 */
FindRows.prototype._execute = function(query, options, callback) {
  options.cursor = false;
  options.rowset = false;
  query.execute(options, function(err, result) {
    if (!err && result && result.rows.length)
      return callback(null, result.rows);
    callback(err);
  });
};
