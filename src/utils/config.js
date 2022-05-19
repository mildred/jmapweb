import { readable, writable } from 'svelte/store';

export function makeConfig(jMail){
  let config;

  jMail.config = config = writable({}, set => {
    let accountId = jMail.accountId
    jMail.req([
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
      console.log("config: %o", resp)
      let configMailbox = {...{...resp[0][1].created}.config}.id || resp[1][1].filter.inMailbox
      let configMail ={...resp[2][1].list[0]}.id
      let email = resp[2][1].list[0]
      let data = email ? JSON.parse(email.bodyValues['1'].value) : null
      console.log("config data: %o", data)
      set({
        configMailbox,
        loaded: true,
        ...data
      })
    })
  })

  jMail.config.subscribe(configValue => {
    if(!configValue.loaded) return;
    console.log("config changed: %o", configValue)
    let accountId = jMail.accountId
    jMail.req([
      ['Email/query', {
        accountId,
        filter: {
          inMailbox: configValue.configMailbox,
          header: ['X-JMAPWeb-Config', 'v1']
        }
      }, '0'],
      ['Email/set', {
        accountId,
        create: {
          configMail: {
            mailboxIds: { [configValue.configMailbox]: true },
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
                value: JSON.stringify(configValue),
                isTruncated: false
              }
            }
          }
        },
        '#destroy': { resultOf: '0', name: 'Email/query', path: '/ids' }
      }, '1']
    ]).then((resp) => {
      console.log("save config: %o", resp)
    })
  })

  config.defCategories = ['$conversation', '$news', '$paperwork']
}

