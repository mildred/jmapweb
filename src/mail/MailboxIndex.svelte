<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route } from 'tinro';
  import Nav from './Nav.svelte';
  import Thread from './Thread.svelte';

  export let jMail;
  export let mailboxId;

  function queryThreads(set, filter) {
    jMail.req([
      ['Email/query', {
        accountId: jMail.accountId,
        collapseThreads: true,
        filter: filter,
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
      }, '1'],
      ['Thread/get', {
        accountId: jMail.accountId,
        '#ids': { resultOf: '1', name: 'Email/get', path: '/list/*/threadId' }
      }, '2']
    ]).then(mails => {
      let threads = mails[2][1].list.reduce((h,v) => ({...h, [v.id]: v}), {})
      let emails = mails[1][1].list.map(v => ({...v, thread: threads[v.threadId]}))
      console.log("mailbox result: %o, threads: %o, emails: %o", mails, threads, emails)
      set(emails)
    })
    return () => {}
  }

  const threadsUnread = readable([], set => {
    return queryThreads(set, {
      inMailbox: mailboxId,
      notKeyword: '$seen'
    })
  })

  const threadsRead = readable([], set => {
    return queryThreads(set, {
      inMailbox: mailboxId,
      allInThreadHaveKeyword: '$seen'
    })
  })

  let jMailbox = {
    threadsRead,
    threadsUnread,
    ...jMail
  }

</script>

<Nav jMail={jMail} mailboxId={mailboxId}/>

<Route path="/*" let:meta>
  <main>
    <div class="unread">
      <a href="{meta.url}notflagged/$seen/">{$threadsUnread.length} unread threads</a>
      {#each $threadsUnread as thread}
        <p>
          <a href="/mail/threads/{thread.threadId}/">[{thread.thread.emailIds.length}] {thread.subject}</a>
        </p>
      {/each}
    </div>
    <hr />
    <div class="read">
      <a href="{meta.url}flagged/$seen/">{$threadsRead.length} reads threads</a>
      {#each $threadsRead as thread}
        <p>
          <a href="/mail/threads/{thread.threadId}/">[{thread.thread.emailIds.length}] {thread.subject}</a>
        </p>
      {/each}
    </div>
  </main>
</Route>
