import {flatMap,pick,chunk,values} from "lodash"

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function resyncDbs(fromUrl:string, toUrl:string, username: string, password: string, grep: string, endpoint:string, continuous: boolean, replicateSynced: boolean, alternateSource:string, prefix: string) {
  const colors = require('colors/safe')
  const ProgressBar = require('progress');
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  console.log('Grep is '+grep)

  Promise.all([
    axios.get(`${fromUrl}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${fromUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${toUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }})
  ]).then( ([{data:{rows:grps}}, fromRes, toRes]) => {
    const from = fromRes.data.filter(k => k.match(grep) && grps.some(g=>k.includes(g.id))).reduce((m, db) => {
      m[db] = {'db_name':db};
      return m
    }, {})
    const to = toRes.data.filter(k => k.match(grep) && grps.some(g=>k.includes(g.id))).reduce((m, db) => {
      m[db] = {'db_name':db};
      return m
    }, {})

    const toCreate = Object.keys(from).filter(db => !to[db])

    let prom = Promise.resolve(null)

   grps.forEach(g => {
      prom = prom
        .then(() => {
          return axios.get(`${toUrl}/_users/org.couchdb.user:${g.id}`, {headers: {'Authorization': basicAuth}});
        })
        .catch(e => {
          if (e.response && e.response.status === 404) {
            console.log("Creating User %s on destination", g.id)
            return axios.post(`${toUrl}/_users`, {
              "_id": `org.couchdb.user:${g.id}`,
              "name": g.id,
              "type": "user",
              "roles": [],
              "password": g.doc.password
            }, {headers: {'Authorization': basicAuth}})
          }
          return null
        })
    })

    const grpIds = grps.map(g => g.id)

    toCreate.forEach(db => {
      to[db] = {'db_name':db, 'doc_count':0};
      prom = prom
        .then(() => {
          console.log("Creating DB %s on destination", db)
          return axios.put(`${toUrl}/${db}`, {}, {headers: {'Authorization': basicAuth}});
        })
        .then(() =>
          axios.put(`${toUrl}/${db}/_security`, {"admins": {"names": [], "roles": []}, "members": {"names": [grpIds.find(g=>db.includes(g))], "roles": []}}, {headers: {'Authorization': basicAuth}})
        )
        .catch(e => {
          return e.response && e.response.status === 412
        })
    })


    if (!replicateSynced) {
      let bar = null
      prom = prom.then(() => {
        console.log('Scanning %s dbs on source and %s dbs on destination', colors.bold(Object.keys(from).length.toString()), colors.bold(Object.keys(to).length.toString()))
        bar = new ProgressBar(':bar', { width: 80, total: Object.keys(to).length + Object.keys(from).length });
      })
      chunk(values(from), 10)
        .forEach(gs => prom = prom
          .then(() => Promise.all(gs.map(g => axios.get(`${fromUrl}/${g.db_name}`, {headers: {'Authorization': basicAuth}})
            .then(res => {
              from[g.db_name] = res.data
              bar.tick()
            })
            .catch(e => {
              console.log(e);
              from[g.db_name] = {doc_count: -1}
              bar.tick()
            })))
          ))

      chunk(values(to), 10)
        .forEach(gs => prom = prom
          .then(() => Promise.all(gs.map(g => axios.get(`${toUrl}/${g.db_name}`, {headers: {'Authorization': basicAuth}})
            .then(res => {
              to[g.db_name] = res.data
              bar.tick()
            })
            .catch(e => {
              console.log(e);
              to[g.db_name] = {doc_count: -1}
              bar.tick()
            })))
          ))
    }

    const toSync = Object.keys(from).filter(k => k.match(grep) && to[k] && (replicateSynced || to[k].doc_count !== from[k].doc_count))
    chunk(toSync, 10).forEach(syncs => {
      prom = prom.then( () => {
        return Promise.all(syncs.map(k => {
          console.log('Syncing %s : %s -> %s', colors.bold(k), colors.green((from[k].doc_count || '-').toString()), colors.red((to[k].doc_count||'-').toString()))

          const g = grps.find(g => k.includes(g.id))
          if (g) {
            console.log('%s : %s', colors.bold(k), colors.green('starting'))
            const kAuth = 'Basic ' + btoa(g.doc._id + ':' + g.doc.password);

            return axios.get(`${toUrl}/${k}`,{headers: {'Authorization': kAuth}})
              .catch(e => {
                console.log(`Adding security config for: ${k}`)
                return axios.put(`${toUrl}/${k}/_security`,
                  {
                    admins: { names: [], roles: [] },
                    members: { "names": [g.doc._id], "roles": [] }
                  },
                  {headers: {'Authorization': basicAuth}})
              })
              .then( () => {
                const repDoc = {
                  source: `${(alternateSource||fromUrl).replace('://', `://${g.doc._id}:${g.doc.password}@`)}/${k}`,
                  target: `${(toUrl).replace('://', `://${g.doc._id}:${g.doc.password}@`)}/${k}`,
                  _id: (prefix || '')+k,
                  continuous: continuous || false
                }
                //console.log(`posting replication doc`, repDoc)
                return axios.post(`${toUrl}/${endpoint}`,
                repDoc, {headers: {'Authorization': basicAuth}, timeout: 180000})
              })
              .then(() => console.log('%s : %s', colors.bold(k), colors.green('done')))
              .catch((e) => {
                if (e.response && e.response.status === 504) {
                  console.log('%s : %s', colors.bold(k), colors.yellow('timeout'))
                  return sleep(60 * 1000)
                } else {
                  console.log('%s : %s, [%s]\n%s -> %s\n%s',
                    colors.bold(k),
                    colors.red(e.message),
                    colors.red(e.response && e.response.data.error || '<>'),
                    `${(alternateSource||fromUrl).replace('://', `://${g.doc._id}:${g.doc.password}@`)}/${k}`,
                    `http://${g.doc._id}:${g.doc.password}@127.0.0.1:5984/${k}`,
                    e.response && e.response.data.reason || '<>')
                  return null
                }
              })
              .then(() =>
                axios.get(`${toUrl}/_active_tasks`, {headers: {'Authorization': basicAuth}}).then(res => {
                  return res.data.filter(f => f.type === 'replication').length > 20 ? sleep(600 * 1000) :  sleep(5 * 1000)
                }).catch(e => sleep(600 * 1000))
              )
          }}))
      })
    })
  }).catch(e => console.log(e))
}
