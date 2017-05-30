/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/uniqorm/
 */

/**
 * @class
 * @public
 */

class Relation {

    constructor(model, field, foreignModel, foreignKey) {
        this.model = model;
        this.field = field;
        this.foreignModel = foreignModel;
        this.foreignKey = foreignKey;
    }

    get foreignSchema() {
        return this.foreignModel.schema.name;
    }

}

module.exports = Relation;