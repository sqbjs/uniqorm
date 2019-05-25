/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
 */

const {ErrorEx} = require('errorex');

class ValidationError extends ErrorEx {
}

module.exports = {
  ValidationError
};
