<script lang="ts">
  // vim: ft=html

  import { readable, derived } from 'svelte/store';
  import { Route } from 'tinro';
  import Nav from './Nav.svelte';
  import Compose from './Compose.svelte';
  import Thread from './Thread.svelte';
  import MailboxIndex from './MailboxIndex.svelte';
  import MailboxContent from './MailboxContent.svelte';
  import EmailBody from './EmailBody.svelte';
  import EmailIcon from './EmailIcon.svelte';
  import tools from '../contacts/tools.js';

  export let jMail;
  export let contactId;

  const config = jMail.config;

  const contact = readable(new tools.Contact(), set => {
    jMail.req([
      ['Contact/get', {
        accountId: jMail.accountId,
        ids: [ contactId ]
      }, '0'],
    ]).then(res => {
      const contact = res[0][1].list[0]
      console.log("contact result %o: %o", res, contact)
      set(new tools.Contact(contact))
    })
    return () => {}
  })

  const messages = derived([contact], ([$contact], set) => {
    console.log('$contact', $contact)
    if(! $contact.raw.emails) {
      set([])
      return
    }

    let filters = []
    for(let email of $contact.raw.emails.map(e => e.value)) {
      for(let field of ['from', 'to', 'cc', 'bcc']) {
        filters.push({[field]: email})
      }
    }

    jMail.req([
      ['Email/query', {
        accountId: jMail.accountId,
        filter: {
          operator: 'OR',
          conditions: filters
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

  function getEmailConfig(configVal, email){
    let { byEmail } = configVal
    const catList = configVal.categories || config.defCategories
    byEmail ||= {}
    let cfg = byEmail[email] || {}
    cfg.category ||= catList[0]
    return cfg
  }

  function setEmailCategory(email) {
    return (e) => {
      config.update(cfg => {
        cfg.byEmail ||= {}
        cfg.byEmail[email] ||= {}
        cfg.byEmail[email].category = e.target.value
        return cfg
      })
    }
  }

</script>

<style>
  .email-config select {
    display: inline
  }
</style>

<Nav jMail={jMail} contactId={contactId}/>

<header>
  <h1><EmailIcon jMail={jMail} name={$contact.contactName} email={$contact.email} /></h1>
  <h1>{$contact.contactName}</h1>
</header>

<main>
  <ul class="email-config">
    {#each $contact.emails as email}
      <li>{email} -&gt;
        <select on:input={setEmailCategory(email)}>
          {#each ($config.categories || config.defCategories) as category}
            <option value={category} selected={getEmailConfig($config, email).category == category}>{category}</option>
          {/each}
        </select>
      </li>
    {/each}
  </ul>
  {#each $messages as message}
    <EmailBody jMail={jMail} email={message} />
  {/each}
</main>
