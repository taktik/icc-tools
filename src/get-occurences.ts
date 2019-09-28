import {groupBy,values} from "lodash"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getOccurences(serverUrl:string, username: string, password: string, grep: string = null) {
    console.log('Starting')

    const axios = require('axios')
    const btoa = require('btoa')
    const basicAuth = 'Basic ' + btoa(username + ':' + password);


    const fromRes = await axios.get(`${serverUrl}/icure-__-base/_design/User/_view/all?include_docs=true&limit=3000`, {headers: {'Authorization': basicAuth}})
    const users = fromRes.data.rows.filter(u => (!grep || (u.doc.groupId && u.doc.groupId.match(grep))), {}).map(u => u.doc)

    const occurences = {}

    await values(groupBy(users, 'groupId')).reduce(async (prom, users) => {
        await prom
        const groupId = users[0].groupId;
        try {
            const rows = (await axios.post(`${serverUrl}/icure-${groupId}-base/_all_docs?include_docs=true`, {keys: users.map(u => u._id.replace(`${u.groupId}:`, ''))}, {headers: {'Authorization': basicAuth}})).data.rows;
            const hcps = rows.map(u => u.doc && u.doc.healthcarePartyId).filter(x => !!x)
            await hcps.reduce(async (prom, hcp) => {
                await prom
                const url = `${serverUrl}/icure-${groupId}-healthdata/_design/Contact/_view/service_by_hcparty_code?inclusive_end=true&start_key=["${hcp}"%2C"BE-THESAURUS"%2Cnull]&end_key=["${hcp}"%2C"BE-THESAURUS"%2C{}]&reduce=true&group_level=3`;
                const data = await axios.get(url, {headers: {'Authorization': basicAuth}})
                data.data.rows.forEach(occ => occurences[occ.key[2]] = (occurences[occ.key[2]] || 0) + occ.value)
            }, Promise.resolve())
            console.log(`${serverUrl}/icure-%s OK`, groupId)
        } catch (e) {
            console.log(`${serverUrl}/icure-%s - %s`, groupId, e.message)
            await sleep(300000)
        }
    }, Promise.resolve())

    console.log(occurences)
}
