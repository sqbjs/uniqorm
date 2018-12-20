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
const {normalizeAttributes} = require('./helpers');
const DataField = require('./DataField');
const Op = sqb.Op;

/**
 * Module variables
 * @private
 */
const COLUMN_PATTERN = /^([_a-zA-Z][\w$]*)(?:\.?([\w$]+))?$/;
const SORT_ORDER_PATTERN = /^([-+])?([a-zA-Z][\w$]*)(?:\.?([\w$]+))?$/i;

/**
 *
 *  @class
 */
class FindContext {

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
    this._resultRows = null;
    this._attrNode = {};
    this._columns = new Map();
    this._joins = null;
    this._query = null;
    this._values = {};
    this._children = null;
    this._masterColumn = null;
    this._masterAttr = null;
    this._detailField = null;
    this._detailColumn = null;
    this._resultRows = null;
  }

  /**
   * @param {Object} [scope]
   * @return {Promise}
   */
  execute(scope) {
    return Promise.resolve().then(() => {
      this._build();
      const query = this._query;
      // Execute
      const isChild = !!this._masterColumn;
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
          scope.query = resp.query;
        }
        /* istanbul ignore next */
        if (!(resp && resp.rows))
          return [];
        /* Create key value array for children  */
        if (this._children) {
          for (const child of this._children) {
            const prm = '__' + child._detailField;
            const arr = child._values[prm] =
                child._values[prm] || [];
            for (const row of resp.rows) {
              const keyValue = row[child._masterColumn];
              /* istanbul ignore else */
              if (keyValue && !arr.includes(keyValue))
                arr.push(keyValue);
            }
          }
        }
        return this._executeChildren(scope).then(() => {
          const resultRows = isChild ? {} : [];
          for (const row of resp.rows) {
            const obj = this._wrapRec(row, {}, this._attrNode);
            if (this._children) {
              for (const child of this._children) {
                const masterKey = row[child._masterColumn];
                /* istanbul ignore else */
                if (masterKey) {
                  /* istanbul ignore next */
                  obj[child._masterAttr] =
                      (child._resultRows && child._resultRows[masterKey]) ||
                      null;
                }
              }
            }

            if (isChild) {
              const key = row[this._detailColumn];
              /* istanbul ignore else */
              if (key) {
                const arr = resultRows[key] = resultRows[key] || [];
                arr.push(obj);
              }
            } else
              resultRows.push(obj);
          }
          this._resultRows = resultRows;
          return resultRows;
        });
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
   */
  _build() {
    if (!this._masterColumn) // If not child context
      this._processAttributes();

    /* 1. Prepare order columns */
    const orderColumns = this._prepareOrderColumns();

    const selectColumns = [];
    const joins = [];

    /* 2. Phase: Add joins needed for filter clause and prepare an override map for expressions */
    const operatorOverrides = {};
    this.connection.select()
        .where(...(this.filter || []))
        .on('serialize', (ctx, type, o) => {
          if (type === 'comparison' && o.expression) {
            const m = o.expression.match(COLUMN_PATTERN);
            /* istanbul ignore next */
            if (!m)
              throw new ArgumentError('Invalid column definition "%s"', o.expression);
            const fieldName = m[1];
            let field = this.model.getField(fieldName);
            if (field.foreignModel) {
              /* istanbul ignore next */
              if (!field.returnsSingleValue)
                throw new ArgumentError('`%s` is not an single value associated field and can not be used for filtering', fieldName);
              //let join = this._addJoin(field, 't');
              let tableAlias = 't';
              while (field) {
                const join = this._addJoin(field, tableAlias);
                tableAlias = join.joinAlias;
                if (field.fieldName)
                  operatorOverrides[o.expression] =
                      tableAlias + '.' + field.fieldName;
                field = field.towards;
              }
            } else
              operatorOverrides[o.expression] = 't.' + field.fieldName;
          }
        }).generate();

    /* 3. Phase: Prepare select columns */
    for (const [key, col] of this._columns.entries())
      selectColumns.push(key + ' ' + col.colName);

    /* 4. Phase: Prepare joins */
    if (this._joins) {
      for (const join of this._joins.values()) {

        joins.push(
            sqb.leftOuterJoin(
                join.ascField.foreignModel.tableNameFull + ' ' +
                join.joinAlias)
                .on(Op.eq('$$' + join.joinAlias + '.' +
                    join.ascField.foreignField.fieldName,
                    sqb.raw(join.targetAlias + '.' +
                        join.ascField.keyField.fieldName)),
                    ...(join.ascField.filter || []))
        );
      }
    }

    /* 5. Phase: Create Query */
    this._query = this.connection
        .select(...selectColumns)
        .from(this.model.tableNameFull + ' t')
        .join(...joins)
        .where(...(this.filter || []))
        .orderBy(...orderColumns)
        .limit(this.limit)
        .offset(this.offset)
        .on('serialize', (ctx, type, o) => {
          if (type === 'comparison' && o.expression) {
            o.expression = o.expression.substring(0, 2) === '$$' ?
                o.expression.substring(2) :
                /* istanbul ignore next */
                operatorOverrides[o.expression] || o.expression;
          }
        });
  }

  /**
   * @private
   */
  _processAttributes() {
    const {silent} = this;

    const processField = (context, model, attrKey, v, tableAlias, targetNode) => {
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
          column: context._addColumn(tableAlias, field.fieldName)
        };
        return;
      }

      const attrInfo = typeof v === 'object' ? v : {};
      let ctx = context;
      /* If field is a One2Many associated field */
      if (field.hasMany) {
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
        // Add key field to master query. We will use key value to match with detail records
        const masterCol = context._addColumn(tableAlias, field.key);
        // Create a new FindContext for nested query
        ctx = new FindContext({
          model: field.foreignModel,
          //attributes: attrInfo.attributes,
          connection: context.connection,
          autoCommit: context.autoCommit,
          silent,
          filter: [Op.in(field.foreignKey,
              new RegExp('__' + field.foreignKey)),
            ...(field.filter || /* istanbul ignore next */[])],
          sort: attrInfo.sort,
          limit: attrInfo.limit,
          offset: attrInfo.offset
        });
        // Add detail key field to nested query. We will use key value to match with master record
        ctx._masterColumn = masterCol.colName;
        ctx._masterAttr = attrKey;
        ctx._detailColumn =
            ctx._addColumn('t', field.foreignField.fieldName).colName;
        ctx._detailField = field.foreignKey;
        context._children = context._children || [];
        context._children.push(ctx);
        targetNode = ctx._attrNode;
      } else {
        /* If field is a One2One associated field */
        tableAlias = ctx._addJoin(field, tableAlias).joinAlias;
        targetNode = targetNode[attrKey] || (targetNode[attrKey] = {});
      }

      let fld = field;
      while (fld.towards) {
        fld = fld.towards;
        model = fld.model;
        const j = ctx._addJoin(fld, tableAlias);
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
          targetNode.column = ctx._addColumn(tableAlias, f.fieldName);
          return;
        }

        /* If field is an associated field and returns single value */
        if (fld.fieldName) {
          targetNode.column = ctx._addColumn(tableAlias, fld.fieldName);
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
            column: ctx._addColumn(tableAlias, f.fieldName)
          };
        } else {
          processField(ctx, fld.foreignModel,
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

  _addJoin(ascField, parentAlias) {
    this._joins = this._joins || new Map();
    let s = ascField.key + '>' + ascField.foreignModel.name + '.' +
        ascField.foreignKey;
    if (ascField.filter && ascField.filter.length)
      s += '|' + JSON.stringify(ascField.filter);

    let join = this._joins.get(s);
    if (!join) {
      join = {
        ascField,
        joinAlias: 'j' + (this._joins.size + 1),
        targetAlias: parentAlias
      };
      this._joins.set(s, join);
    }
    return join;
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

  /**
   *
   * @param {Object} scope
   * @return {Promise}
   * @private
   */
  _executeChildren(scope) {
    /**/
    if (this._children) {
      if (scope)
        scope.children = scope.children || {};
      const promises = [];
      for (const childContext of this._children) {
        const scp = scope ?
            scope.children[childContext._masterAttr] = {} : null;
        promises.push(childContext.execute(scp));
      }
      return Promise.all(promises);
    }
    return Promise.resolve();
  }

}

/**
 * Expose `FindContext`.
 */

module.exports = FindContext;
