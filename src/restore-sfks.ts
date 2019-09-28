import fetch from 'node-fetch'
import {uniq, difference, chunk} from "lodash"
import {ContactDto, GroupDto, ListOfIdsDto} from "icc-api";
import { Api } from './api'
const fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function restoreSfks(url:string, username: string, password: string, grep: string, dir:string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  console.log('Grep is '+grep)

  const grps = (await axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }})).data.rows
  grps.filter(g => (!grep || g.id.match(grep))).reduce(async (p:Promise<any>,g:GroupDto) => {
    await p
    const api = new Api(url, { Authorization: `Basic ${Buffer.from(`${g.id}:${g.password}`).toString('base64')}` }, fetch as any)

    const users = (await axios.get(`${url}/icure-${g.id}-base/_design/User/_view/all?include_docs=true`, {headers: {'Authorization': basicAuth}})).data.rows;
    const hcpIds = await users.map(r => r.doc.healthcarePartyId)
        .reduce(async (p,hcpId) => {
          const res = await p
          const file = fs.readdirSync(dir).find(f => f.includes(hcpId))
          await api.cryptoicc.loadKeyPairsAsTextInBrowserLocalStorage(hcpId, api.cryptoicc.utils.hex2ua(fs.readFileSync(file, 'utf8').toString()))
          if (await api.cryptoicc.checkPrivateKeyValidity(await api.hcpartyicc.getHealthcareParty(hcpId))) {
            res.push(hcpId)
          }
          return res
        }, Promise.resolve([]))

    const oks = uniq((await axios.get(`${url}/icure-${g.id}-healthdata/_design/Contact/_view/by_hcparty_patientfk`, {headers: {'Authorization': basicAuth}})).data.rows.map(r => r.id))
    const all = uniq((await axios.get(`${url}/icure-${g.id}-healthdata/_design/Contact/_view/all`, {headers: {'Authorization': basicAuth}})).data.rows.map(r => r.id))
    const bad = difference(all, oks)
    await chunk(bad, 100).reduce(async (pp: Promise<any>,items)=> {
      await pp
      const docs = (await axios.post(`${url}/icure-${g.id}-healthdata/_all_docs?include_docs=true`, {keys: items}, {headers: {'Authorization': basicAuth}})).data.rows.map(r => r.doc)
      const patIds: Array<[string, string]> = await Promise.all(docs.map(async (doc: ContactDto) => {
        let keys
        for (let hcpId of hcpIds) {
          try {
            keys = await api.cryptoicc.extractKeysFromDelegationsForHcpHierarchy(hcpId, doc.id || '', doc.cryptedForeignKeys || {})
            if (keys) {
              return [hcpId, keys[0]]
            }
          } catch (e) {}
        }
        console.log(`No key could be found for doc ${doc.id}`)
        return null
      })) as any
      const couples = docs.map((d,idx)=>[d,patIds[idx]])
      return chunk(couples, 100).reduce(async (p: Promise<any>, docPatIdsHcpIds) => {
        await p;
        const docs = docPatIdsHcpIds.map(it=>it[0])
        const hcpIds = docPatIdsHcpIds.map(it=>it[1][0])
        const ids = docPatIdsHcpIds.map(it=>it[1][1])
        const pats = await api.patienticc.getPatientsWithUser(users, { ids })
        return pats.reduce(async (p,pat,idx)=>{
          await p
          return this.crypto
              .extractDelegationsSFKs(pat, hcpIds[idx])
              .then(secretForeignKeys => api.contacticc.modifyContact(Object.assign(docs[idx], secretForeignKeys)))
        }, Promise.resolve())
      }, Promise.resolve())
    } ,Promise.resolve())
  } ,Promise.resolve())
}
