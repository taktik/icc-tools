
export function getFormTemplate(server:string, db:string, id: string, username: string, password: string, file: string) {
  const colors = require('colors/safe')
  const axios = require('axios')
  const btoa = require('btoa')
  const atob = require('atob')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  const fs = require("fs");

  const ua2utf8 = function(arrBuf: ArrayBuffer): string {
    var out, i, len, c, u
    var char2, char3, char4

    const array = new Uint8Array(arrBuf)

    out = ""
    len = array.length || array.byteLength
    i = 0
    while (i < len) {
      c = array[i++]
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          out += String.fromCharCode(c)
          break
        case 12:
        case 13:
          // 110x xxxx   10xx xxxx
          char2 = array[i++]
          out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f))
          break
        case 14:
          // 1110 xxxx  10xx xxxx  10xx xxxx
          char2 = array[i++]
          char3 = array[i++]
          out += String.fromCharCode(
            ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
          )
          break
        case 15:
          // 1111 xxxx  10xx xxxx  10xx xxxx  10xx xxxx
          char2 = array[i++]
          char3 = array[i++]
          char4 = array[i++]
          u =
            ((c & 0x07) << 18) |
            ((char2 & 0x3f) << 12) |
            ((char3 & 0x3f) << 6) |
            (((char4 & 0x3f) << 0) - 0x10000)
          out += String.fromCharCode(0xd800 + (u >> 10))
          out += String.fromCharCode(0xdc00 + (u & 1023))
          break
      }
    }

    return out
  }

  return Promise.all([
    axios.get(`${server}/${db}/${id}`, {headers: {'Authorization': basicAuth}}),
  ]).then(([form]) => {
    axios.get(`${server}/${db}/${id}/${form.data.layoutAttachmentId}`, {responseType: 'arraybuffer', headers: {'Authorization': basicAuth}}).then( ab => {
      const text = JSON.stringify(JSON.parse(ua2utf8(ab.data)), null, 2)
      fs.writeFileSync(file, text, "utf-8")
      console.log(text)
    })
  })
}

export function setFormTemplate(server:string, db:string, id: string, username: string, password: string, file: string) {
  const colors = require('colors/safe')
  const axios = require('axios')
  const btoa = require('btoa')
  const atob = require('atob')
  const basicAuth = 'Basic ' + btoa(username + ':' + password);
  const fs = require("fs");
  const sha = require('sha256');

  const utf82ua = function(str: string): Uint8Array {
    const utf8 = new Uint8Array(4 * str.length)
    let j = 0
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i)
      if (charcode < 0x80) {
        utf8.set([charcode], j++)
      } else if (charcode < 0x800) {
        utf8.set([0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f)], j)
        j += 2
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.set(
          [0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f)],
          j
        )
        j += 3
      } else {
        i++
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
        utf8.set(
          [
            0xf0 | (charcode >> 18),
            0x80 | ((charcode >> 12) & 0x3f),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f)
          ],
          j
        )
        j += 4
      }
    }
    return utf8.subarray(0, j)
  }

  return Promise.all([
    axios.get(`${server}/${db}/${id}`, {headers: {'Authorization': basicAuth}}),
  ]).then(([form]) => {
    const data = fs.readFileSync(file, "utf-8");
    const sha256 = sha(data)
    axios.put(`${server}/${db}/${id}`, Object.assign(form.data, {layoutAttachmentId: sha256}), {headers: {'Authorization': basicAuth}}).then( form => {
      axios.put(`${server}/${db}/${id}/${sha256}`, utf82ua(data) , {params: {rev: form.data.rev}, headers: {'Content-type': 'application/json', 'Authorization': basicAuth}}).then( res => {
        console.log(res)
      })
    })
  })
}
