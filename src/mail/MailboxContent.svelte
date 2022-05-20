<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route } from 'tinro';
  import EmailBody from './EmailBody.svelte';
  import { genFilter } from '../utils/filter.js';

  export let jMail;
  export let mailboxId;
  export let noflag;
  export let flag;
  export let filter = null;

  let { config } = jMail;

  const emails = readable(null, set => {
    genFilter(jMail, filter).then(filter =>
      jMail.req([
        ['Email/query', {
          accountId: jMail.accountId,
          collapseThreads: true,
          filter: {
            operator: 'AND',
            conditions: [
              filter,
              {
                inMailbox: mailboxId,

                ... noflag ? { notKeyword: noflag } : {},
                ... flag ? { hasKeyword: flag } : {},
              }
            ].filter(x => x)
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
      ])
    ).then(res => {
      let emails = res[1][1].list
      console.log("emails result: %o, emails: %o", res, emails)
      return emails
    }).then(emails => {
      set(emails)
    })
    return () => {}
  })

  let jMailbox = {
    emails,
    ...jMail
  }

</script>

<main>
  {#if $emails}
    {#each $emails as email}
      <EmailBody jMail={jMail} email={email} />
    {/each}
  {:else}
    <p>Fetching emails...</p>
  {/if}
</main>
