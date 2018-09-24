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
const errorex = require('errorex');
const Op = sqb.Op;

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;
const COLUMN_PATTERN = /^([a-zA-Z][\w$]*)(?:\.?([\w$]+))?$/;
const SORT_ORDER_PATTERN = /^([-+])?([a-zA-Z][\w$]*)(?:\.?([\w$]+))?$/i;

/**
 *
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
    this._build = {
      values: {},
      attributes: {},
      columns: new Map(),
      joins: null,
      children: null
    };
  }

  /**
   * @param {Object} [scope]
   * @return {Promise}
   */
  execute(scope) {
    return Promise.resolve().then(() => {
      const isChild = !!this._masterColumn;
      const query = this._buildQuery();
      return query.execute({
        values: this._build.values,
        autoCommit: this.autoCommit,
        objectRows: true,
        strictParams: true,
        fetchRows: this.limit,
        showSql: true
      }).then(resp => {
        if (scope) {
          scope.attributes = this._build.attributes;
          scope.query = resp.query;
        }
        /* istanbul ignore next */
        if (!(resp && resp.rows))
          return;
        /* Create key value array for children  */
        if (this._build.children) {
          for (const child of this._build.children) {
            const prm = '__' + child._detailField;
            const arr = child._build.values[prm] =
                child._build.values[prm] || [];
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
            const obj = this._wrapRec(row, {}, this._build.attributes);
            if (this._build.children) {
              for (const child of this._build.children) {
                const masterKey = row[child._masterColumn];
                /* istanbul ignore else */
                if (masterKey) {
                  const n = child._resultRows[masterKey];
                  /* istanbul ignore next */
                  obj[child._masterAttr] = n || null;
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
   * @return {Query}
   */
  _buildQuery() {
    /* istanbul ignore else */
    if (this.attributes)
      this._addAttributes({
        model: this.model,
        tableAlias: 't',
        attributes: this.attributes,
        targetNode: this._build.attributes
      });

    const selectColumns = [];
    const joins = [];
    const orderColumns = [];

    /* 1. Prepare order columns */
    if (this.sort) {
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
    }

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
    for (const [key, col] of this._build.columns.entries())
      selectColumns.push(key + ' ' + col.colName);

    /* 4. Phase: Prepare joins */
    if (this._build.joins) {
      for (const join of this._build.joins.values()) {

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
    return this.connection
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

  _addAttributes(options) {
    const silent = this.silent;
    const model = options.model;

    const getAttrOptions = (attrKey, v) => {
      /* Convert string item to object representation */
      if (typeof v === 'string') {
        const m = v.match(COLUMN_PATTERN);
        v = {fieldName: m[1]};
        if (m[2])
          v.subField = m[2];
      }

      let result;
      const field = model.getField(v.fieldName, silent);
      if (!field) return;

      /* If is an associated field */
      if (field.foreignModel) {
        result = {
          ascField: field
        };
        /* If requested a sub field */
        if (v.subField) {
          if (field.hasMany) {
            /* istanbul ignore next */
            if (silent) return;
            throw new ArgumentError('`%s` is an One2Many associated field and sub values can not be used to return as single value', v.fieldName);
          }
          if (field.returnsSingleValue) {
            /* istanbul ignore next */
            if (silent) return;
            throw new ArgumentError('`%s` is an single value associated field and has no sub value `%s`', v.fieldName, v.attribute);
          }
          if (!field.returnsAttribute(v.subField))
            throw new ArgumentError('`%s` has no attribute named `%s`', v.fieldName, v.subField);
          result.attribute = v.subField;
        } else {
          if (v.attributes) {
            for (const n of Object.getOwnPropertyNames(v.attributes)) {
              if (!field.returnsAttribute(v.attributes[n] ||
                  /* istanbul ignore next */n)) {
                /* istanbul ignore next */
                if (silent) continue;
                throw new ArgumentError('`%s` has no attribute named `%s`', v.fieldName, n);
              }
              result.attributes = result.attributes || {};
              result.attributes[n] = v.attributes[n];
            }
            /* istanbul ignore next */
            if (!result.attributes) return;
          }
        }
      } else {

        result = {
          attribute: field.fieldName
        };
      }
      return result;
    };

    Object.getOwnPropertyNames(options.attributes).forEach(attrKey => {
      const request = getAttrOptions(attrKey,
          /* istanbul ignore next */
          options.attributes[attrKey] || attrKey);
      if (!request) return;
      request.targetAttr = request.targetAttr || attrKey;

      if (!request.ascField) {
        options.targetNode[request.targetAttr] = {
          column: this._addColumn(options.tableAlias, request.attribute)
        };
        return;
      }

      const ascField = request.ascField;
      let tableAlias = options.tableAlias;
      let ctx = this;
      let targetNode;
      /* If has many rows */
      if (ascField.hasMany) {
        options.targetNode[request.targetAttr] = {};
        const masterCol = this._addColumn(options.tableAlias, ascField.key);
        ctx = new FindContext({
          model: ascField.foreignModel,
          // attributes: inf.attributes,
          connection: this.connection,
          autoCommit: this.autoCommit,
          silent: this.silent,
          filter: [Op.in(ascField.foreignKey,
              new RegExp('__' + ascField.foreignKey)),
            ...(ascField.filter || /* istanbul ignore next */[])],
          sort: request.sort,
          limit: request.limit,
          offset: request.offset
        });
        const detailCol = ctx._addColumn('t', ascField.foreignField.fieldName);
        ctx._masterColumn = masterCol.colName;
        ctx._masterAttr = request.targetAttr;
        ctx._detailColumn = detailCol.colName;
        ctx._detailField = ascField.foreignKey;
        this._build.children = this._build.children || [];
        this._build.children.push(ctx);
        targetNode = ctx._build.attributes;
      } else {
        const j = this._addJoin(ascField, tableAlias);
        tableAlias = j.joinAlias;
        targetNode = options.targetNode[request.targetAttr] ||
            (options.targetNode[request.targetAttr] = {});
      }

      let fld = ascField;
      while (fld) {
        const node = targetNode;
        /* If field returns single value */
        if (fld.returnsSingleValue) {
          /* istanbul ignore else */
          if (fld.fieldName) {
            node.column = ctx._addColumn(tableAlias, fld.fieldName);
          }
        } else
        /* If requested single attribute of multi attribute field */
        if (request.attribute) {
          /* istanbul ignore else */
          if (fld.attributes.hasOwnProperty(request.attribute)) {
            const f = ctx.model.getField(request.attribute);
            node.column = ctx._addColumn(tableAlias, f.fieldName);
          }
        } else
        /* If requested some attributes of multi attribute field */
        if (request.attributes) {
          /* istanbul ignore else */
          if (!ascField.hasMany)
            node.columns = node.columns || {};
          for (const n of Object.getOwnPropertyNames(request.attributes)) {
            const t = request.attributes[n] || n;
            /* istanbul ignore else */
            if (fld.attributes.hasOwnProperty(t)) {
              const f = fld.foreignModel.getField(t);
              (ascField.hasMany ?
                  /*istanbul ignore next */node : node.columns)[n] = {
                column: ctx._addColumn(tableAlias, f.fieldName)
              };
            }
          }
        } else
        /* */
        if (fld.attributes) {
          if (!ascField.hasMany)
            node.columns = node.columns || {};
          for (const n of Object.getOwnPropertyNames(fld.attributes)) {
            const f = fld.foreignModel.getField(fld.attributes[n] || n);
            (ascField.hasMany ? node : node.columns)[n] = {
              column: ctx._addColumn(tableAlias, f.fieldName)
            };
          }
        }

        fld = fld && fld.towards;
        if (fld) {
          const j = ctx._addJoin(fld, tableAlias);
          tableAlias = j.joinAlias;
        }
      }
    });
  }

  _addColumn(tableAlias, fieldName) {
    const s = (tableAlias + '.' + fieldName);
    let o = this._build.columns.get(s);
    if (o)
      return o;
    o = {
      colName: 'col' + (this._build.columns.size + 1),
      source: s
    };
    this._build.columns.set(s, o);
    return o;
  }

  _addJoin(ascField, parentAlias) {
    this._build.joins = this._build.joins || new Map();
    let s = ascField.key + '>' + ascField.foreignModel.name + '.' +
        ascField.foreignKey;
    if (ascField.filter && ascField.filter.length)
      s += '|' + JSON.stringify(ascField.filter);

    let join = this._build.joins.get(s);
    if (!join) {
      join = {
        ascField,
        joinAlias: 'j' + (this._build.joins.size + 1),
        targetAlias: parentAlias
      };
      this._build.joins.set(s, join);
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
    if (this._build.children) {
      if (scope)
        scope.children = scope.children || {};
      const promises = [];
      for (const childContext of this._build.children) {
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
