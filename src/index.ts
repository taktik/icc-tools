#!/usr/bin/env node
import {syncDbs} from './sync-dbs'
import {resyncDbs} from './resync-dbs'
import {auditDbs} from './audit-dbs'
import {addNode} from './add-node'
import {addNodes} from './add-nodes'
import {restoreDb} from './restore-db'
import {initBase} from './init-base'
import {initViews} from "./init-views";
import {addStandaloneDbs} from "./add-standalone-db";
import {getFormTemplate, setFormTemplate} from "./get-form-template";

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
  .alias('rsdbs') // alternative sub-command is `rsdbs`
  .description('Resync existing dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", "icure-")
  .option('-e, --endpoint [value]', "Endpoint (replicate/replicator)", "replicate")
  .option('-c, --continuous', "Continuous replication", false)
  .option('-s, --replicateSynced', "Replicate already synced dbs", false)
  .action(function (from, to, args) {
    resyncDbs(from, to, args.username, args.password, args.grep, `_${args.endpoint}`, args.continuous, args.replicateSynced)
  })

program
  .command('add-standalone-dbs <from> <to>') // sub-command name
  .alias('asdbs') // alternative sub-command is `asdbs`
  .description('This is advanced wizardry you should use when you want to mount a shard on a standalone db. from is the 5986 server you read  the dbbs from. to is  the 5986 standalone server') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-u2, --toUsername [value]', 'Username', "admin")
  .option('-p2, --toPassword [value]', "Password", "@dm1nr3scu3")
  .option('-g, --grep [value]', "Regex", "icure-ms-")
  .action(function (from, to, args) {
    addStandaloneDbs(from, to, args.username, args.password, args.toUsername, args.toPassword, args.grep)
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

program
  .command('add-nodes <server> <localserver> <node>') // sub-command name
  .alias('ans') // alternative sub-command is `ans`
  .description('Add nodes to dbs. Do not use unless you know what you are doing') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", "icure-")
  .action(function (srv, localserver, node, args) {
    addNodes(srv, localserver, node, args.username, args.password, args.grep)
  })

program
  .command('get-form-template <server> <db> <id>') // sub-command name
  .alias('gft') // alternative sub-command is `ans`
  .description('Get Form template') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-f, --file [value]', "File", "/dev/stdout")
  .action(function (srv, db, id, args) {
    getFormTemplate(srv, db, id, args.username, args.password, args.file)
  })

program
  .command('set-form-template <server> <db> <id>') // sub-command name
  .alias('sft') // alternative sub-command is `ans`
  .description('Get Form template') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-f, --file [value]', "File", "/dev/stdin")
  .action(function (srv, db, id, args) {
    setFormTemplate(srv, db, id, args.username, args.password, args.file)
  })

program
  .command('restore-db <server> <db>') // sub-command name
  .alias('rd') // alternative sub-command is `an`
  .description('Restore db. Do not use unless you know what you are doing') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-s, --sequence [value]', "First sequence number", "0")
  .action(function (srv, db, args) {
    restoreDb(srv, db, args.username, args.password, Number(args.sequence))
  })

// allow commander to parse `process.argv`
program.parse(process.argv);
