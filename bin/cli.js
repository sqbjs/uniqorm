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
const path = require('path');

const sqb = require('sqb');
const uniqorm = require('../');

const appdir = path.resolve(__dirname, '..');

function logError(args) {
  var s = '';
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] instanceof Error) {
      if (process.env.DEBUG)
        s += ' ' + arguments[i].stack;
      else s += ' ' + arguments[i].message;
    } else s += ' ' + arguments[i];
  }
  console.log(chalk.red(s.trim()));
}

/**
 * Import Models from meta-data
 * @param {string} dialect
 * @param {string} connectString
 * @param {Object} options
 */
function exp(dialect, connectString, options) {
  try {
    console.log('Exporting metadata..');
    console.log('');
    const startTime = (new Date).getTime();

    // Build configuration
    const cfg = {};
    cfg.dialect = dialect;
    cfg.connectString = connectString;
    cfg.defaults = {
      naming: options.naming
    };

    try {
      sqb.use(require('sqb-connect-' + dialect));
    } catch (e) {
      console.log(chalk.red('No driver found for dialect "' + dialect + '"'));
    }


    const pool = sqb.pool(cfg);
    const exporter = new uniqorm.MetadataExporter();
    exporter.on('connecting', function() {
      console.log('Connecting to database..');
    });
    exporter.on('connected', function() {
      console.log('Connected');
    });

    exporter.on('process', function(v, v2, v3) {
      switch (v) {
        case 'connect':
          console.log(v2);
          break;
        case 'tables':
        case 'columns':
        case 'primary keys':
        case 'foreign keys':
          switch (v2) {
            case 'query':
              console.log('Processing ' + v + '..');
              break;
            case 'done':
              console.log('Processing ' + v + ': ' + chalk.cyan(v3) + ' ' +
                  chalk.yellow(v) + ' listed');
              break;
          }
          break;
      }
    });

    exporter.execute(pool, {
      filter: options.filter,
      naming: options.naming
    }).then(function(result) {
      const str = JSON.stringify(result, null, '\t');
      const ms = ((new Date).getTime() - startTime);
      const sec = Math.round(ms / 10) / 10;
      if (options.write) {
        fs.writeFile(path.resolve(appdir, options.write), str, 'utf8', function(err) {
          if (err)
            logError('Write file failed', err);
          else {
            console.log('Output file created: ' + options.write);
            console.log(chalk.green('Completed in ' + sec + ' sec'));
          }
        });
      } else {
        console.log(str);
        console.log(chalk.green('Completed in ' + sec + ' sec'));
      }
    }).catch(function(err) {
      logError('Failed', err);
    }).then(function() {
      pool.close(true);
    });

  } catch (e) {
    logError('Failed', e);
    console.log(chalk.yellow('Type ' +
        chalk.black('uniqorm ' + options._name + ' --help') +
        ' for more help'));
    console.log('');
  }
}

console.log(chalk.black.bold('*** Uniqorm CLI ' + pkg.version + ' ***'));

program
    .version(pkg.version)
    .command('extract <dialect> <connectString>')
    .description('Extracts meta-data from database\n\n' +
        chalk.black('  connectString:') +
        chalk.yellow(' A formatted string to connect database. Format is specific to the dialect.') +
        chalk.black('  output:') + chalk.yellow(' Output filename')
    )
    .option('-f, --filter <filter>', 'Filtering pattern\n' +
        'SCHEMA1.{TABLE1,MY_*}  > extracts tables from SCHEMA1\n' +
        'SCHEMA2.*  > extracts all tables from SCHEMA2\n' +
        'TBL_*  > extracts all tables of starts with TBL* word\n' +
        'SCHEMA1.{TABLE1,MY_*}|SCHEMA2.*|TBL_*  > combine filters'
    )
    .option('-n, --naming <value>', 'Naming rule for table and column names. (lowercase,uppercase)')
    .option('-w, --write <fileName>', 'Write result json to given file')
    .action(exp);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);

