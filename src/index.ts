#!/usr/bin/env node
import {syncDbs} from './sync-dbs'
import {resyncDbs} from './resync-dbs'
import {auditDbs} from './audit-dbs'
import {addNode} from './add-node'
import {initBase} from './init-base'
import {initViews} from "./init-views";

const program = require('commander');

program
  .command('sync-dbs <from> <to>') // sub-command name
  .alias('sdbs') // alternative sub-command is `al`
  .description('Sync dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .action(function (from, to, args) {
    syncDbs(from, to, args.username, args.password)
  })

program
  .command('init-base <srv>') // sub-command name
  .alias('ib') // alternative sub-command is `al`
  .description('Init base dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", ".+")
  .action(function (srv, args) {
    initBase(srv, args.username, args.password, args.grep)
  })

program
  .command('index-views <srv>') // sub-command name
  .alias('iv') // alternative sub-command is `al`
  .description('Index all views') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", ".+")
  .action(function (srv, args) {
    initViews(srv, args.username, args.password, args.grep)
  })

program
  .command('resync-dbs <from> <to>') // sub-command name
  .alias('rsdbs') // alternative sub-command is `al`
  .description('Resync existing dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", "icure-")
  .option('-e, --endpoint [value]', "Endpoint (replicate/replicator)", "replicate")
  .option('-c, --continuous', "Continuous replication", false)
  .action(function (from, to, args) {
    resyncDbs(from, to, args.username, args.password, args.grep, `_${args.endpoint}`, args.continuous)
  })

program
  .command('audit <server>') // sub-command name
  .alias('asv') // alternative sub-command is `asv`
  .description('Audit server for open dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .action(function (srv, args) {
    auditDbs(srv, args.username, args.password, true)
  })

program
  .command('add-node <server> <db> <node>') // sub-command name
  .alias('an') // alternative sub-command is `an`
  .description('Add node to db. Do not use unless you know what you are doing') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .action(function (srv, db, node, args) {
    addNode(srv, db, node, args.username, args.password)
  })

// allow commander to parse `process.argv`
program.parse(process.argv);
