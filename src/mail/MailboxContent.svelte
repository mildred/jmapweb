<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route } from 'tinro';
  import Nav from './Nav.svelte';
  import EmailBody from './EmailBody.svelte';

  export let jMail;
  export let mailboxId;
  export let noflag;
  export let flag;

  const emails = readable([], set => {
    jMail.req([
      ['Email/query', {
        accountId: jMail.accountId,
        collapseThreads: true,
        filter: {
          inMailbox: mailboxId,

          ... noflag ? { notKeyword: noflag } : {},
          ... flag ? { hasKeyword: flag } : {},
        },
        sort: [
          { property: 'receivedAt', isAscending: false }
        ],
        position: 0,
        limit: 100,
        calculateTotal: true,
      }, '0'],
      ['Email/get', {
        accountId: jMail.accountId,
        '#ids': { resultOf: '0', name: 'Email/query', path: '/ids' }
      }, '1']
    ]).then(res => {
      let emails = res[1][1].list
      console.log("emails result: %o, emails: %o", res, emails)
      set(emails)
    })
    return () => {}
  })

  let jMailbox = {
    emails,
    ...jMail
  }

</script>

<Nav jMail={jMail} mailboxId={mailboxId}/>

<main>
  {#each $emails as email}
    <EmailBody jMail={jMail} email={email} />
  {/each}
</main>
