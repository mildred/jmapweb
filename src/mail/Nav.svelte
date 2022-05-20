<script lang="ts">
  // vim: ft=html

  import { readable, derived } from 'svelte/store';
  import { genFilter } from '../utils/filter.js';
  import NavMailbox from './NavMailbox.svelte';
  import NavContact from './NavContact.svelte';

  export let mailboxId = null;
  export let contactId = null;

  export let jMail;
  const { mailboxes, contacts, config } = jMail

  const numbers = derived([config], ([$config], set) => {
    set({})
    Promise.all([
      {name: 'noflag/$seen', noflag: '$seen'},
      {name: 'flag/$toreply', flag: '$toreply'},
      {name: 'flag/$forreference', flag: '$forreference'},
      $config.categories.map(cat =>
        genFilter(jMail, {category: cat})
        .then(filter => ({name: `category/${cat}`, filter, unread: true})))
    ].flat()).then(filters =>
      filters.map(filter => (
        ['Email/query', {
          accountId: jMail.accountId,
          collapseThreads: true,
          filter: {
            operator: 'AND',
            conditions: [
              filter.filter,
              filter.unread ? {
                hasKeyword: '$seen'
              } : null,
              {
                inMailbox: filter.mailboxId,
                ... filter.noflag ? { notKeyword: filter.noflag } : {},
                ... filter.flag ? { hasKeyword: filter.flag } : {},
              }
            ].filter(x => x)
          },
          limit: 0,
          calculateTotal: true,
        }, filter.name]
      ))
    ).then(queries =>
      jMail.req(queries)
    ).then(res => {
      let numbers = {}
      for(let item of res) {
        numbers[item[2]] = item[1]
      }
      console.log("numbers: %o raw: %o", numbers, res)
      set(numbers)
    })
    return () => {}
  })

  $: console.log('numbers:', $numbers)

</script>

<header>
  <nav>
    <a href="/">JMAPWeb</a>

    <ul>
      {#each $config.categories as category}
        <li>
          <a href={`/mail/categories/${category}/`}>
            {$config.category(category).name}
            <sup>{$numbers[`category/${category}`]?.total ?? '?'}</sup>
          </a>
        </li>
      {/each}
      {#if mailboxId}
      <li>
        <a href="/mail/mailboxes/{mailboxId}/compose/"> Compose </a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/list/">List</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/all/">All</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/notflagged/$seen/">
          Unread
        </a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/flagged/$toreply/">
          To Reply
        </a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/flagged/$forreference/">
          For Reference
        </a>
      </li>
      {:else}
      <li>
        <a href="/mail/compose/">Compose</a>
      </li>
      <li>
        <a href="/mail/list/">List</a>
      </li>
      <li>
        <a href="/mail/all/">All</a>
      </li>
      <li>
        <a href="/mail/notflagged/$seen/">
          Unread
          <sup>{$numbers['noflag/$seen']?.total || '?'}</sup>
        </a>
      </li>
      <li>
        <a href="/mail/flagged/$toreply/">
          To Reply
          <sup>{$numbers['flag/$toreply']?.total ?? '?'}</sup>
        </a>
      </li>
      <li>
        <a href="/mail/flagged/$forreference/">
          For Reference
          <sup>{$numbers['flag/$forreference']?.total ?? '?'}</sup>
        </a>
      </li>
      {/if}
      <li>
        <a href="#">⚙️</a>
        <ul>
          <li><a href="/mail/categories/">Categories</a></li>
          <li><a href="/mail/mailboxes/">Mailboxes</a></li>
          <li><a href="/mail/contacts/">Contacts</a></li>
          <li>Logout</li>
        </ul>
      </li>
    </ul>
  </nav>
</header>
