import {flatMap,pick,chunk,values} from "lodash"

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function resyncDbs(fromUrl:string, toUrl:string, username: string, password: string, grep: string, endpoint:string, continuous: boolean, replicateSynced: boolean) {
  const colors = require('colors/safe')
  const ProgressBar = require('progress');
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  Promise.all([
    axios.get(`${fromUrl}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${fromUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${toUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }})
  ]).then( ([grps, fromRes, toRes]) => {
    const from = fromRes.data.filter(k => k.match(grep)).reduce((m, db) => {
      m[db] = {'db_name':db};
      return m
    }, {})
    const to = toRes.data.filter(k => k.match(grep)).reduce((m, db) => {
      m[db] = {'db_name':db};
      return m
    }, {})

    console.log('Scanning %s dbs on source and %s dbs on destination', colors.bold(Object.keys(from).length.toString()), colors.bold(Object.keys(to).length.toString()))
    const bar = new ProgressBar(':bar', { width: 80, total: Object.keys(to).length + Object.keys(from).length });

    let prom = Promise.resolve(null)
    chunk(values(from), 2)
      .forEach(gs => prom = prom
        .then(() => Promise.all(gs.map(g => axios.get(`${fromUrl}/${g.db_name}`, {headers: {'Authorization': basicAuth}})
          .then(res => {
            from[g.db_name] = res.data
            bar.tick()
          })
          .catch(e =>{
            console.log(e);
            from[g.db_name] = {doc_count:-1}
            bar.tick()
          })))

        ))

    chunk(values(to), 2)
      .forEach(gs => prom = prom
        .then(() => Promise.all(gs.map(g => axios.get(`${toUrl}/${g.db_name}`, {headers: {'Authorization': basicAuth}})
          .then(res => {
            to[g.db_name] = res.data
            bar.tick()
          })
          .catch(e => {
            console.log(e);
            to[g.db_name] = {doc_count:-1}
            bar.tick()
          })))

        ))

    prom = prom.then( () => {
      Object.keys(from).forEach(k => {
        if (k.match(grep) && to[k] && (to[k].doc_count !== from[k].doc_count || replicateSynced)) {
          console.log('Syncing %s : %s -> %s', colors.bold(k), colors.green(from[k].doc_count.toString()), colors.red(to[k].doc_count.toString()))

          const g = grps.data.rows.find(g => k.includes(g.doc._id))
          if (g) {
            prom = prom
              .then(() => console.log('%s : %s', colors.bold(k), colors.green('starting')))
              .then(() => axios.post(`${toUrl}/${endpoint}`,
              {
                source: `${fromUrl.replace('://', `://${g.doc._id}:${g.doc.password}@`)}/${k}`,
                target: `http://${g.doc._id}:${g.doc.password}@127.0.0.1:5984/${k}`,
                _id: k,
                continuous: continuous
              }, {headers: {'Authorization': basicAuth}}))
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
                    `${fromUrl.replace('://', `://${g.doc._id}:${g.doc.password}@`)}/${k}`,
                    `http://${g.doc._id}:${g.doc.password}@127.0.0.1:5984/${k}`,
                    e.response && e.response.data.reason || '<>')
                  return null
                }
              })
              .then(() => continuous && sleep(120 * 1000))
          }
        } else {
          console.log('Nothing to sync for %s', colors.bold(k))
        }
      })
    })
  }).catch(e => console.log(e))
}
