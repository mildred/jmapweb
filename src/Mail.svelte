<script lang="ts">
  // vim: ft=html

  import { readable, writable } from 'svelte/store';
  import { Route } from 'tinro';
  import { makeConfig } from './utils/config.js';
  import Nav from './mail/Nav.svelte';
  import Mailbox from './mail/Mailbox.svelte';
  import Thread from './mail/Thread.svelte';
  import ContactPage from './mail/ContactPage.svelte';

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

  //setTimeout(() => { config.update(conf => ({...conf, updatedAt: new Date().toString()})) }, 1000)

  let jMail = {
    mailboxes,
    contacts,
    accountId,
    identities,
    ...jmap
  }

  makeConfig(jMail)

  //console.log("jMail: %o session: %o accountId: %o", jMail, session, accountId)

  let config = jMail.config

</script>

{#if !$config.loaded }
  <p>loading config...</p>
{:else}

<Route path="/*" firstmatch>

  <Route path="/mailboxes/:mailboxId/*" let:meta>
    <Mailbox jMail={jMail} mailboxId={meta.params.mailboxId} />
  </Route>

  <Route path="/threads/:threadId/*" let:meta>
    <Thread jMail={jMail} threadId={meta.params.threadId} />
  </Route>

  <Route path="/contacts/:contactId/*" let:meta>
    <ContactPage jMail={jMail} contactId={meta.params.contactId} />
  </Route>

  <Route path="/*" let:meta>
    <Mailbox jMail={jMail} />
  </Route>

</Route>

{/if}