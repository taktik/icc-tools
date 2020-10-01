import {assign} from "lodash"

const uuidv4 = require('uuid/v4')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function addTokenToUsers(url: string, username: string, password: string, grep: string) {
    const axios = require('axios')
    const btoa = require('btoa')
    const basicAuth = 'Basic ' + btoa(username + ':' + password);

    console.log('Grep is ' + grep)

    axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, {headers: {'Authorization': basicAuth}}).then(({data: {rows: grps}}) => {
        let prom: Promise<Array<any>> = Promise.resolve([])
        grps.filter(g => (!grep || g.id.match(grep))).forEach(g => {
            const gurl = g.doc.servers && g.doc.servers[0] || url
            prom = prom.then(acc =>
                axios.get(`${gurl}/icure-${g.id}-base/_design/User/_view/all?include_docs=true`, {headers: {'Authorization': basicAuth}})
                    .then(({data: {rows: users}}) => {
                        users.filter(({doc: u}) => !u.applicationTokens || !Object.keys(u.applicationTokens).length)
                            .forEach(({doc: u}) =>
                                axios.put(`${gurl}/icure-${g.id}-base/${u._id}`, Object.assign(u, {applicationTokens: {'ICC': uuidv4()}}), {headers: {'Authorization': basicAuth}})
                                    .catch(e => {console.log(`${g.id} / ${u._id} : An error ${e} occured`)})
                            )
                    }))
                .catch(e => {console.log(`${g.id} : An error ${e} occured`)})
        })
    })
}
