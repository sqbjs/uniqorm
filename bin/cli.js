#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the uniqorm command.
 * @author Eray Hanoglu
 */

/* eslint no-console:off */

'use strict';

const program = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const fs = require('fs');
const assert = require('assert');

const sqb = require('sqb');
const uniqorm = require('../');

function logError(...err) {
  for (const s of err) {
    console.log(chalk.red(s));
  }
}

/**
 * Import Models from meta-data
 * @param {string} connectString
 * @param {Object} options
 */
function exp(connectString, options) {
  try {
    console.log('Exporting metadata from ' + chalk.yellow(connectString));
    console.log('');
    const startTime = (new Date).getTime();
    const includeSchemas = options.schema ? options.schema.split(',') : undefined;
    const includeTables = options.include ? options.include.split(',') : undefined;
    const excludeTables = options.exclude ? options.exclude.split(',') : undefined;

    if (options.schema)
      console.log('Schama         : ' + chalk.yellow(options.schema));
    if (options.include)
      console.log('Included tables: ' + chalk.yellow(options.include));
    if (options.exclude)
      console.log('Excluded tables: ' + chalk.yellow(options.exclude));
    console.log('');

    // Build configuration
    const cfg = {};
    const m = connectString.match(/^(\w+)((:\w+)(:\w+)?)?@(.+)$/);
    assert(m, 'connectString does not match required format');
    cfg.dialect = m[1];
    cfg.user = m[3].substring(1);
    cfg.password = m[4].substring(1);
    cfg.connectString = m[5];

    require('sqb-connect-' + cfg.dialect);

    const db = sqb.pool(cfg);
    const exporter = new uniqorm.MetadataExporter(db, includeSchemas, includeTables, excludeTables);

    //exporter.on('process',

    exporter.on('process', (v, v2, v3) => {
      switch (v) {
        case 'connect':
          console.log('Database: ' + v2);
          break;
        case 'tables':
        case 'columns':
        case 'primary keys':
        case 'foreign keys':
          switch (v2) {
            case 'query':
              console.log('Process ' + v + '..');
              break;
            case 'done':
              console.log('Process ' + v + ': ' + chalk.cyan(v3) + ' ' +
                  chalk.yellow(v) + ' listed');
              break;
          }
          break;
      }

    });

    exporter.execute((err, result) => {
      if (err)
        logError('Failed', err);
      else {
        const str = JSON.stringify(result, null, '\t');
        const ms = ((new Date).getTime() - startTime);
        const sec = Math.round(ms / 10) / 10;

        if (options.write) {
          fs.writeFile(options.write, str, 'utf8', (err) => {
            if (err)
              logError('Write file failed', err);
            else {
              console.log(chalk.green('Completed in ' + sec + ' sec'));
            }
          });
        } else {
          console.log(str);
          console.log(chalk.green('Completed in ' + sec + ' sec'));
        }
      }
    });

  } catch (e) {
    logError('Failed', e, '');
    console.log(chalk.yellow('Type ' +
        chalk.black('uniqorm ' + options._name + ' --help') +
        ' for more help'));
    console.log('');
  }
}

program
    .version(pkg.version)
    .command('extract <connectString>')
    .description('Extracts meta-data from database\n\n' +
        chalk.black('  connectString:') +
        chalk.yellow(' A formatted string to connect database.\n') +
        chalk.yellow('                 dialect[:user[:password]]@database'),
        chalk.black('  schema:') +
        chalk.yellow('        Name of the database schema')
    )
    .option('-s, --schema [schema]', 'Comma seperated schema names to be included in export list. All schemas will be exported if not specified')
    .option('-i, --include [table]', 'Comma seperated table names to be included in export list. All tables will be exported if not specified')
    .option('-e, --exclude <table>', 'Comma seperated table names to be excluded from export list')
    .option('-w, --write <fileName>', 'Write result json to given file')
    .action(exp);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

console.log(chalk.yellow('  ******************************'));
console.log(chalk.yellow('  UNIQORM Command Line Interface'));
console.log(chalk.yellow('  v' + pkg.version));
console.log(chalk.yellow('  ******************************'));
console.log('');

program.parse(process.argv);

