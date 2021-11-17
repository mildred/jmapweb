<script lang="ts">
  // vim: ft=html

  import { readable, writable } from 'svelte/store';
  import { Route } from 'tinro';
  import Nav from './mail/Nav.svelte';
  import Mailbox from './mail/Mailbox.svelte';
  import Thread from './mail/Thread.svelte';

  export let jmap;
  export let session;

  let accountId = Object.keys(session.accounts)[0]

  let mailboxes = readable([], set => {
    jmap.req([
      ['Mailbox/get', {
        accountId,
        ids: null
      }, '1']
    ]).then((resp) => {
      let boxes = resp.get('Mailbox/get', '1').list
      for(let box of boxes) {
        if(box.role) {
          boxes[box.role] = box
          boxes[`${box.role}Id`] = box.id
        }
      }
      console.log("mailboxes: %o", boxes)
      set(boxes)
    })

    // TODO: subscribe to mailbox changes

    return function cleanup() {
      // TODO: stop subscribing to mailbox changes
    }
  })

  let specific_mailboxes = readable({}, set => {
  })

  let contacts = readable([], set => {
    jmap.req([
      ['Contact/query', {
        accountId,
      }, '0'],
      ['Contact/get', {
        accountId,
        '#ids': { resultOf: '0', name: 'Contact/query', path: '/ids' }
      }, '1']
    ]).then((resp) => {
      console.log("contacts: %o", resp)
      set(resp[1][1].list)
    })
  })

  let identities = readable([], set => {
    jmap.req([
      ['Identity/get', {
        accountId,
      }, '0']
    ]).then(resp => {
      set(resp.get('0').list)
    })
  })

  let config = writable({}, set => {
    jmap.req([
      ['Mailbox/query', {
        accountId,
        filter: {
          parentId: null,
          name: 'Config'
        }
      }, '0']
    ]).then((resp) => jmap.req([
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

  config.subscribe(configValue => {
    if(!configValue.loaded) return;
    console.log("config changed: %o", configValue)
    jmap.req([
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

  //setTimeout(() => { config.update(conf => ({...conf, updatedAt: new Date().toString()})) }, 1000)

  let jMail = {
    config,
    mailboxes,
    contacts,
    accountId,
    identities,
    ...jmap
  }

  //console.log("jMail: %o session: %o accountId: %o", jMail, session, accountId)

</script>

<Route path="/*" firstmatch>

  <Route path="/mailboxes/:mailboxId/*" let:meta>
    <Mailbox jMail={jMail} mailboxId={meta.params.mailboxId} />
  </Route>

  <Route path="/threads/:threadId/*" let:meta>
    <Thread jMail={jMail} threadId={meta.params.threadId} />
  </Route>

  <Route path="/*" let:meta>
    <Mailbox jMail={jMail} />
  </Route>

</Route>