import {chunk} from "lodash"

export function setMembers(server:string, username: string, password: string, grep: string) : Promise<[Array<string>,Array<string>]> {
  const colors = require('colors/safe')
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  return Promise.all([
    axios.get(`${server}/_all_dbs`, {headers: {'Authorization': basicAuth}}),
  ]).then(([dbs]) => {
    let prom = Promise.resolve([[],[]])

    chunk(dbs.data.filter(db => !grep || db.match(grep)), 10)
      .forEach(dbs =>
        (prom = prom
            .then(() => Promise.all(dbs.map((db:string) => {
              const g = db.replace(/icure-(.+)-.+/, '$1')
              return axios.get(`${server}/${db}/_security`, {headers: {'Authorization': basicAuth}})
                .then((sec) => ({db: db, group: g, secure: sec.data.members && sec.data.members.names && sec.data.members.names.includes(g)}))
                .catch(() => ({db: db, group: g, secure: false}))
                .then((db: any) => {
                  !db.secure &&
                    axios.put(`${server}/${db.db}/_security`, {"admins": {"names": [], "roles": []}, "members": {"names": [db.group], "roles": []}}, {headers: {'Authorization': basicAuth}})
                })
            })))
        )
      )
    return prom as Promise<[Array<string>,Array<string>]>
  })
}
