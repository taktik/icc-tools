import {flatMap,pick,omit,values} from "lodash"

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*const views = ['-base/_design/User/_view/all','-base/_design/Code/_view/all','-base/_design/Tarification/_view/all','-base/_design/Insurance/_view/all','-base/_design/HealthcareParty/_view/all',
  '-patient/_design/Patient/_view/all','-patient/_design/AccessLog/_view/all',
  '-healthdata/_design/Contact/_view/all','-healthdata/_design/Document/_view/all','-healthdata/_design/HealthElement/_view/all','-healthdata/_design/Form/_view/all','-healthdata/_design/Invoice/_view/all','-healthdata/_design/Message/_view/all']*/

const views = ['-base/_design/User/_view/all','-base/_design/Code/_view/all','-base/_design/Tarification/_view/all','-base/_design/Insurance/_view/all','-base/_design/HealthcareParty/_view/all']


//const views = ['-patient/_design/Patient/_view/all']

export function initViews(serverUrl:string, username: string, password: string, grep: string = null) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  Promise.all([
    axios.get(`${serverUrl}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
  ]).then( ([fromRes]) => {
    const from = fromRes.data.rows.reduce((m, g) => {
      (!grep || g.id.match(grep)) && (m[g.id] = g.doc);
      return m
    }, {})

    let prom = Promise.resolve([])
    values(from)
      .forEach(g => views.forEach( v => prom = prom
        .then(() => axios.get(`${serverUrl}/icure-${g._id}${v}`, {params: {limit:'1'}, headers: {'Authorization': basicAuth}})
          .then(() => console.log(`${serverUrl}/icure-%s%s indexed`, g._id,v))
          .catch(e => {
            console.log(`${serverUrl}/icure-%s%s : %s`, g._id,v,e.message)
            if (e.response && e.response.status === 500) {
              return sleep(10 * 1000)
            }
          })
        )))

  }).catch(e => console.log(e))
}
