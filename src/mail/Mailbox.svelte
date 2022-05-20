<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route } from 'tinro';
  import Nav from './Nav.svelte';
  import Compose from './Compose.svelte';
  import Thread from './Thread.svelte';
  import MailboxIndex from './MailboxIndex.svelte';
  import MailboxContent from './MailboxContent.svelte';
  import MailboxSettings from './MailboxSettings.svelte';
  import CategoryPage from './CategoryPage.svelte';
  import Filter from './Filter.svelte';
  import CategoryList from './CategoryList.svelte';

  export let jMail;
  export let mailboxId = undefined;

  const { mailboxes } = jMail;

  $: mailbox = ($mailboxes || []).find(m => m.id == mailboxId)

</script>

<Route path="/*" firstmatch>
  <Route path="/thread/:threadId/*" let:meta>
    <Thread jMail={jMail} threadId={meta.params.threadId} mailboxId={mailboxId} />
  </Route>

  <Route path="/compose/*">
    <Compose jMail={jMail} mailboxId={mailboxId || jMail.mailboxes.draftId} />
  </Route>

  <Route path="/*" firstmatch let:meta>
    <Nav jMail={jMail} mailboxId={mailboxId}/>

    {#if mailbox}
      <header>
        <h1>{mailbox.name}</h1>
      </header>
      <MailboxSettings jMail={jMail} mailbox={mailbox} />
    {/if}

    <Route path="/all/*" let:meta>
      <MailboxContent jMail={jMail} mailboxId={mailboxId} />
    </Route>

    <Route path="/categories/:cat/*" let:meta>
      <CategoryPage jMail={jMail} category={meta.params.cat}>
        <MailboxContent jMail={jMail} mailboxId={mailboxId} filter={ {category: meta.params.cat} } />
      </CategoryPage>
    </Route>

    <Route path="/categories/*">
      <CategoryList jMail={jMail} urlPrefix={meta.match} />
    </Route>

    <Route path="/flagged/:flag/*" let:meta>
      <MailboxContent jMail={jMail} mailboxId={mailboxId} flag={meta.params.flag} />
    </Route>

    <Route path="/notflagged/:flag/*" let:meta>
      <MailboxContent jMail={jMail} mailboxId={mailboxId} noflag={meta.params.flag}/>
    </Route>

    <Route path="/list/*">
      <MailboxIndex jMail={jMail} mailboxId={mailboxId} />
    </Route>

    <Route path="/*" let:meta>
      <MailboxContent jMail={jMail} mailboxId={mailboxId} />
    </Route>
  </Route>
</Route>
