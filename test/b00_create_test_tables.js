/* eslint-disable */
require('./support/env');
const assert = require('assert');
const sqb = require('sqb');
const createTestTables = require('./support/createTestTables');

describe('Create test tables', function() {

  if (!process.env.SKIP_CREATE_TABLES) {
    let pool;

    after(() => pool && pool.close(true));

    it('create test tables', function() {
      this.slow(4000);
      pool = sqb.pool({
        dialect: 'pg',
        user: (process.env.DB_USER || 'postgres'),
        password: (process.env.DB_PASS || ''),
        host: (process.env.DB_HOST || 'localhost'),
        database: (process.env.DB || 'test'),
        schema: 'sqb_test',
        defaults: {
          naming: 'lowercase'
        }
      });
      return pool.acquire(connection => {
        return createTestTables(connection._client.intlcon, {schemas: ['uniqorm_1', 'uniqorm_2']});
      });
    }).timeout(5000);

    describe('Finalize', function() {

      it('should have no active connection after all tests', function() {
        assert.equal(pool.acquired, 0);
      });

      it('should shutdown pool', function() {
        return pool.close().then(() => {
          if (!pool.isClosed)
            throw new Error('Failed');
        });
      });

    });

  }

});
