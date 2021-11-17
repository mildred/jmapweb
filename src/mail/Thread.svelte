<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import Nav from './Nav.svelte';
  import EmailBody from './EmailBody.svelte';

  export let jMail;
  export let threadId;
  export let mailboxId;

  const thread = readable([], set => {
    jMail.req([
      ['Thread/get', {
        accountId: jMail.accountId,
        ids: [threadId]
      }, '0'],
      ['Email/get', {
        accountId: jMail.accountId,
        '#ids': { resultOf: '0', name: 'Thread/get', path: '/list/*/emailIds' }
      }, '1']
    ]).then(res => {
      let emails = res[1][1].list
      console.log("thread result: %o, emails: %o", res, emails)
      set(emails)
    })
    return () => {}
  })

</script>

<Nav jMail={jMail} />

<main>
  thread:
  {#each $thread as email}
    <EmailBody jMail={jMail} email={email} />
  {/each}
</main>
