export function initBase(serverUrl:string, username: string, password: string, grep: string = null) {
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
    let ticks = 0

    let bar: any

    dbsRes.data.filter(db => db.match(/-base$/) && (!grep || db.match(grep)))
      .forEach(db => oprom = oprom
        .then(() => axios.post(`${serverUrl}/_replicator`, {
            source: `http://template:804e5824-8d79-4074-89be-def87278b51f@127.0.0.1:5984/icure-_template_-persphysician-fr`,
            target: `http://${username}:${password}@127.0.0.1:5984/${db}`
          }, {headers: {'Authorization': basicAuth}}).then(() => {
            bar ? bar.tick() : ticks++
          }).catch(e => {
            console.log(e)
          })
        ))

  })
}
