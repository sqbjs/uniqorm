/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/* Internal module dependencies. */
const Schema = require('./core/schema');
const Model = require('./core/model');
const ft = require('./core/field');


module.exports = {
    Schema,
    Model,
    schema: function (name, db) {
        return new Schema(name, db);
    }
};

Object.assign(module.exports, ft);
