import {addNode} from "./add-node";
import {removeNode} from "./remove-node";
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var crypto = require('crypto');

export function capNodes(nodeUrl:string, node: string, username: string, password: string, grep: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  Promise.all([
    axios.get(`${nodeUrl}/_dbs/_all_docs?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
  ]).then( async ([{data:{rows:dbs}}]) => {
      return dbs.reduce(async (pp, {doc:db}) => {
          await pp
          if ((!grep || db._id.match(grep))) {
              const nodes: string[] = Object.keys(db.by_node)
              if (nodes.length>3 && nodes.some(x => x === node)) {
                  await removeNode(nodeUrl, db._id, node, username, password)
              }
          }
      }, Promise.resolve())
  }).catch(e => console.log(e))
}
