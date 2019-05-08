import {omit} from "lodash"

export function addItems(url: string, srcdb: string, username: string, password: string, grep: string, ids: Array<string>) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  console.log('Grep is ' + grep)

  axios.post(`${url}/${srcdb}/_all_docs?include_docs=true`, {keys: ids}, {headers: {'Authorization': basicAuth}})
    .then(({data: {rows: rows}}) => rows.map(r => r.doc))
    .then( items => {
      axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, {headers: {'Authorization': basicAuth}})
        .then(({data: {rows: grps}}) => {
          let prom: Promise<Array<any>> = Promise.resolve([])
          grps
            .filter(g => (!grep || g.id.match(grep)))
            .forEach(g => {
              prom = prom.then(() => {
                  return axios.post(`${url}/icure-${g.id}-base/_all_docs`, {keys: ids}, {headers: {'Authorization': basicAuth}})
                    .then(({data: {rows: rows}}) => {
                      const okIds = rows.filter(d => !d.error).map(d => d.key)
                      const docs = items.filter(i => !okIds.includes(i._id)).map(o => omit(o, ['_rev']))
                      if (docs && docs.length) {
                        console.log(`add ${docs.length} items for group: ${g.id}`)
                        return axios.post(`${url}/icure-${g.id}-base/_bulk_docs`, {docs}, {headers: {'Authorization': basicAuth}})
                      } else {
                        return null
                      }
                    })
                    .catch(e => console.log(`error for group: ${g.id}`, e));
                }
              )
            })
        })

    })
}
