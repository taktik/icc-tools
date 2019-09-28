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
import {setMembers} from "./set-member";
import {addGroup} from "./add-group";
import {invite} from "./invite";
import {initShards} from "./init-shards";
import {test} from "./test";
import {getHcps} from "./get-hcps";
import {cleanupUsers} from "./cleanup-users";
import {addItems} from "./add-items";
import {getOccurences} from "./get-occurences";

const program = require('commander');

program
    .command('get-occurences <url>') // sub-command name
    .alias('occs') // alternative sub-command is `al`
    .description('Get occurences') // command description
    .option('-u, --username [value]', 'Username', "icure")
    .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
    .option('-g, --grep [value]', "Regex", ".+")
    .action(function (url, args) {
        getOccurences(url, args.username, args.password, args.grep)
    })

program
  .command('get-hcps <url>') // sub-command name
  .alias('ghcps') // alternative sub-command is `al`
  .description('Get hcps') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", ".+")
  .action(function (url, args) {
    getHcps(url, args.username, args.password, args.grep)
  })

program
  .command('sync-dbs <from> <to>') // sub-command name
  .alias('sdbs') // alternative sub-command is `al`
  .description('Sync dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", ".+")
  .action(function (from, to, args) {
    syncDbs(from, to, args.username, args.password, args.grep)
  })

program
  .command('clean-users  <srv>') // sub-command name
  .alias('cu') // alternative sub-command is `al`
  .description('cleanup Users') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", null)
  .action(function (srv, args) {
    cleanupUsers(srv, args.username, args.password, args.grep)
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
  .command('init-shards <srv>') // sub-command name
  .alias('is') // alternative sub-command is `al`
  .description('Init base dbs') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", ".+")
  .action(function (srv, args) {
    initShards(srv, args.username, args.password, args.grep)
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
  .option('-x, --prefix [value]', "Prefix for replication document id", false)
  .action(function (from, to, args) {
    resyncDbs(from, to, args.username, args.password, args.grep, `_${args.endpoint}`, args.continuous, args.replicateSynced, null, args.prefix)
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
  .command('add-items <srv> <srcdb>') // sub-command name
  .alias('ai') // alternative sub-command is `asdbs`
  .description('This is advanced wizardry you should use when you want to mount a shard on a standalone db. from is the 5986 server you read  the dbbs from. to is  the 5986 standalone server') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-i, --ids [value]', "ids list", "")
  .option('-g, --grep [value]', "Regex", ".+")
  .action(function (srv, srcdb, args) {
    addItems(srv, srcdb, args.username, args.password, args.grep, args.ids.length ? args.ids.split(',') : [])
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
  .command('set-members <server>') // sub-command name
  .alias('sm') // alternative sub-command is `asv`
  .description('set members') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-g, --grep [value]', "Regex", "icure-")
  .action(function (srv, args) {
    setMembers(srv, args.username, args.password, args.grep)
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
  .command('add-group <server> <prefix> <name>') // sub-command name
  .alias('ag') // alternative sub-command is `ag`
  .description('Add group to db') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .action(function (srv, px, name, args) {
    addGroup(srv, px, name, args.username, args.password)
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

program
  .command('invite <server>') // sub-command name
  .alias('iv') // alternative sub-command is `an`
  .description('Invite list of users from JSON') // command description
  .option('-u, --username [value]', 'Username', "icure")
  .option('-p, --password [value]', "Password", "S3clud3dM@x1m@")
  .option('-f, --file [value]', "File", null)
  .action(function (srv, args) {
    invite(srv, args.username, args.password, args.file)
  })

program
  .command('test') // sub-command name
  .description('Test') // command description
  .action(function (srv, args) {
    test()
  })

// allow commander to parse `process.argv`
program.parse(process.argv);
