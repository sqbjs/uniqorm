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
 * Expose `FindOne`.
 */
module.exports = FindOne;

/**
 * @param {Model} model
 * @param {...String} columns
 * @constructor
 */
function FindOne(model, columns) {
  Find.apply(this, arguments);
  this._method = 'findAll';
  this._limit = 100;
}

Object.setPrototypeOf(FindOne.prototype, Find.prototype);

/**
 * @param {...*} values
 * @return {FindOne}
 */
FindOne.prototype.orderBy = function(values) {
  this._orderby = Array.prototype.slice.call(arguments);
  return this;
};

FindOne.prototype.limit = function(value) {
  this._limit = value;
  return this;
};
