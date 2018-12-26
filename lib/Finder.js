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
const sqb = require('sqb');
const {ArgumentError} = require('errorex');
const {normalizeAttributes, makeArray} = require('./helpers');
const DataField = require('./DataField');
const Op = sqb.Op;

/**
 * Module variables
 * @private
 */
const COLUMN_PATTERN = /^([_a-zA-Z][\w$]*)(?:\.?([\w$]+))?$/;
const CONDITION_PATTERN = /([^><= ]*)(.*)?/;
const SORT_ORDER_PATTERN = /^([-+])?([a-zA-Z][\w$]*)(?:\.?([\w$]+))?$/i;

/**
 *
 *  @class
 */
class Finder {

  /**
   *
   * @param {Object} options
   * @param {Model} options.model
   * @param {Object} options.connection
   * @param {Array} options.attributes
   * @param {boolean} [options.autoCommit]
   * @param {boolean} [options.silent]
   * @param {Array} [options.filter]
   * @param {Array} [options.sort]
   * @param {int} [options.limit]
   * @param {int} [options.offset]
   * @param {Array} [options.keyValues]
   * @param {Object} options.context
   * @param {boolean} [options.showSql]
   */
  constructor(options) {
    this.model = options.model;
    this.connection = options.connection;
    this.attributes = options.attributes;
    this.filter = options.filter;
    this.sort = options.sort;
    this.limit = options.limit;
    this.offset = options.offset;
    this.autoCommit = options.autoCommit;
    this.silent = options.silent;
    this.showSql = options.showSql;
    this.context = options.context;
    this._resultRows = null;
    this._attrNode = {};
    this._columns = new Map();
    this._joins = null;
    this._query = null;
    this._values = {};
    this._children = null;
    this._parentAttr = null;
  }

  /**
   * @param {Object} [scope]
   * @return {Promise<Array<Object>>}
   */
  execute(scope) {
    return this._execute(scope).then(resp => resp.resultRows || []);
  }

  /**
   * @param {Object} [scope]
   * @return {Promise<{origRows, resultRows}>}
   */
  _execute(scope) {
    return Promise.resolve().then(() => {
      this._build();
      const query = this._query;
      const isChild = !!this._parentAttr;
      return query.execute({
        values: this._values,
        autoCommit: this.autoCommit,
        objectRows: true,
        strictParams: true,
        fetchRows: this.limit,
        showSql: true
      }).then(resp => {
        if (scope) {
          scope.attributes = this.attributes;
          scope.context = this.context;
          scope.query = resp.query;
        }
        const origRows = resp.rows;

        if (!origRows)
          return {};

        // Wrap rows into origRows
        /* istanbul ignore else */
        const resultRows = [];
        for (let row of origRows) {
          row = this._wrapRec(row, {}, this._attrNode);
          resultRows.push(row);
        }
        if (!this._children)
          return {origRows, resultRows};

        // Execute children
        if (scope)
          scope.children = scope.children || {};
        const promises = [];

        for (const child of this._children) {
          const scp = scope ? (scope.children[child._parentAttr] = {}) : null;
          // Prepare parameter values
          const v = [];
          for (const [k, row] of origRows.entries()) {
            resultRows[k][child._parentAttr] = null;
            v.push(row[child._masterCol]);
          }
          child._values['__' + child._detailCol] = v;

          promises.push(
              child._execute(scp).then(resp => {
                const rows = resp.origRows;
                /* istanbul ignore next */
                if (!rows) return;
                for (const [k, mrow] of origRows.entries()) {
                  const arr = resultRows[k][child._parentAttr] = [];
                  for (const [i, row] of rows.entries()) {
                    if (mrow[child._masterCol] === row[child._detailCol]) {
                      arr.push(resp.resultRows[i]);
                    }
                  }
                }
              })
          );
        }
        return Promise.all(promises).then(() => ({origRows, resultRows}));

      }).catch(e => {
        /* istanbul ignore else */
        if (this.showSql && !isChild && e.query) {
          e.message += '\nSQL: ' + e.query.sql.replace(/\n/g, '\n     ');
          /* istanbul ignore next */
          if (e.query.values && e.query.values.length)
            e.message += '\nValues: ' + JSON.stringify(e.query.values);
        }
        throw e;
      });
    });
  }

  /**
   * }
   */
  _build() {

    /* 1. Process attributes */
    if (!this._parentAttr) // If not child
      this._processAttributes();

    /* 2. Prepare order columns */
    const orderColumns = this._prepareOrderColumns();

    /* 3. Prepare filter */
    const filter = this._processFilter(
        callIf(this.filter, this.context), this.model, 't');

    /* 3. Phase: Prepare select columns */
    const selectColumns = [];
    for (const [key, col] of this._columns.entries())
      selectColumns.push(key + ' ' + col.colName);

    /* 4. Phase: Prepare joins */
    const joins = [];
    if (this._joins) {
      for (const join of this._joins.values()) {
        const joinFn = join.joinType === 'inner' ?
            sqb.innerJoin : sqb.leftOuterJoin;
        joins.push(
            joinFn(join.ascField.foreignModel.tableNameFull + ' ' +
                join.joinAlias)
                .on(Op.eq(join.joinAlias + '.' +
                    join.ascField.foreignField.fieldName,
                    sqb.raw(join.targetAlias + '.' +
                        join.ascField.keyField.fieldName)),
                    ...join.filter)
        );
      }
    }

    /* 5. Phase: Create Query */
    this._query = this.connection
        .select(...selectColumns)
        .from(this.model.tableNameFull + ' t')
        .join(...joins)
        .where(...filter)
        .orderBy(...orderColumns)
        .limit(this.limit)
        .offset(this.offset);
    this._query.generate();
  }

  /**
   * @private
   */
  _processAttributes() {
    const {silent} = this;

    const processField = (finder, model, attrKey, v, tableAlias, targetNode) => {
      v = v || attrKey;

      /* Convert string item to object representation */
      if (typeof v === 'string') {
        const m = v.match(COLUMN_PATTERN);
        if (!m)
          throw new ArgumentError('Invalid column definition "%s"', v);
        v = {fieldName: m[1]};
        if (m[2])
          v.subField = m[2];
      }
      v.fieldName = v.fieldName || attrKey;
      const field = model.getField(v.fieldName, silent);
      if (!field) return;

      /* If field is a data field */
      if (field instanceof DataField) {
        targetNode[attrKey] = {
          column: finder._addColumn(tableAlias, field.fieldName)
        };
        return;
      }

      let fnd = finder;

      /* If field is a One2Many associated field */
      const attrInfo = typeof v === 'object' ? v : {};
      if (field.hasMany) {
        // Validate
        if (v.subField) {
          /* istanbul ignore next */
          if (silent) return;
          throw new ArgumentError('`%s` is an One2Many associated field and sub values can not be used to return as single value', v.fieldName);
        }
        if (v.returnsSingleValue) {
          /* istanbul ignore next */
          if (silent) return;
          throw new ArgumentError('`%s` is an single value associated field and has no sub value `%s`', v.fieldName, v.subField);
        }

        const detailKey = field.foreignKey;
        const masterKey = field.key;
        const masterCol = finder._addColumn(tableAlias, finder.model.getField(masterKey)
            .fieldName).colName;

        // build filter
        const filter = [
          Op.in(tableAlias + '.' +
              field.foreignModel.getField(detailKey).fieldName,
              new RegExp('__' + masterCol))
        ];
        filter.push(...makeArray(callIf(field.filter, finder.context)));

        // Create a new Finder for nested query
        fnd = new Finder({
          model: field.foreignModel,
          //attributes: attrInfo.attributes,
          connection: finder.connection,
          autoCommit: finder.autoCommit,
          silent,
          filter,
          sort: attrInfo.sort,
          limit: attrInfo.limit,
          offset: attrInfo.offset,
          context: finder.context
        });
        fnd._parentAttr = attrKey;
        fnd._masterCol = masterCol;
        fnd._detailCol = fnd._addColumn('t',
            fnd.model.getField(detailKey).fieldName).colName;
        finder._children = makeArray(finder._children);
        finder._children.push(fnd);
        targetNode = fnd._attrNode;

      } else {
        /* If field is a One2One associated field */
        tableAlias = fnd._addJoin(field, tableAlias).joinAlias;
        targetNode = targetNode[attrKey] || (targetNode[attrKey] = {});
      }

      let fld = field;
      while (fld.towards) {
        fld = fld.towards;
        model = fld.model;
        const j = fnd._addJoin(fld, tableAlias);
        tableAlias = j.joinAlias;
      }

      if (!field.hasMany) {
        /* If requested single attribute of multi attribute field */
        if (v.subField) {
          if (fld.fieldName) {
            if (silent) return;
            throw new ArgumentError('`%s` is an single value associated field and has no sub value `%s`', v.fieldName, v.subField);
          }
          const f = field.foreignModel.getField(v.subField);
          targetNode.column = fnd._addColumn(tableAlias, f.fieldName);
          return;
        }

        /* If field is an associated field and returns single value */
        if (fld.fieldName) {
          targetNode.column = fnd._addColumn(tableAlias, fld.fieldName);
          return;
        }
      }

      attrInfo.attributes = attrInfo.attributes ||
          normalizeAttributes(fld.foreignModel.getDataFields());

      /* If requested some attributes of multi attribute field */
      targetNode = field.hasMany ? targetNode :
          (targetNode.columns = targetNode.columns || {});
      for (const n of Object.keys(attrInfo.attributes)) {
        const v = attrInfo.attributes[n];
        const fname = typeof v === 'string' ? v :
            (v ? v.fieldName : n);
        const f = fld.foreignModel.getField(fname);
        if (f instanceof DataField) {
          targetNode[n] = {
            column: fnd._addColumn(tableAlias, f.fieldName)
          };
        } else {
          processField(fnd, fld.foreignModel,
              fname, v, tableAlias, targetNode);
        }
      }

    };

    const srcAttributes = this.attributes ||
        normalizeAttributes(this.model.getDataFields());
    for (const attrKey of Object.keys(srcAttributes)) {
      processField(this, this.model, attrKey,
          srcAttributes[attrKey], 't', this._attrNode);
    }
    //console.log(this._attrNode);
  }

  _prepareOrderColumns() {
    if (!this.sort)
      return [];
    const orderColumns = [];
    for (const col of this.sort) {
      if (typeof col !== 'string')
        throw new ArgumentError('Invalid element in "sort" property');
      const m = col.match(SORT_ORDER_PATTERN);
      if (!m)
        throw new ArgumentError('"%s" is not a valid order expression', col);
      let fieldName = m[2];
      let field = this.model.getField(fieldName);
      if (field.foreignModel) {
        let tableAlias = 't';
        while (field) {
          const join = this._addJoin(field, tableAlias);
          tableAlias = join.joinAlias;
          /* istanbul ignore else */
          if (field.fieldName)
            fieldName = tableAlias + '.' + field.fieldName;
          field = field.towards;
        }
      } else {
        fieldName = 't.' + (field.fieldName);
      }
      orderColumns.push((m[1] || '') + fieldName);
    }
    return orderColumns;
  }

  _addColumn(tableAlias, fieldName) {
    const s = (tableAlias + '.' + fieldName);
    let o = this._columns.get(s);
    if (o)
      return o;
    o = {
      colName: 'col' + (this._columns.size + 1),
      source: s
    };
    this._columns.set(s, o);
    return o;
  }

  _addJoin(ascField, targetAlias) {

    this._joins = this._joins || new Map();
    let filter = makeArray(callIf(ascField.filter, this.context));

    const s = targetAlias + '.' + ascField.key + '>' +
        ascField.foreignModel.name + '.' + ascField.foreignKey +
        (filter.length ? ' ' + JSON.stringify(filter) : '');

    let join = this._joins.get(s);
    if (join)
      return join;
    const joinAlias = 'j' + (this._joins.size + 1);
    filter = this._processFilter(filter, ascField.foreignModel, joinAlias);
    join = {
      ascField,
      joinAlias,
      targetAlias,
      filter,
      joinType: ascField.joinType
    };
    this._joins.set(s, join);
    return join;
  }

  _processFilter(filter, model, tableAlias) {
    if (!filter)
      return [];
    if (filter.isOperator)
      return filter;
    if (Array.isArray(filter))
      return filter.map(x => this._processFilter(x, model, tableAlias));

    const result = {};
    for (const k of Object.keys(filter)) {
      if (['or', 'and'].includes(k.toLowerCase())) {
        result[k] = this._processFilter(filter[k], model, tableAlias);
        continue;
      }

      const m = k.match(CONDITION_PATTERN);
      /* istanbul ignore next */
      if (!m)
        throw new ArgumentError('Invalid condition definition "%s"', k);
      const fieldName = m[1];
      const ex = (m[2] || '');
      let field = model.getField(fieldName);
      if (field instanceof DataField) {
        result[tableAlias + '.' + field.fieldName + ex] = filter[k];
      } else {
        /* istanbul ignore next */
        if (!field.returnsSingleValue)
          throw new ArgumentError('`%s` is not an single value associated field and can not be used for filtering', fieldName);
        while (field) {
          const join = this._addJoin(field, tableAlias);
          tableAlias = join.joinAlias;
          if (!field.towards)
            break;
          field = field.towards;
        }
        if (field.fieldName)
          result[tableAlias + '.' + field.fieldName + ex] = filter[k];
      }
    }
    return result;
  }

  _wrapRec(source, target, attrMap) {
    for (const n of Object.getOwnPropertyNames(attrMap)) {
      const attr = attrMap[n];
      if (attr.column)
        target[n] = source[attr.column.colName];
      else if (attr.columns)
        target[n] = this._wrapRec(source, target[n] || {}, attr.columns);
      else target[n] = null;
    }
    return target;
  }

}

function callIf(value, context) {
  return typeof value === 'function' ? value(context) : value;
}

/**
 * Expose `Finder`.
 */

module.exports = Finder;
