import {groupBy,values} from "lodash"

export function cleanupUsers(serverUrl:string, username: string, password: string, grep: string = null) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);


  axios.get(`${serverUrl}/icure-__-base/_design/User/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }})
  .then( fromRes => {
    const from = fromRes.data.rows.filter(u => (!grep || (u.doc.groupId && u.doc.groupId.match(grep))), {})
    const [valid, invalid] = from.reduce(([v,i],u) => { u.doc.groupId && u.doc._id.startsWith(`${u.doc.groupId}:`) && !(u.doc._id.match(/.+:.+:.+/)) ? v.push(u.doc) : i.push(u.doc); return [v,i]}, [[],[]])
    invalid.forEach(u => {
      console.log(`Delete ${u._id}`)
    })

    axios.post(`${serverUrl}/icure-__-base/_bulk_docs`, {
      "docs": invalid.map(d => ({_id:d._id, _rev:d._rev, _deleted:true}))
    }, { headers: { 'Authorization': basicAuth }})

    let prom = Promise.resolve([])
    values(groupBy(valid, 'groupId'))
      .forEach(users => {
        prom = prom
          .then(toDelete => axios.post(`${serverUrl}/icure-${users[0].groupId}-base/_all_docs`, {keys:users.map(u => u._id.replace(`${u.groupId}:`,''))}, {headers: {'Authorization': basicAuth}})
            .then(objs => toDelete.concat(objs.data.rows.map((k,idx) => Object.assign(k,{'doc': users[idx]})).filter(r => r.error === 'not_found').map(r => r.doc)))
            .catch(e => {
              console.log(`${serverUrl}/icure-%s%s`, users[0].groupId, e.message)
              return toDelete
            })
          )
      })
    prom.then(tbd => {
      tbd.forEach(d => console.log(`Delete ${d._id} - ${d.login}`))
      return axios.post(`${serverUrl}/icure-__-base/_bulk_docs`, {
        "docs": tbd.map(d => ({_id:d._id, _rev:d._rev, _deleted:true}))
      }, { headers: { 'Authorization': basicAuth }})

    })
  }).catch(e => console.log(e))
}
