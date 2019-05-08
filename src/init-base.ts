export function initBase(serverUrl: string, username: string, password: string, grep: string = null) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  Promise.all([
    axios.get(`${serverUrl}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
  ]).then( ([fromRes]) => {

    let oprom = Promise.resolve(null)
    let i = 0;

    const dbs = fromRes.data.rows.filter(db => (!grep || db.id.match(grep)));
    dbs
      .forEach(db => oprom = oprom
        .then(() => axios.post(`${serverUrl}/_replicator`, {
            source: `${serverUrl.replace(/:\/\//, '://tz-base-empty-72543ad5-53ea-4bf9-a05a-ff269252bf00:6494d37f-7353-4a6f-950a-97dc43b04b5c@')}/icure-tz-base-empty-72543ad5-53ea-4bf9-a05a-ff269252bf00-base`,
            target: `${serverUrl.replace(/:\/\//, `://${db.id}:${db.doc.password}@`)}/icure-${db.id}-base`
          }, {headers: {'Authorization': basicAuth}}) || console.log(`${i-10} replications queued`)
        )
        .catch(e => {
          console.log(e)
        })
      )
  })
}
