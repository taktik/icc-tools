import {values, uniq} from "lodash"

export function addNode(to: string, db: string, node: string, username: string, password: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  return axios.get(`${to}/_dbs/${db}`, {headers: {'Authorization': basicAuth}})
    .then((dbNodes) => {
      let mustSave = false
      const shards = Object.keys(dbNodes.data.by_range)
      const currentShards = dbNodes.data.by_node[node] || []

      shards.forEach(s => {
        if (!currentShards.includes(s)) {
          dbNodes.data.changelog.push(["add", s, node])
          dbNodes.data.by_range[s].push(node)
          mustSave = true
        }
      })

      if (mustSave) {
        dbNodes.data.by_node[node] = shards.map((x: any) => x)
        console.log(JSON.stringify(dbNodes.data, undefined, ' '))
        return axios.put(`${to}/_dbs/${db}`, dbNodes.data, {headers: {'Authorization': basicAuth}})
      }
  }).catch(e => console.log(e))
}
