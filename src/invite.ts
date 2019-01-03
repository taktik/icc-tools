import {assign} from "lodash"

export function invite(to: string, username: string, password: string, file?: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  const uuidv4 = require('uuid/v4');
  const fs = require("fs");

  const entries = file && JSON.parse(fs.readFileSync(file, 'UTF-8')) || [{
    user: {login: `tz-${uuidv4()}`},
    hcp: {}
  }]

  return Promise.all(entries.map(e => {
    axios.post(`${to}`, assign(e.hcp, {
      _id: uuidv4(),
      java_type: 'org.taktik.icure.entities.HealthcareParty'
    }), {
      headers: {'Authorization': basicAuth}
    }).then((res) => assign(e.hcp, res.data) && axios.post(`${to}`, assign(e.user,
        {
          _id: uuidv4(),
          healthcarePartyId: e.hcp._id,
          java_type: 'org.taktik.icure.entities.User',
          type: 'database',
          status: 'ACTIVE',
          applicationTokens: {
            tmpFirstLogin: uuidv4()
          }
        }), {
        headers: {'Authorization': basicAuth}
      }))
      .then((res) => {
        assign(e.user, res.data)
        console.log(`${res.status}: `, e)
        return e
      }).catch(ee => console.log(ee, e))
  }))

}
