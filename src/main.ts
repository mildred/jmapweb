import App from './App.svelte';
import jmap from '@ee-mail/jmap-client-ts/lib/index';
import { FetchTransport } from '@ee-mail/jmap-client-ts/lib/utils/fetch-transport';
import { XmlHttpRequestTransport } from '@ee-mail/jmap-client-ts/lib/utils/xml-http-request-transport';
import { router } from 'tinro';

router.mode.hash()

console.log("jmap: %o", jmap)

let username = sessionStorage.getItem('jmapweb-username') || ''
let password = sessionStorage.getItem('jmapweb-password') || ''
let jmap_handle = {
  client: null,
  session: null,
}

if(username == '') {

  router.goto('/login')

} else {

  let transport = new XmlHttpRequestTransport(() => {
    let r = new XMLHttpRequest()
    //r.setHeader("Content-Type", "application/json")
    return r;
  })

  let orig_post = transport.post
  transport.post = function(url, content, headers) {
    return orig_post.call(this, url, content, {
      "Content-Type": "application/json",
      ...headers
    })
  }

  let sessionUrl = window.jmapweb.jmap_url
  let authorizationHeader = `Basic ${btoa(`${username}:${password}`)}`

  function JmapResponse(resp) {
    for(let propName of Object.getOwnPropertyNames(resp)) {
      this[propName] = resp[propName]
    }
  }

  JmapResponse.prototype = Object.create(Array.prototype)

  JmapResponse.prototype.get = function(name, id) {
    for(let res of this) {
      if(id === undefined && res[2] === name) return res[1];
      if(res[0] === name && res[2] === id) return res[1];
    }
    return null;
  }

  function makeJmapResponse(resp) {
    return new JmapResponse(resp);
  }

  jmap_handle.client = new jmap.Client({
    accessToken: '',
    sessionUrl,
    transport: transport,
    httpHeaders: {
      Authorization: authorizationHeader
    }
  })

  jmap_handle.req = function(requests){
    return new Promise((accept, reject) => {
      jmap_handle.session.then(session => {
        let url = new URL(session.apiUrl, sessionUrl).toString()
        transport.post(url, {
          using: jmap_handle.client.getCapabilities(),
          methodCalls: requests
        }, jmap_handle.client.httpHeaders).then(response => accept(makeJmapResponse(response.methodResponses)), error => reject(error))
      }, error => reject(error))
    })
  }

  jmap_handle.blob_url = function(accountId, blobId, name, type) {
    return jmap_handle.session
    .then(session => new URL(session.downloadUrl
                             .replace('{accountId}', encodeURIComponent(accountId))
                             .replace('{blobId}', encodeURIComponent(blobId))
                             .replace('{name}', encodeURIComponent(name || 'file.dat'))
                             .replace('{type}', encodeURIComponent(type || 'application/octet-stream')),
                             sessionUrl))
  }

  //function b64toBlob(base64, type = 'application/octet-stream') {
  //  return fetch(`data:${type};base64,${base64}`).then(res => res.blob())
  //}

  jmap_handle.blob_data = function(accountId, blobId, name, type, filter) {
    return jmap_handle.blob_url(accountId, blobId, name, type)
    .then(url => fetch(url, {
      'headers': {
        Authorization: authorizationHeader
      }
    }))
    .then(resp => resp.text())
    .then(text => filter ? filter(text, type) : text)
  }

  jmap_handle.blob = function(accountId, blobId, name, type, filter) {
    return jmap_handle.blob_data(accountId, blobId, name, type, filter)
    .then(text => new Blob([text], {type: type}))
  }

  console.log("client: %o", jmap_handle.client)

  jmap_handle.session = new Promise((accept, reject) => {
    jmap_handle.client.fetchSession().then(() => {
      let session = jmap_handle.client.getSession()
      console.log("session: %o", session)
      accept(session)

      // fixup jmap library
      jmap_handle.client.overriddenApiUrl = new URL(session.apiUrl, sessionUrl).toString()
    }, error => {
      console.log("session error: %o", error)
      router.goto('/login?failed=1')
      reject(error)
    })
  })

}

console.log("jmap handle: %o", jmap_handle)

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    jmap: jmap_handle
  }
});

export default app;