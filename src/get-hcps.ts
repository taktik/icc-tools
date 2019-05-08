import {assign} from "lodash"

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getHcps(url:string, username: string, password: string, grep: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  console.log('Grep is '+grep)

  axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}).then( ({data:{rows:grps}}) => {
    let prom:Promise<Array<any>> = Promise.resolve([])
    grps.filter(g => (!grep || g.id.match(grep))).forEach(g => {
      prom = prom.then(acc =>
        axios.get(`${url}/icure-${g.id}-base/_design/User/_view/all?include_docs=true`, {headers: {'Authorization': basicAuth}})
          .then(({data: {rows: users}}) =>
            axios.post(`${url}/icure-${g.id}-base/_all_docs?include_docs=true`, {keys: users.map(u => u.doc.healthcarePartyId)}, {headers: {'Authorization': basicAuth}})
          )
          .then(({data: {rows: hcps}}) =>
              acc.concat(hcps.map(h => assign(h.doc, {groupId: g.id})))
          ).catch(e => acc.concat([{nihii:'<N/A>', error:e, groupId: g.id}]))
      )
    })
    prom.then(hcps => {
      const byNihii = {}
      hcps.forEach(h => { if (h.nihii) { byNihii[h.nihii] = (byNihii[h.nihii] || []).concat([h]) }})
      Object.keys(byNihii).forEach(k => {
        console.log(`${byNihii[k][0].lastName}\t${byNihii[k][0].firstName}\t${k}\t${byNihii[k].map(h => h.groupId).join(',')}`)
      })
    })
  })
}
