import {chunk,values} from "lodash"
import {addNode} from './add-node'
import {removeNode} from "./remove-node";
var crypto = require('crypto');

export function fixLocalhostDbs(url:string, nodeUrl:string, username: string, password: string, grep: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  Promise.all([
    axios.get(`${nodeUrl}/_dbs/_all_docs?include_docs=true`, { headers: { 'Authorization': basicAuth }})
  ]).then( async ([{data:{rows:dbs}}]) => {
      return dbs.reduce(async (pp, {doc:db}) => {
          await pp

          if ((!grep || db._id.match(grep)) && !db._id.includes('-test')) {
              if (db.by_node['couchdb@127.0.0.1'] && Object.keys(db.by_node).length > 1) {
                  const p1 = await addNode(nodeUrl, db._id, 'couchdb@icure-prd-04.vrack.icure.cloud', username, password)
                  const p2 = await addNode(nodeUrl, db._id, 'couchdb@icure-prd-05.vrack.icure.cloud', username, password)
                  const p3 = await addNode(nodeUrl, db._id, 'couchdb@icure-prd-06.vrack.icure.cloud', username, password)
                  const p4 = await removeNode(nodeUrl, db._id, 'couchdb@127.0.0.1', username, password)

                  if (p1 || p2 || p3) {
                      const res = await axios.post(`${url}/${db._id}/_sync_shards`, null, {headers: {'Authorization': basicAuth}})
                      console.log('sync:', res)
                  }
              }
          }
      }, Promise.resolve())
  }).catch(e => console.log(e))
}
