<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route, meta, router } from 'tinro';
  import Nav from './Nav.svelte';

  export let jMail;
  export let mailboxId;

  function genEmailId(mailboxId) {
    if(!mailboxId) {
      console.log("Cannot create draft mail without mailbox")
      return;
    }
    jMail.req([
      ['Email/set', {
        accountId: jMail.accountId,
        create: {
          draft: {
            mailboxIds: {
              [mailboxId]: true
            }
          }
        }
      }, '1']
    ]).then((resp) => {
      console.log("create draft: %o", resp)
      let emailId = resp.get('1').created.draft.id
      return jMail.req([
        ['Email/get', {
          accountId: jMail.accountId,
          ids: [ emailId ],
        }, '1']
      ])
    }).then(resp => {
      let msgId = resp.get('1').list[0].messageId[0]
      router.goto(`${$router.path}${msgId}/`)
    })
  }

  $: genEmailId(mailboxId)

</script>

<Nav jMail={jMail} mailboxId={mailboxId}/>

<p><em>Generating draft e-mail in {mailboxId}...</em></p>
