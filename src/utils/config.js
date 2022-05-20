import { readable, writable } from 'svelte/store';

// First category is equivalent to no category
const defCategories = ['$noCategory', '$conversation', '$news', '$paperwork']

export class CategoryConfig {
  constructor(cat, raw) {
    if(!raw) throw "Error constructing CategoryConfig"

    this.cat = cat
    this.raw = raw
  }

  get name() {
    return this.raw.name || this.cat
  }

  set name(n) {
    this.raw.name = n
  }

  get trackUnreads() {
    if(this.raw.trackUnreads == null) return true;
    return this.raw.trackUnreads
  }

  set trackUnreads(bool) {
    this.raw.trackUnreads = bool
  }
}

export class Config {
  constructor(raw) {
    console.log("config[%s][%s] new Config(%o)", raw.configState, raw.configBlobId, this)
    if(!raw) throw "Error constructing Config"
    this.raw = raw
  }

  get configMailbox(){
    return this.raw.configMailbox
  }

  get loaded(){
    return this.raw.loaded
  }

  get byEmail(){
    this.raw.byEmail ||= {}
    return this.raw.byEmail
  }

  email(email){
    this.byEmail[email] ||= {}
    const cfg = this.byEmail[email]
    return cfg
  }

  get byMailbox(){
    this.raw.byMailbox ||= {}
    return this.raw.byMailbox
  }

  mailbox(id){
    this.byMailbox[id] ||= {}
    const cfg = this.byMailbox[id]
    return cfg
  }

  get byCategory(){
    this.raw.byCategory ||= {}
    return this.raw.byCategory
  }

  category(cat){
    this.byCategory[cat] ||= {}
    const cfg = this.byCategory[cat]
    return new CategoryConfig(cat, cfg)
  }

  get categories(){
    this.raw.categories ||= [...defCategories]
    return this.raw.categories
  }

  get nullCategory(){
    return this.categories[0]
  }

  get notNullCategories(){
    return this.categories.slice(1)
  }
}

export function makeConfig(jMail){
  let config;

  let load = function(verbose) {
    let accountId = jMail.accountId
    return jMail.req([
      ['Mailbox/query', {
        accountId,
        filter: {
          parentId: null,
          name: 'Config'
        }
      }, '0']
    ]).then((resp) => jMail.req([
      ['Mailbox/set', {
        accountId,
        create: resp[0][1].ids.length == 0 ? {
          config: {
            parentId: null,
            name: 'Config',
            isSubscribed: false
          }
        } : null
      }, '0'],
      ['Email/query', {
        accountId,
        filter: {
          //'#inMailbox': { resultOf: '1', name: 'Mailbox/query', path: '/ids/0' },
          inMailbox: resp[0][1].ids.length == 0 ? null : resp[0][1].ids[0],
          header: ['X-JMAPWeb-Config', 'v1']
        }
      }, '2'],
      ['Email/get', {
        accountId,
        '#ids': { resultOf: '2', name: 'Email/query', path: '/ids' },
        fetchTextBodyValues: true
      }, '3']
    ])).then((resp) => {
      if(verbose) console.log("config: %o", resp)
      let configMailbox = {...{...resp[0][1].created}.config}.id || resp[1][1].filter.inMailbox
      let configMail ={...resp[2][1].list[0]}.id
      let email = resp[2][1].list[0]
      let data = email ? JSON.parse(email.bodyValues['1'].value) : null
      let state = resp.get('3').state
      let blobId = email.blobId
      let raw = {
        ...data,
        configState: state,
        configBlobId: blobId,
        configMailbox,
        loaded: !!state,
      }
      if(verbose) console.log("config[%s][%s] got data: %o", state, blobId, raw)
      return new Config(raw)
    })
  }

  let setter = []

  // fetching the configuration above causes the store to notify and
  // immediatly re-save the config as soon as it fetches it. invalidating the
  // blobId and invalidating all others tabs opened on the same account.
  let disableSave = false

  config = writable(new Config({}), set => {
    setter[0] = set
    load(true).then(res => {
      try {
        disableSave = true
        set(res)
      } finally {
        disableSave = false
      }
    })
  })
  config.defCategories = defCategories
  config.reload = function(){
    const set = setter[0]
    if(set) load(true).then(res => {
      try {
        disableSave = true
        set(res)
      } finally {
        disableSave = false
      }
    })
  }

  jMail.config = config

  jMail.config.subscribe(configValue => {
    let { configBlobId, configState } = configValue.raw
    let { accountId } = jMail
    if(disableSave) return;
    if(!configValue.raw.loaded) return;
    if(!configState) throw "Missing configState in configuation";
    if(!configBlobId) throw "Missing configBlobId in configuation";
    //console.warn("config can override existing changed config...")
    //console.warn("TODO: use JMAP queryChanges to stay up to date with the configuration")
    //console.warn("TODO: get the email id from where we got the configuration to ensure we don't override an updated configuration")
    //console.warn("TODO: perform a config refresh prior to every config update in the app.")
    //console.warn("TODO: perform a query before to refresh the configState (only if the config blob is identical)")
    console.log("config[%s][%s] changed, saving: %o", configState, configBlobId, configValue)
    load(false).then(cfg => {
      if (cfg.raw.configBlobId != configBlobId) {
        console.log("config[%s][%s] Configuration has been changed: %o", cfg.raw.configState, cfg.raw.configBlobId, cfg)
        throw "Configuration mismatch"
      }
      if (cfg.raw.configState != configState) {
        configState = cfg.raw.configState
        console.log("config[%s][%s] updated state", configState, configBlobId)
      }
      return jMail.req([
        ['Email/query', {
          accountId,
          filter: {
            inMailbox: configValue.raw.configMailbox,
            header: ['X-JMAPWeb-Config', 'v1']
          }
        }, '0'],
        ['Email/set', {
          accountId,
          ifInState: configState,
          create: {
            configMail: {
              mailboxIds: { [configValue.raw.configMailbox]: true },
              'header:X-JMAPWeb-Config': 'v1',
              from: [{
                name: "JMAP-Web",
                email: "invalid-jmapweb@example.org"
              }],
              subject: "JMAP-Web configuration, do not remove",
              bodyStructure: {
                type: "text/plain",
                partId: "configPart"
              },
              bodyValues: {
                configPart: {
                  value: JSON.stringify(configValue.raw),
                  isTruncated: false
                }
              }
            }
          },
          '#destroy': { resultOf: '0', name: 'Email/query', path: '/ids' }
        }, '1']
      ])
    }).then((resp) => {
      const err = resp.get('error', '1')
      if(err) {
        console.log("config save error: %o", resp)
        throw err;
      } else {
        const state = resp.get('1').newState
        const blobId = resp.get('1').created.configMail.blobId
        console.log("config[%s][%s] saved: %o", state, blobId, resp)
        configValue.raw.configState = state
        configValue.raw.configBlobId = blobId
      }
    })
    .catch(err => {
      jMail.errors.push(err)
    })
  })
}

