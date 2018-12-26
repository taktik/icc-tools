
export function addStandaloneDbs(fromUrl: string, toUrl: string, username: string, password: string, toUsername: string, toPassword: string, grep: string) {
  const axios = require('axios')
  const btoa = require('btoa')

  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  const toBasicAuth = 'Basic ' + btoa(toUsername + ':' + toPassword);

  axios.get(`${fromUrl}/_dbs/_all_docs?include_docs=true`, {headers: {'Authorization': basicAuth}})
    .then(({data: {rows: dbs}}) => {

      let prom = Promise.resolve(null)
      dbs.filter(({doc:db}) => (!grep || db._id.match(grep))).forEach(({doc:db}) => {
        prom = prom.then(() =>
          axios.post(`${toUrl}/_dbs`, {
            _id: db._id,
            shard_suffix: db.shard_suffix,
            changelog: [
              ["add", "00000000-1fffffff", "couchdb@127.0.0.1"],
              ["add", "20000000-3fffffff", "couchdb@127.0.0.1"],
              ["add", "40000000-5fffffff", "couchdb@127.0.0.1"],
              ["add", "60000000-7fffffff", "couchdb@127.0.0.1"],
              ["add", "80000000-9fffffff", "couchdb@127.0.0.1"],
              ["add", "a0000000-bfffffff", "couchdb@127.0.0.1"],
              ["add", "c0000000-dfffffff", "couchdb@127.0.0.1"],
              ["add", "e0000000-ffffffff", "couchdb@127.0.0.1"]
            ],
            by_node: {
              "couchdb@127.0.0.1": [
                "00000000-1fffffff","20000000-3fffffff","40000000-5fffffff","60000000-7fffffff","80000000-9fffffff","a0000000-bfffffff","c0000000-dfffffff","e0000000-ffffffff"
              ]
            },
            by_range: {
              "00000000-1fffffff": ["couchdb@127.0.0.1"],
              "20000000-3fffffff": ["couchdb@127.0.0.1"],
              "40000000-5fffffff": ["couchdb@127.0.0.1"],
              "60000000-7fffffff": ["couchdb@127.0.0.1"],
              "80000000-9fffffff": ["couchdb@127.0.0.1"],
              "a0000000-bfffffff": ["couchdb@127.0.0.1"],
              "c0000000-dfffffff": ["couchdb@127.0.0.1"],
              "e0000000-ffffffff": ["couchdb@127.0.0.1"]
            }
          } ,{headers: {'Authorization': toBasicAuth}})
        ).catch(e => console.log(e))
      })
    }).catch(e => console.log(e))
}
