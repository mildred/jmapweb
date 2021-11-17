<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route } from 'tinro';
  import ComposeExisting from './ComposeExisting.svelte';
  import ComposeNew from './ComposeNew.svelte';

  export let jMail;
  export let mailboxId;

  let mailboxes = jMail.mailboxes

  $: console.log("draftId: %o", $mailboxes.draftsId)
  $: if(!mailboxId) mailboxId = $mailboxes.draftsId

  function getEmail(msgId) {
    return jMail.req([
      ['Email/query', {
        accountId: jMail.accountId,
        filter: {
          inMailbox: mailboxId,
          header: ['Message-ID', msgId]
        },
        limit: 1
      }, '0'],
      ['Email/get', {
        accountId: jMail.accountId,
        '#ids': { name: 'Email/query', resultOf: '0', path: '/ids'},
        fetchAllBodyValues: true
      }, '1']
    ]).then(resp => {
      console.log("get draft email: %o", resp)
      return resp.get('1').list[0]
    })
  }

</script>

{#if !mailboxId}
  <p><em>Fetching mailbox list...</em></p>
{:else}
  <Route path="/*" firstmatch>
    <Route path="/:msgId/*" let:meta>
      {#await getEmail(meta.params.msgId)}
        <p><em>Fetching draft email...</em></p>
      {:then email}
        <ComposeExisting jMail={jMail} mailboxId={mailboxId} email={email} />
      {/await}
    </Route>

    <Route path="/*">
      <ComposeNew jMail={jMail} mailboxId={mailboxId} />
    </Route>
  </Route>
{/if}
