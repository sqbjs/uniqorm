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
 * Expose `FindOne`
 */
module.exports = FindOne;

/**
 * @param {Model} model
 * @param {...String} columns
 * @constructor
 */
function FindOne(model, columns) {
  Find.apply(this, arguments);
  this._method = 'findOne';
}

Object.setPrototypeOf(FindOne.prototype, Find.prototype);
