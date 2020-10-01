import {chunk,values} from "lodash"
import {removeNode} from "./remove-node";
var crypto = require('crypto');

export function trimDbs(url:string, nodeUrl:string, clusterUrl: string, username: string, password: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  Promise.all([
    axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${nodeUrl}/_dbs/_all_docs?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
  ]).then( async ([{data:{rows:grps}}, {data:{rows:dbs}}]) => {
      return dbs.reduce(async (pp, {doc:db}) => {
          await pp
          const grp = grps.find(g => db._id.includes(g.id))
          if (grp) {
              if (grp.doc.servers && !grp.doc.servers.some(x => x.includes(clusterUrl || url))) {
                  const nodes = Object.keys(db.by_node)
                  if (nodes.length>1) {
                      const idx = parseInt(crypto.createHash('md5').update(grp.id).digest("hex").substr(0, 4), 16) % nodes.length;
                      const deleted = nodes.filter((x, i) => i !== idx);

                      await deleted.reduce(async (p, n) => {
                          await p
                          await removeNode(nodeUrl, db._id, n, username, password)
                      }, Promise.resolve())
                  }
              }
          }
      }, Promise.resolve())
  }).catch(e => console.log(e))
}
