import {addNode} from "./add-node";
import {values} from "lodash"
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var crypto = require('crypto');

export function balanceDbs(url:string, nodeUrl:string, source: string, destination: string, host:string, username: string, password: string, grep: string, minSize: number = 1024 * 1024 * 1024, server?: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  Promise.all([
    axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${nodeUrl}/_dbs/_all_docs?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
  ]).then( async ([{data:{rows:grps}}, {data:{rows:dbs}}]) => {
      return dbs.reduce(async (pp, {doc:db}) => {
          await pp
          if ((!grep || db._id.match(grep))) {
              const grp = grps.find(g => db._id.includes(g.id))
              if (!server || grp && grp.doc && grp.doc.servers && grp.doc.servers[0] && grp.doc.servers[0].includes(server)) {
                  const {disk_size: size} = (await axios.get(`${grp.doc.servers[0]}/${db._id}`, {headers: {'Authorization': basicAuth}})).data
                  if (size > minSize) {
                      const nodes: string[] = Object.keys(db.by_node)
                      if ((!source || source === '*' || nodes.some(x => x === `couchdb@${source}`))) {
                          if (!values(db.by_range).every(x => x.includes(`couchdb@${destination}`))) {
                              const ignoreExisting = nodes.some(x => x === `couchdb@${destination}`)
                              const {stdout: rsync1Stdout, stderr: rsync1Stderr}: { stdout: string, stderr: string } = await exec(`ssh root@${host} "rsync -a ${ignoreExisting ? '--ignore-existing ' : ''}--include '.shards/*/*${db._id}*_design/mrview/*.view' --exclude '*.*view' --exclude '*.compact*' /media/data/baremetal/couchdb/.shards root@${destination}:/media/data/baremetal/couchdb/"`, {
                                  shell: true,
                                  maxBuffer: 10 * 1024 * 1024
                              });
                              const {stdout: rsync2Stdout, stderr: rsync2Stderr} = await exec(`ssh root@${host} "rsync -a ${ignoreExisting ? '--ignore-existing ' : ''}--include 'shards/*/*${db._id}*' --exclude '*.couch' --exclude '*.compac*' /media/data/baremetal/couchdb/shards root@${destination}:/media/data/baremetal/couchdb/"`, {
                                  shell: true,
                                  maxBuffer: 10 * 1024 * 1024
                              });
                              if (!rsync1Stderr.length && !rsync2Stderr.length) {
                                  await addNode(nodeUrl, db._id, `couchdb@${destination}`, username, password)
                                  await axios.post(`${grp.doc.servers[0]}/${db._id}/_sync_shards`, null, {headers: {'Authorization': basicAuth}})
                              }
                          }
                      }
                  }
              }
          }
      }, Promise.resolve())
  }).catch(e => console.log(e))
}
