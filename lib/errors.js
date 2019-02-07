/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

const {ErrorEx} = require('errorex');

class ValidationError extends ErrorEx {
}

module.exports = {
  ValidationError
};
