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
 * Expose `FindCursor`.
 */
module.exports = FindCursor;

/**
 * @param {Model} model
 * @param {...String} columns
 * @constructor
 */
function FindCursor(model, columns) {
  Find.apply(this, arguments);
}

Object.setPrototypeOf(FindCursor.prototype, Find.prototype);

/**
 * @param {...*} values
 * @return {FindCursor}
 */
FindCursor.prototype.orderBy = function(values) {
  this._orderby = Array.prototype.slice.call(arguments);
  return this;
};

/**
 * @param {int} value
 * @return {FindCursor}
 */
FindCursor.prototype.limit = function(value) {
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
FindCursor.prototype._execute = function(query, options, callback) {
  options.cursor = true;
  options.rowset = false;
  query.execute(options, function(err, result) {
    if (!err && result && result.cursor)
      return callback(null, result.cursor);
    callback(err);
  });
};
