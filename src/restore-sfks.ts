import fetch from 'node-fetch'
import {chunk, difference, uniq, values} from "lodash"
import {GroupDto} from "icc-api";
import {Api} from './api'

const fs = require('fs');
const localStorage = (global as any).localStorage = new (require('node-localstorage').LocalStorage)('/tmp')
;(global as any).Storage = ''

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function restoreSfks(url:string, asurl:string, username: string, password: string, grep: string, dir:string) {
  console.log('Grep is '+grep)

  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  async function treatLinkedDocuments(g: GroupDto, usersWithKeys, oksViewName = `Contact/_view/by_hcparty_patientfk`, allViewName = `Contact/_view/all`, fixFn) {
    const oks = uniq((await axios.get(`${url}/icure-${g.id}-healthdata/_design/${oksViewName}`, {headers: {'Authorization': basicAuth}})).data.rows.map(r => r.id))
    const all = uniq((await axios.get(`${url}/icure-${g.id}-healthdata/_design/${allViewName}`, {headers: {'Authorization': basicAuth}})).data.rows.map(r => r.id))
    const bad = difference(all, oks)

    return chunk(bad, 100).reduce(async (pp: Promise<any>, items) => {
      const acc = await pp
      const docs = (await axios.post(`${url}/icure-${g.id}-healthdata/_all_docs?include_docs=true`, {keys: items}, {headers: {'Authorization': basicAuth}})).data.rows.map(r => r.doc)
      const couples: Array<[any, [string, string]]> = await docs.reduce(async (p, doc) => {
        const acc = await p
        let keys
        for (let u of usersWithKeys) {
          try {
            const api = new Api(asurl, {Authorization: `Basic ${Buffer.from(`${u._id}:${values(u.applicationTokens)[0]}`).toString('base64')}`}, fetch as any)
            keys = await api.cryptoicc.extractKeysFromDelegationsForHcpHierarchy(u.healthcarePartyId, doc._id || '', doc.cryptedForeignKeys || {})
            if (keys) {
              return acc.concat([[doc, [u, keys.extractedKeys[0]]]])
            }
          } catch (e) {
            console.log(e)
          }
        }
        console.log(`No key could be found for doc ${doc._id}`)
        return acc
      }, Promise.resolve([])) as any
      return acc.concat((await couples.reduce(async (p: Promise<any>, docPatIdHcpId) => {
        const acc = await p;
        const doc = docPatIdHcpId[0] as any
        const u = docPatIdHcpId[1][0] as any
        const id = docPatIdHcpId[1][1] as string
        const api = new Api(asurl, {Authorization: `Basic ${Buffer.from(`${u._id}:${values(u.applicationTokens)[0]}`).toString('base64')}`}, fetch as any)

        const pat = await api.patienticc.getPatientWithUser(u, id)
        const secretForeignKeys = await api.cryptoicc.extractDelegationsSFKs(pat, u.healthcarePartyId)
        return acc.concat([await fixFn(api, u, doc, secretForeignKeys)]);
      }, Promise.resolve([]))).map(r => r.id))
    }, Promise.resolve([]))
  }

  async function fixContact(api, u, doc, secretForeignKeys) {
    const ldoc = await api.contacticc.getContactWithUser(u, doc._id)
    return api.contacticc.modifyContactWithUser(u, Object.assign(ldoc, {secretForeignKeys: uniq(secretForeignKeys.extractedKeys)}))
  }

  async function fixForm(api, u, doc, secretForeignKeys) {
    const ldoc = await api.formicc.getFormWithUser(u, doc._id)
    return api.contacticc.modifyFormWithUser(u, Object.assign(ldoc, {secretForeignKeys: uniq(secretForeignKeys.extractedKeys)}))
  }

  async function fixHealthElement(api, u, doc, secretForeignKeys) {
    const ldoc = await api.helementicc.getHealthElement(doc._id)
    return api.helementicc.modifyHealthElement(Object.assign(ldoc, {secretForeignKeys: uniq(secretForeignKeys.extractedKeys)}))
  }

  async function fixInvoice(api, u, doc, secretForeignKeys) {
    const ldoc = await api.invoiceicc.getInvoice(doc._id)
    return api.contacticc.modifyInvoice(Object.assign(ldoc, {secretForeignKeys: uniq(secretForeignKeys.extractedKeys)}))
  }

  const grps = (await axios.get(`${url}/icure-__-config/_design/Group/_view/all?include_docs=true`, { headers: { 'Authorization': basicAuth }})).data.rows
  grps.filter(g => (!grep || g.id.match(grep))).reduce(async (p:Promise<any>,g:GroupDto) => {
    const acc = await p

    const users = (await axios.get(`${url}/icure-${g.id}-base/_design/User/_view/all?include_docs=true`, {headers: {'Authorization': basicAuth}})).data.rows.map(u => u.doc);
    const usersWithKeys = await users
        .reduce(async (p,u) => {
          const auth = `${u._id}:${values(u.applicationTokens)[0]}`;
          const api = new Api(asurl, { Authorization: `Basic ${Buffer.from(auth).toString('base64')}` }, fetch as any)

          const res = await p
          const file = fs.readdirSync(dir).find(f => f.includes(u.healthcarePartyId))
          if (file) {
            try {
              await api.cryptoicc.loadKeyPairsAsTextInBrowserLocalStorage(u.healthcarePartyId, api.cryptoicc.utils.hex2ua(fs.readFileSync(dir + '/' + file, 'utf8').toString()))
              const hcp = await api.hcpartyicc.getHealthcareParty(u.healthcarePartyId);
              if (hcp.parentId && await api.cryptoicc.checkPrivateKeyValidity(hcp)) {
                res.push(u)
              }
            } catch(e) {}
          }
          return res
        }, Promise.resolve([]))

    return acc.concat([{g:g.id, fixes:[]
        .concat(await treatLinkedDocuments(g, usersWithKeys, `Contact/_view/by_hcparty_patientfk`, `Contact/_view/all`, fixContact))
        .concat(await treatLinkedDocuments(g, usersWithKeys, `Form/_view/by_hcparty_patientfk`, `Form/_view/all`, fixForm))
        .concat(await treatLinkedDocuments(g, usersWithKeys, `HealthElement/_view/by_hcparty_patient`, `HealthElement/_view/all`, fixHealthElement))
        .concat(await treatLinkedDocuments(g, usersWithKeys, `Invoice/_view/by_hcparty_patientfk`, `Invoice/_view/all`, fixInvoice))}])
  } ,Promise.resolve([]))
}
