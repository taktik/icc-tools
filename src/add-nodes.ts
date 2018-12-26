import {addNode} from './add-node'

export function addNodes(to: string, local: string, node: string, username: string, password: string, grep: string = null) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  return axios.get(`${to}/_all_dbs`, {headers: {'Authorization': basicAuth}}).then(({data:dbs}) => {
    let prom = Promise.resolve([])
    dbs.filter(db  => (!grep || db.match(grep))).forEach(db => {
      prom = prom.then(prev => addNode(local, db, node, username, password).then(r => r && prev.concat([r]) || prev) )
    })

    return prom
  })
}
