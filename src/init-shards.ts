export function initShards(serverUrl: string, username: string, password: string, grep: string = null) {
  const axios = require('axios')
  const btoa = require('btoa')
  const basicAuth = 'Basic ' + btoa(username + ':' + password)
  const uuidv4 = require('uuid/v4')
  const crc32 = require('crc-32')

  /*
  const keys = {
    "1": "1bebb305-296a-48be-b1ab-bbeacba2311c", //"0": "eb38eb52-f5cb-490a-8fd2-7c63c40b97f5",
    "3": "a14a2aee-5a93-412e-8932-96b44a2c9c19", //"2": "984970fc-213c-4aa7-9a81-78c5334175e0",
    "5": "d45a8ef7-b2e7-4e70-9b04-9f022f92da8f", //"4": "024a766a-1dcc-42f1-a245-19b372a5b82f",
    "7": "b6428fdf-1bf3-4342-bfc9-9f07dce49899", //"6": "8de3a476-bb39-445c-89fe-6c47b8ac32b3",
    "9": "01423071-7fc5-4fec-902e-1fe14d1bae05", //"8": "b8c357a3-00d7-4a09-8754-58b122858ee7",
    "b": "3cccfb79-f68d-45c2-a8c2-5145716fb052", //"a": "1208115a-ef47-40a3-ad09-87a23f851cbf",
    "d": "2e52a19f-0d76-42b1-a7b6-2126107f1674", //"c": "bcd33951-fc80-41da-8988-55c379219e62",
    "f": "258f5793-4214-4b62-80b4-4c0ce6ba9812", //"e": "6b25bcae-a6d8-4be8-b529-16e4643f5d0f",
  }
  const keys = {
    "0": "3f901311-8911-4afa-a148-5bd272d79769", //"1": "d036b741-2a05-4618-99bf-5f88c13c2dc8",
    "2": "07a3b2cd-c431-4b76-b0cb-1b88ed90b5df", //"3": "c965a01f-25b5-4632-9c71-13f378b566be",
    "4": "8e4c8419-8d6d-4643-afe0-e54ed35dc60b", //"5": "f6d95890-9862-465c-8de4-fc4c8d12e498",
    "6": "3961006f-4096-4267-b41e-d81bc40e1623", //"7": "80046745-96ec-4182-81c9-01707e599f1f",
    "8": "4d561b5e-f81f-4caa-9976-f2fc5e21acfc", //"9": "ce76b152-41c5-486c-b121-ec8ec226d597",
    "a": "66a52808-2865-4635-b814-822fb654397e", //"b": "b768deae-ef20-422a-b37c-f4cb99b3baa8",
    "c": "c60d2f92-1e15-43f2-bf3b-483f6cbbaf18", //"d": "91a11e90-463a-4d95-92e2-26bc5959d212",
    "e": "52111061-20b0-4cdb-9186-f1d21a70f867", //"f": "933e8d52-25e6-40c6-b96c-eb9954aa0e0c"
  }
  */

  /*const keys = {
    "1": "f6b0064d-cf8a-428e-9f9b-b84465a70cc8", //"0": "4d2705b0-637f-4206-abbd-b639b4557b60",
    "3": "9079b848-cd18-4e22-ab23-ad26571935ec", //"2": "fa289f3e-7e7f-4aa2-a4fb-9a4144e3eb5f",
    "5": "b0bdb885-9cc4-4c3f-93b3-a1c37a9d53ad", //"4": "3334942b-829c-4c25-8618-448577586b47",
    "7": "728f4a57-62da-464b-8ac1-3f2600c43c89", //"6": "f3048b99-b277-4ff1-97a1-5df5f02cd02d",
    "9": "0978bdb2-de80-413f-b1dc-7f43eab19329", //"8": "9792a714-38d6-4610-9a2b-c70ea4076c95",
    "b": "39621ed3-0418-44ea-9a01-45fd82d56977", //"d": "c1b057ab-2f5e-47cf-a67b-999f2df41586",
    "c": "93ec0d13-ab95-422f-874f-d4bb924eb1a0", //"e": "d9e92c42-681a-44bf-8a2f-2a3b2f926d38",
    "f": "63bf2012-919c-445e-9751-854bd6cc5249", //"a": "913b250c-1c9f-4625-9b71-801a34153c6d"
  }*/

  const keys = {
    //"0": "5c21e0e8-3a45-4a12-899a-90336796d6b4",
    "1": "fe3c768c-902f-4aa3-8b69-c0b88c8b74fd",
    //"2": "8be2692c-4838-4a41-ac4c-acc8ed25b151",
    "3": "35e8f58f-e90f-496c-aab6-8f667c8aa21f",
    //"4": "83fe60a9-625c-445d-9609-deca2f42033a",
    "5": "4653c859-d964-496b-aa6f-92dea9d4a750",
    //"6": "6bd01dc8-4534-415c-a80e-1e93c71e02ad",
    "7": "acbf470b-e203-4c46-9ce6-e86049aea167",
    //"8": "e0778da4-40ab-4558-8048-75701144c24d",
    "9": "e82ee934-4652-4ce1-a665-9be002d874c4",
    //"d": "267f72cf-d067-4977-b0b1-986479b4bbd2",
    "c": "77f1b8bf-c7bc-4b56-b3f5-b4f31155e492",
    //"e": "d8c357a6-8a18-45bb-a93b-f1c06d4deee2",
    "f": "d5dd0da6-caaa-4f36-8adf-85877d88d639",
    //"b": "5ce11dee-dbfd-49d0-a500-4f97bfe868d7",
    "a": "41ecff7a-21b0-43e2-b610-8310f637176f",
  }
  /*
  //Above built with
  const keys = {}
  while(Object.keys(keys).length<16) {
    const id = uuidv4()
    const val = crc32.str(id)
    const hex = (val < 0 ? 0xFFFFFFFF + val + 1 : val).toString(16)

    keys[hex.length<8 ? '0' : hex.substr(0,1)] = id
  }
*/

  Promise.all([
    axios.get(`${serverUrl}/_all_dbs`, {headers: {'Authorization': basicAuth}}),
  ]).then(([dbsRes]) => {

    let prom = Promise.resolve(null)
    const filteredDbs = dbsRes.data.filter(db => (!grep || db.match(grep)))

    filteredDbs.forEach(db => prom = prom
      .then(() => axios.get(`${serverUrl}/${db}/${keys["f"]}`, {headers: {'Authorization': basicAuth}}))
      .catch(() => null)
      .then((res) => {
          if (res) {
            console.log('Skip ' + db)
            return null
          } else {
            console.log('Init shards on ' + db)
            return Promise.all(Object.keys(keys).map(k => axios.post(`${serverUrl}/${db}`, {_id: keys[k]}, {headers: {'Authorization': basicAuth}})))
          }
        }
      ).catch(e => {
        console.log(e)
      })
    )
  })
}
