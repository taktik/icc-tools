import {flatMap,pick,omit,values} from "lodash"

export function syncDbs(fromUrl:string, toUrl:string, username: string, password: string, grep: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  Promise.all([
    axios.get(`${fromUrl}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${toUrl}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${fromUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }}),
    axios.get(`${toUrl}/_all_dbs`, { headers: { 'Authorization': basicAuth }})
  ]).then( ([fromRes, toRes, fromDbs, toDbs]) => {
    const from = fromRes.data.rows.filter(g => !grep || g.id.match(grep)).reduce((m, g) => {
      m[g.id] = g.doc;
      return m
    }, {})
    const to = toRes.data.rows.filter(g => !grep || g.id.match(grep)).reduce((m, g) => {
      m[g.id] = g.doc;
      return m
    }, {})
    console.log("%s groups on src and %s groups on destination", fromRes.data.rows.length, toRes.data.rows.length)

    let prom = Promise.resolve([])

    values(from)
      .forEach(g => prom = prom
        .then(users => axios.post(`${toUrl}/_users`, {"_id":`org.couchdb.user:${g._id}`, "name":g._id,"password":g.password, "type": "user", "roles":[]}, {headers: {'Authorization': basicAuth}})
          .then(res => users.concat([res.data]))
          .catch(e => {if (e.response && e.response.status === 409) { console.log(`${g._id} already created`)} else {console.log(e)}; return users})
        ))


    prom = prom.then(() =>[])
    values(from)
      .filter(g => !to[g._id])
      .forEach(g =>
        (prom = prom
            .then(grps => {
              console.log("Creating group %s on destination", g._id)
              return axios.post(`${toUrl}/icure-__-config`, omit(g, ['_rev']), {headers: {'Authorization': basicAuth}})
                  .then(res => grps.concat([res.data]));
              }
            )
        ))

    prom = prom.then(()=>null)

    const allDbs = flatMap(values(from), g => [[g._id,`icure-${g._id}-base`],[g._id,`icure-${g._id}-patient`],[g._id, `icure-${g._id}-healthdata`]])
    const toCreate = allDbs.filter(([g,db]) => !toDbs.data.some(x => x === db))

    toCreate.forEach(([g, db]) => {
        toDbs.data.push(db)
        return prom = prom
          .then(() => {
            console.log("Creating DB %s on destination", db)
            return axios.put(`${toUrl}/${db}`, {}, {headers: {'Authorization': basicAuth}});
          })
          .then(() => axios.put(`${toUrl}/${db}/_security`, {"admins": {"names": [], "roles": []}, "members": {"names": [g], "roles": []}}, {headers: {'Authorization': basicAuth}}))
          .catch(e => {
            return e.response && e.response.status === 412
          })
      })

    fromDbs.data.filter(g => !grep || g.id.match(grep)).forEach(db => {
      if (!toDbs.data.some(x => x === db)) {
        console.log("%s missing on destination", db)
      }
    })

  }).catch(e => console.log(e))
}
