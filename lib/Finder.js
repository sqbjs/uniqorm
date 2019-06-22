/* UNIQORM
 ------------------------
 (c) 2017-present Panates
 UNIQORM may be freely distributed under the MIT license.
 For details and documentation:
 https://github.com/sqbjs/uniqorm
 */

/**
 * Module dependencies
 * @private
 */
const sqb = require('sqb');
const {ErrorEx, ArgumentError} = require('errorex');
const promisify = require('putil-promisify');
const {normalizeProperties, makeArray, mapConditions} = require('./helpers');
const DataField = require('./DataField');
const CalculatedField = require('./CalculatedField');
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
   * @param {Model} model
   * @param {Object} options
   * @param {Array} options.properties
   * @param {Array} [options.where]
   * @param {Array} [options.sort]
   * @param {int} [options.limit]
   * @param {int} [options.offset]
   * @param {Object} options.connection
   * @param {boolean} [options.autoCommit]
   * @param {boolean} [options.ignoreUnknownProperties]
   * @param {boolean} [options.json]
   * @param {Function} [options.trace]
   * @param {Object} options.context
   * @param {Array} [options.keyValues]
   */
  constructor(model, options) {
    this.model = model;
    this.connection = options.connection;
    this.properties = options.properties;
    this.where = options.where;
    this.sort = options.sort;
    this.limit = options.limit;
    this.offset = options.offset;
    this.autoCommit = options.autoCommit;
    this.ignoreUnknownProperties = options.ignoreUnknownProperties;
    this.context = options.context;
    this.trace = options.trace;
    this.asJson = options.json;
    this._attrNode = {};
    this._columns = new Map();
    this._joins = null;
    this._query = null;
    this._values = {};
    this._children = null;
    this._parentAttr = null;
  }

  /**
   * @return {Promise<{executeTime:number, queriesExecuted:number, instances:Array<Object>}>}
   */
  execute() {
    const t = Date.now();
    return this._execute()
        .then(resp => {
          return {
            executeTime: Date.now() - t,
            queriesExecuted: resp.queriesExecuted,
            instances: resp.resultRows || []
          };
        });
  }

  /**
   * @param {Object} [scope]
   * @return {Promise<{origRows, resultRows, queriesExecuted}>}
   */
  _execute(scope = {}) {
    scope.queriesExecuted = scope.queriesExecuted || 0;
    return promisify(() => {
      this._build();
      const query = this._query;
      return query.execute({
        values: this._values,
        autoCommit: this.autoCommit,
        objectRows: true,
        strictParams: true,
        fetchRows: this.limit,
        showSql: true
      }).then(resp => {
        scope.queriesExecuted++;
        if (this.trace)
          this.trace({
            properties: this.properties,
            context: this.context,
            query: resp.query
          });

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
          return {origRows, resultRows, queriesExecuted: scope.queriesExecuted};

        // Execute children
        const promises = [];

        for (const child of this._children) {
          // Prepare parameter values
          const v = [];
          for (const [k, row] of origRows.entries()) {
            resultRows[k][child._parentAttr] = null;
            v.push(row[child._masterCol]);
          }
          child._values['__' + child._detailCol] = v;

          promises.push(
              child._execute(scope).then(resp => {
                const rows = resp.origRows;
                /* istanbul ignore next */
                if (!rows) return;
                for (const [k, mrow] of origRows.entries()) {
                  // noinspection JSMismatchedCollectionQueryUpdate
                  const arr = resultRows[k][child._parentAttr] = [];
                  for (const [i, row] of rows.entries()) {
                    /* istanbul ignore else */
                    if (mrow[child._masterCol] === row[child._detailCol]) {
                      arr.push(resp.resultRows[i]);
                    }
                  }
                }
              })
          );
        }
        return Promise.all(promises).then(() => ({
          origRows,
          resultRows,
          queriesExecuted: scope.queriesExecuted
        }));
      });
    });
  }

  /**
   * }
   */
  _build() {

    /* 1. Process properties */
    if (!this._parentAttr) // If not child
      this._processProperties();

    /* 2. Prepare order columns */
    const orderColumns = this._prepareOrderColumns();

    /* 3. Prepare where */
    const conditions = this._processConditions(
        callIf(this.where, this.context), this.model, 't');

    /* 3. Phase: Prepare select columns */
    const selectColumns = [];
    for (const [key, col] of this._columns.entries())
      selectColumns.push(key + ' ' + col.colName);

    /* 4. Phase: Prepare joins */
    const joins = [];
    if (this._joins) {
      for (const join of this._joins.values()) {
        let joinFn;
        /* istanbul ignore next */
        switch (join.joinType) {
          case 'left':
            joinFn = sqb.leftJoin;
            break;
          case 'leftouter':
          case null:
            joinFn = sqb.leftOuterJoin;
            break;
          case 'right':
            joinFn = sqb.rightJoin;
            break;
          case 'rightouter':
            joinFn = sqb.rightOuterJoin;
            break;
          case 'outer':
            joinFn = sqb.outerJoin;
            break;
          case 'fullouter':
            joinFn = sqb.fullOuterJoin;
            break;
          case 'inner':
            joinFn = sqb.innerJoin;
            break;
          default:
            throw new ErrorEx('Unknown join type "%s"', join.joinType);
        }
        joins.push(
            joinFn(join.ascField.foreignModel.tableNameFull + ' ' +
                join.joinAlias)
                .on(Op.eq(join.joinAlias + '.' +
                    join.ascField.foreignField.fieldName,
                    sqb.raw(join.targetAlias + '.' +
                        join.ascField.keyField.fieldName)),
                    ...join.where)
        );
      }
    }

    /* 5. Phase: Create Query */
    this._query = (this.connection || this.model.orm.pool)
        .select(...selectColumns)
        .from(this.model.tableNameFull + ' t')
        .join(...joins)
        .where(...conditions)
        .orderBy(...orderColumns)
        .limit(this.limit)
        .offset(this.offset);
    this._query.generate();
  }

  /**
   * @private
   */
  _processProperties() {
    const {ignoreUnknownProperties} = this;

    const processField = (finder, model, v, attrKey, tableAlias, targetNode) => {
      v = v || attrKey;

      /* Convert string item to object representation */
      if (typeof v === 'string') {
        const m = v.match(COLUMN_PATTERN);
        /* istanbul ignore next */
        if (!m)
          throw new ArgumentError('Invalid column definition "%s"', v);
        v = {fieldName: m[1]};
        if (m[2])
          v.subField = m[2];
      }
      v.fieldName = v.fieldName || /* istanbul ignore next */ attrKey;
      const field = ignoreUnknownProperties ? model.findField(v.fieldName) :
          model.getField(v.fieldName);
      if (!field) return;

      /* If field is a data field */
      if (field instanceof DataField) {
        targetNode[attrKey] = {
          column: finder._addColumn(tableAlias, field)
        };
        return;
      }

      /* If field is a data field */
      if (field instanceof CalculatedField) {
        const attr = targetNode[attrKey] = {
          calculate: field.calculate,
          cols: []
        };
        for (const x of field.requires) {
          const f = model.getField(x);
          const col = finder._addColumn(tableAlias, f);
          col.attrName = x;
          attr.cols.push(col);
        }
        return;
      }

      let fnd = finder;

      /* If field is a One2Many associated field */
      const attrInfo = typeof v === 'object' ? v :
          /* istanbul ignore next */ {};
      if (field.hasMany) {
        // Validate
        if (v.subField)
          throw new ArgumentError('`%s` is a One2Many associated field and sub values can not be used to return as single value', v.fieldName);

        const detailKey = field.foreignKey;
        const masterKey = field.key;
        const masterCol = finder._addColumn(tableAlias,
            finder.model.getField(masterKey)).colName;

        // build where conditions
        const where = [Op.in(detailKey, new RegExp('__' + masterCol))];
        where.push(...makeArray(callIf(field.where, finder.context)));

        // Create a new Finder for nested query
        fnd = new Finder(field.foreignModel, {
          connection: finder.connection,
          autoCommit: finder.autoCommit,
          ignoreUnknownProperties,
          where,
          sort: attrInfo.sort,
          limit: attrInfo.limit,
          offset: attrInfo.offset,
          context: finder.context
        });
        fnd._parentAttr = attrKey;
        fnd._masterCol = masterCol;
        fnd._detailCol =
            fnd._addColumn('t', fnd.model.getField(detailKey)).colName;
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
        j.joinType = 'inner';
        if (v.where)
          j.where.push(...makeArray(callIf(v.where, finder.context)));
        tableAlias = j.joinAlias;
      }

      if (!field.hasMany) {
        /* If requested single property of multi property field */
        if (v.subField) {
          if (fld.fieldName)
            throw new ArgumentError('`%s` is a single value associated field and has no sub value `%s`', v.fieldName, v.subField);
          const f = field.foreignModel.getField(v.subField);
          targetNode.column = fnd._addColumn(tableAlias, f);
          return;
        }

        /* If field is an associated field and returns single value */
        if (fld.fieldName) {
          targetNode.column = fnd._addColumn(tableAlias, fld);
          return;
        }
      }

      attrInfo.properties = attrInfo.properties ||
          normalizeProperties(fld.foreignModel.getDataFields());

      /* If requested some properties of multi property field */
      targetNode = field.hasMany ? targetNode :
          (targetNode.columns = targetNode.columns || {});
      for (const n of Object.keys(attrInfo.properties)) {
        const v = attrInfo.properties[n];
        const fname = typeof v === 'string' ? v :
            (v ? v.fieldName : n);
        const f = fld.foreignModel.getField(fname);
        if (f instanceof DataField) {
          targetNode[n] = {
            column: fnd._addColumn(tableAlias, f)
          };
        } else {
          processField(fnd, fld.foreignModel,
              v, fname, tableAlias, targetNode);
        }
      }

    };

    const srcProperties = this.properties ||
        /* istanbul ignore next */
        normalizeProperties(this.model.getDataFields());
    for (const attrKey of Object.keys(srcProperties)) {
      processField(this, this.model, srcProperties[attrKey],
          attrKey, 't', this._attrNode);
    }
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

  _addColumn(tableAlias, field) {
    const s = (tableAlias + '.' + field.fieldName);
    let o = this._columns.get(s);
    if (o)
      return o;
    o = {
      colName: 'col' + (this._columns.size + 1),
      source: s,
      field
    };
    this._columns.set(s, o);
    return o;
  }

  _addJoin(ascField, targetAlias) {

    this._joins = this._joins || new Map();
    let where = makeArray(callIf(ascField.where, this.context));

    const s = targetAlias + '.' + ascField.key + '>' +
        ascField.foreignModel.name + '.' + ascField.foreignKey +
        (where.length ? ' ' + JSON.stringify(where) : '');

    let join = this._joins.get(s);
    if (join)
      return join;
    const joinAlias = 'j' + (this._joins.size + 1);
    where = this._processConditions(where, ascField.foreignModel, joinAlias);
    join = {
      ascField,
      joinAlias,
      targetAlias,
      where,
      joinType: ascField.joinType
    };
    this._joins.set(s, join);
    return join;
  }

  _processConditions(conditions, model, tableAlias) {
    if (!conditions)
      return [];
    return mapConditions(conditions, (k) => {
      if (['exists', '!exists'].includes(k))
        return k;
      const m = k.match(CONDITION_PATTERN);
      /* istanbul ignore next */
      if (!m)
        throw new ArgumentError('Invalid condition definition "%s"', k);
      const fieldName = m[1];
      const ex = (m[2] || '');
      let field = model.getField(fieldName);
      if (field instanceof DataField)
        return tableAlias + '.' + field.fieldName + ex;

      /* istanbul ignore next */
      if (!field.returnsSingleValue)
        throw new ArgumentError('`%s` is not an single value associated field and can not be used for filtering', fieldName);
      let alias = tableAlias;
      while (field) {
        const join = this._addJoin(field, alias);
        alias = join.joinAlias;
        if (!field.towards)
          break;
        field = field.towards;
      }
      /* istanbul ignore else */
      if (field.fieldName)
        return alias + '.' + field.fieldName + ex;
    });
  }

  _wrapRec(source, target, attrMap) {
    const attrKeys = Object.keys(attrMap);
    let hasCalcField;
    for (const n of attrKeys) {
      const attr = attrMap[n];
      if (attr.calculate)
        hasCalcField = true;
      if (attr.column) {
        const field = attr.column.field;
        target[n] = field instanceof DataField ?
            (this.asJson ? field.serialize(source[attr.column.colName]) :
                field.parse(source[attr.column.colName]))
            : source[attr.column.colName];
        continue;
      }
      /* istanbul ignore else */
      if (attr.columns) {
        target[n] = this._wrapRec(source, target[n] || {}, attr.columns);
        continue;
      }
      /* istanbul ignore next */
      target[n] = null;
    }
    /* Call calculate methods */
    if (hasCalcField) {
      for (const n of attrKeys) {
        const attr = attrMap[n];
        if (attr.calculate) {
          const values = {};
          for (const col of attr.cols) {
            values[col.attrName] = source[col.colName];
          }
          target[n] = attr.calculate(values, this.context);
        }

      }
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
