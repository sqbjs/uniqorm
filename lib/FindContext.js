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
const isPlainObject = require('putil-isplainobject');
const Op = sqb.Op;

/**
 * Module variables
 * @private
 */
const ArgumentError = errorex.ArgumentError;
const COLUMN_PATTERN = /^([\w$]+)(?:\.?([\w$]+))?$/;
const SORT_ORDER_PATTERN = /^([-+])?(?:([\w$]+)\.)?([a-zA-Z][\w$]*|\*) *(asc|dsc|desc|ascending|descending)?$/i;

/**
 *
 */
class FindContext {

  /**
   *
   * @param {Object} options
   * @param {Model} options.model
   * @param {Connection} options.connection
   * @param {Array} options.attributes
   * @param {boolean} [options.autoCommit]
   * @param {boolean} [options.silent]
   * @param {Array} [options.filter]
   * @param {Array} [options.orderBy]
   * @param {int} [options.limit]
   * @param {int} [options.offset]
   * @param {Array} [options.keyValues]
   */
  constructor(options) {
    this.model = options.model;
    this.connection = options.connection;
    this.attributes = options.attributes;
    this.filter = options.filter;
    this.orderBy = options.orderBy;
    this.limit = options.limit;
    this.offset = options.offset;
    this.autoCommit = options.autoCommit;
    this.silent = options.silent;
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
   * @return {Promise}
   */
  execute() {
    return Promise.resolve().then(() => {
      const isChild = !!this._masterColumn;

      const query = this._buildQuery();
      return query.execute({
        values: this._build.values,
        autoCommit: this.autoCommit,
        objectRows: true,
        strictParams: true,
        fetchRows: this.limit,
        showSql: (process.env.NODE_ENV === 'test')
      }).then(resp => {
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
              if (keyValue && !arr.includes(keyValue))
                arr.push(keyValue);
            }
          }
        }
        return this._executeChildren().then(() => {
          const resultRows = isChild ? {} : [];
          for (const row of resp.rows) {
            const obj = this._wrapRec(row, {}, this._build.attributes);
            if (this._build.children) {
              for (const child of this._build.children) {
                const masterKey = row[child._masterColumn];
                if (masterKey) {
                  const n = child._resultRows[masterKey];
                  obj[child._masterAttr] = n || null;
                }
              }
            }

            if (isChild) {
              const key = row[this._detailColumn];
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
        if (e.query)
          e.message += '\n' + e.query.sql;
        throw e;
      });
    });
  }

  /**
   *
   * @param {Object} resultRows
   * @return {Promise}
   */
  executeForReturning(resultRows) {
    let needRefresh = this._joins.size;
    if (!needRefresh) {
      for (const n of Object.getOwnPropertyNames(this._attributes)) {
        const attr = this._attributes[n];
        if (attr instanceof FindContext) {
          needRefresh = true;
          break;
        }
      }
    }
    if (needRefresh)
      return this.execute();
    return Promise.resolve(resultRows);
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
    if (this.orderBy) {
      for (const col of this.orderBy) {
        if (typeof col !== 'string')
          throw new ArgumentError('Invalid element in "orderBy" property');
        const m = col.match(SORT_ORDER_PATTERN);
        if (!m) {
          if (this.silent) continue;
          throw new ArgumentError('"%s" is not a valid order expression', col);
        }
        const ascName = m[2];
        let fieldName = m[3];
        let s = (m[1] || '');
        if (ascName) {
          const association = this.model.getAssociation(ascName);
          if (!association) {
            if (this.silent) continue;
            throw new ArgumentError('Model "%s" has no association "%s"', this.model.name, ascName);
          }
          if (association.kind !== 'O2O')
            throw new ArgumentError('Only One-to-One associations can be used for sort order');
          const jinfo = this._addJoin(association, 't');
          s += jinfo.joinAlias + '.';
        } else {
          if (!this.model.getField(fieldName, this.silent))
            continue;
          fieldName = 't.' + fieldName;
        }
        orderColumns.push(s + fieldName + (m[4] ? ' ' + m[4] : ''));
      }
    }

    /* 2. Phase: Add joins needed for filter clause and prepare an override map for expressions */
    const operatorOverrides = {};
    this.connection.select()
        .where(...(this.filter || []))
        .on('serialize', (ctx, type, o) => {
          if (type === 'operator' && o.expression) {
            if (!o.expression.match(/^(?:([a-zA-Z][\w$]+)\.?)+$/))
              throw new ArgumentError('Invalid column definition "%s"', o.expression);
            const arr = o.expression.split(/\./);
            const fieldName = arr.pop();
            let m = this.model;
            let tableAlias = 't';
            for (const a of arr) {
              const association = m.getAssociation(a);
              if (!association)
                throw new ArgumentError('Model "%s" has no association "%s"', m.name, a);
              const jinfo = this._addJoin(association, tableAlias);
              tableAlias = jinfo.joinAlias;
              m = association.foreignModel;
            }
            operatorOverrides[o.expression] = tableAlias + '.' + fieldName;
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
                join.association.foreignModel.tableNameFull + ' ' +
                join.joinAlias)
                .on(Op.eq('$$' + join.joinAlias + '.' +
                    join.association.foreignKey,
                    sqb.raw(join.targetAlias + '.' +
                        join.association.key)),
                    ...(join.association.filter || []))
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
          if (type === 'operator' && o.expression) {
            o.expression = o.expression.substring(0, 2) === '$$' ?
                o.expression.substring(2) :
                operatorOverrides[o.expression] || o.expression;
          }
        });
  }

  _addAttributes(options) {
    const silent = this.silent;
    const model = options.model;

    const requestedAttributeAsObject = (v) => {
      /* Convert string item to object representation */
      if (typeof v === 'string') {
        const m = v.match(COLUMN_PATTERN);
        if (!m) {
          if (silent) return;
          throw new ArgumentError('"%s" is not a valid column name', v);
        }
        const item = {};
        const field = model.getField(m[1], silent);
        if (!field)
          return;
        item.field = m[1];
        if (m[2])
          item.attribute = m[2];
        return item;
      }
      if (!isPlainObject(v)) {
        if (silent) return;
        throw new ArgumentError('Invalid attribute definition in find request');
      }
      return v;
    };

    const getAttrOptions = (requested) => {
      let attr;
      const field = model.getField(requested.field, silent);
      if (!field) return;
      if (field.foreignModel) {
        attr = {
          association: field
        };
        /* If requested a child attribute */
        if (requested.attribute) {
          if (field.field) {
            if (silent) return;
            throw new ArgumentError('`%s` is an single value associated field and has no sub value `%s`', requested.field, requested.attribute);
          }
          if (!field.attributes[requested.attribute])
            throw new ArgumentError('`%s` has no sub value `%s', requested.field, requested.attribute);
          attr.attribute = requested.attribute;
        } else {
          if (field.field)
            attr.attribute = field.field;
          else attr.attributes = requested.attributes || field.attributes;
        }
      } else {
        if (requested.attribute) {
          if (silent) return;
          throw new ArgumentError('`%s` is not an associated field and has no sub value)', requested.field);
        }
        attr = {
          attribute: requested.field
        };
      }
      return attr;
    };

    Object.getOwnPropertyNames(options.attributes).forEach(attrKey => {
      const requested = requestedAttributeAsObject(options.attributes[attrKey] ||
          attrKey);
      if (!requested) return;
      requested.field = requested.field || attrKey;

      const attr = getAttrOptions(requested);
      if (!attr) return;
      attr.targetAttr = attr.targetAttr || attrKey;

      if (options.targetNode[attr.targetAttr])
        throw new ArgumentError('Attribute `%s` declared more than once', attr.targetAttr);

      if (!attr.association) {
        options.targetNode[attr.targetAttr] = {
          column: this._addColumn(options.tableAlias, attr.attribute)
        };
        return;
      }

      const inf = attr.association._baked;

      /* If has many rows */
      if (inf.hasMany) {
        const relation = inf.relations[0];

        options.targetNode[attr.targetAttr] = {};
        const masterCol = this._addColumn(options.tableAlias, relation.key);
        const child = new FindContext({
          model: relation.foreignModel,
          // attributes: inf.attributes,
          connection: this.connection,
          autoCommit: this.autoCommit,
          silent: this.silent,
          filter: [Op.in(relation.foreignKey,
              new RegExp('__' + relation.foreignKey)), ...relation.filter],
          orderBy: attr.orderBy,
          limit: attr.limit,
          offset: attr.offset
        });
        const detailCol = child._addColumn('t', relation.foreignKey);
        child._masterColumn = masterCol.colName;
        child._masterAttr = attr.targetAttr;
        child._detailColumn = detailCol.colName;
        child._detailField = relation.foreignKey;
        let tableAlias = options.tableAlias;
        let foreignModel = relation.foreignModel;
        for (const [i, rel] of inf.relations.entries()) {
          if (!i) continue;
          const j = child._addJoin(rel, tableAlias);
          tableAlias = j.joinAlias;
          foreignModel = rel.foreignModel;
        }

        child._addAttributes({
          model: foreignModel,
          attributes: inf.attributes,
          tableAlias: tableAlias,
          targetNode: child._build.attributes
        });

        this._build.children = this._build.children || [];
        this._build.children.push(child);
        return;
      }

      /* If has single row */
      let tableAlias = options.tableAlias;
      let foreignModel;
      for (const rel of inf.relations) {
        const j = this._addJoin(rel, tableAlias);
        tableAlias = j.joinAlias;
        foreignModel = rel.foreignModel;
      }

      /* If only value association */
      if (attr.attribute) {
        options.targetNode[attr.targetAttr] = {
          column: this._addColumn(tableAlias, attr.attribute, attr.targetAttr)
        };
        return;
      }

      /* If an object value association */
      const targetNode = options.targetNode[attr.targetAttr] = {columns: {}};
      this._addAttributes({
        model: foreignModel,
        attributes: attr.attributes,
        targetAttr: attr.targetAttr,
        tableAlias: tableAlias,
        targetNode: targetNode.columns
      });
    });
  }

  _addColumn(table, column) {
    const s = (table + '.' + column);
    let o = this._build.columns.get(s);
    if (o)
      return o;
    o = {
      colName: 'col' + (this._build.columns.size + 1)
    };
    this._build.columns.set(s, o);
    return o;
  }

  _addJoin(association, parentAlias) {
    this._build.joins = this._build.joins || new Map();
    let s = association.key + '>' + association.foreignModel.name + '.' +
        association.foreignKey;
    if (association.filter && association.filter.length)
      s += '|' + JSON.stringify(association.filter);

    let join = this._build.joins.get(s);
    if (!join) {
      join = {
        association,
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
   * @return {Promise}
   * @private
   */
  _executeChildren() {
    /**/
    if (this._build.children) {
      const promises = [];
      for (const childContext of this._build.children)
        promises.push(childContext.execute());
      return Promise.all(promises);
    }
    return Promise.resolve();
  }

}

/**
 * Expose `FindContext`.
 */

module.exports = FindContext;
