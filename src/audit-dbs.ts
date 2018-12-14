import {chunk} from "lodash"

export function auditDbs(server:string, username: string, password: string, log: boolean) : Promise<[Array<string>,Array<string>]> {
  const colors = require('colors/safe')
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  return Promise.all([
    axios.get(`${server}/_all_dbs`, {headers: {'Authorization': +basicAuth}}),
  ]).then(([dbs]) => {
    let prom = Promise.resolve([[],[]])

    chunk(dbs.data, 10)
      .forEach(dbs =>
        (prom = prom
            .then(res => Promise.all(dbs.map(db => axios.get(`${server}/${db}`)
                .then(() => ({db: db, secure: false}))
                .catch(() => ({db: db, secure: true}))
              ))
              .then((dbs: any) => {
                dbs.forEach(db => {
                  log && !db.secure && console.log("DB %s is open !", colors.red(db.db))
                  log && db.secure && console.log("DB %s is secure !", colors.green(db.db))

                  db.secure ? res[0].push(db.db) : res[1].push(db.db)
                })
                return res
              })
            )
        ))
    return prom as Promise<[Array<string>,Array<string>]>
  })
}
