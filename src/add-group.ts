export function addGroup(to: string, prefix: string, name: string, username: string, password: string) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  const uuidv4 = require('uuid/v4');

  const groupName = prefix + '-' + uuidv4()
  const groupPassword = uuidv4()


  return axios.post(`${to}/rest/v1/group/${groupName}`, {
    "id": groupName,
    "name": name,
    "context": "Topaz",
    "databaseSynchronizations": [{
      "source": "http://template:804e5824-8d79-4074-89be-def87278b51f@127.0.0.1:5984/icure-_template_-persphysician-fr",
      "target": `http://${groupName}:${groupPassword}@127.0.0.1:5984/icure-${groupName}-base`
    }]
  }, {params: {name:name, password:groupPassword}, headers: {'Authorization': basicAuth}})
    .then((res) => {
      console.log(`${res.status}: ${JSON.stringify(res.data)}`)
  }).catch(e => console.log(e))
}
