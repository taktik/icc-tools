import {spawn} from "child_process";

export function test() {
  const axios = require('axios')
  const btoa = require('btoa')

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  axios.post(`https://report.icure.cloud/pdf`, "<html><body><h1>Hello world</h1></body></html>", {params: {}, responseType: 'arraybuffer', headers: {"Content-Type": "text/html; charset=utf-8",}})
    .then(response => {
      const lpr = spawn('/usr/bin/lpr', ['-P', 'Brother_HL_L2375DW_series'])
      lpr.stdin.write(response.data)
      lpr.stdin.end();
    })

}
