import {omit} from "lodash"

export function restoreDb(server: string, db: string, username: string, password: string, seq: number) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);

  axios.get(`${server}/${db}/_changes`, { headers: {'Authorization': basicAuth}}).then((result) => {
    const deleted = result.data.results.filter(c => c.deleted)
    const ids = deleted.filter(c => Number(c.seq.split('-')[0]) >= (seq || 0)).map(c => [c.id, c.changes[0].rev, c.seq])
    let prom = Promise.resolve(null)
    ids.forEach(([id, rev, seq]) => {
      prom = prom
        .then(() => axios.get(`${server}/${db}/${id}`, {params: { rev: rev, revs: 'true' }, headers: {'Authorization': basicAuth}}))
        .then(({data:deleted}) => axios.get(`${server}/${db}/${id}`, {params: { rev: `${deleted._revisions.start-1}-${deleted._revisions.ids[1]}` },headers: {'Authorization': basicAuth}}))
        .then(({data:toRestore}) => {
          return Promise.all((Object.keys(toRestore._attachments || {})).map(att => axios.get(`${server}/${db}/${id}/${att}`, {params: { rev: toRestore._rev }, responseType: 'arraybuffer', headers: {'Authorization': basicAuth}}).then(res => ([att,res]))))
            .then(attachments => {
              return axios.post(`${server}/${db}`, omit(toRestore, ['_rev','_attachments']), { headers: {'Authorization': basicAuth} })
                .then(({data:restored}) =>
                  Promise.all(attachments.map(([att, res]) => (
                    axios.put(`${server}/${db}/${restored.id}/${att}`, res.data, {params: {rev: restored.rev}, headers: {'Content-Type': toRestore._attachments[att].content_type, 'Authorization': basicAuth}})
                  )))
                )
            })
        })
        .then(() => console.log(`OK: ${id}, ${seq}`))
        .catch(e =>
          console.log(`ERROR: ${id}, ${seq}`, e)
        )
    })
  })
}
