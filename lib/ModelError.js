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
const ErrorEx = require('errorex').ErrorEx;

/**
 * ModelError Class
 * @constructor
 */
function ModelError() {
  ErrorEx.apply(this, arguments);
}

Object.setPrototypeOf(ModelError.prototype, ErrorEx.prototype);
