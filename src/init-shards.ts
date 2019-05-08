export function initBase(serverUrl: string, username: string, password: string, grep: string = null) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  Promise.all([
    axios.get(`${serverUrl}/_all_dbs`, {headers: {'Authorization': basicAuth}}),
  ]).then(([dbsRes]) => {

    let oprom = Promise.resolve(null)
    let i = 0;

    dbsRes.data.filter(db => db.match(/-base$/) && (!grep || db.match(grep)))
      .forEach(db => oprom = oprom
        .then(() => axios.get(`${serverUrl}/${db}`, {headers: {'Authorization': basicAuth}}))
        .then(({data: dbDet}) => ((dbDet && dbDet.doc_count) || 0) < 60000 ? db : null)
        .then(db => db && (i<10) && (++i) && axios.post(`${serverUrl}/_replicator`, {
            source: `${serverUrl.replace(/:\/\//, '://template:804e5824-8d79-4074-89be-def87278b51f@')}/icure-_template_-persphysician-fr`,
            target: `${serverUrl.replace(/:\/\//, `://${username}:${password}@`)}/${db}`
          }, {headers: {'Authorization': basicAuth}}) || console.log(`${i-10} replications queued`)
        )
        .catch(e => {
          console.log(e)
        })
      )
  })
}
