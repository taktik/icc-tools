import {flatMap,pick,chunk,values} from "lodash"

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function initBase(serverUrl:string, username: string, password: string, grep: string = null) {
  const colors = require('colors/safe')
  const ProgressBar = require('progress');
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  Promise.all([
    axios.get(`${serverUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }}),
  ]).then( ([dbsRes]) => {

    let oprom = Promise.resolve(null)
    let iprom = Promise.resolve(null)
    let count = 0
    let ticks = 0

    let bar : any

    chunk(dbsRes.data.filter(db => db.match(/-base$/ && (!grep || db.match(grep)))), 20)
      .forEach(dbs => oprom = oprom
        .then(() => Promise.all(dbs.map(db => axios.get(`${serverUrl}/${db}`, {headers: {'Authorization': basicAuth}})
          .then(res => {
            if (res.data.doc_count < 50000) {
              count++
              iprom = iprom.then(() => axios.post(`${serverUrl}/_replicate`, {
                source: `http://template:804e5824-8d79-4074-89be-def87278b51f@127.0.0.1:5984/icure-_template_-persphysician-fr`,
                target: `http://${username}:${password}@127.0.0.1:5984/${db}`
              }, {headers: {'Authorization': basicAuth}}).then(() => {
                bar ? bar.tick() : ticks++
              }).catch(e => {
                console.log(e)
              }))
            }
          })
        )))
      )
    oprom = oprom.then(() => {
      bar = new ProgressBar(':bar', { width: 80, total: count});
      for (let i=0; i<ticks;i++) {
        bar.tick()
      }
    })
  })
}
