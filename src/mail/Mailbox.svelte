<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { Route } from 'tinro';
  import Nav from './Nav.svelte';
  import Compose from './Compose.svelte';
  import Thread from './Thread.svelte';
  import MailboxIndex from './MailboxIndex.svelte';
  import MailboxContent from './MailboxContent.svelte';

  export let jMail;
  export let mailboxId;

</script>

<Route path="/*" firstmatch>
  <Route path="/thread/:threadId/*" let:meta>
    <Thread jMail={jMail} threadId={meta.params.threadId} mailboxId={mailboxId} />
  </Route>

  <Route path="/all/*" let:meta>
    <MailboxContent jMail={jMail} mailboxId={mailboxId} />
  </Route>

  <Route path="/flagged/:flag/*" let:meta>
    <MailboxContent jMail={jMail} mailboxId={mailboxId} flag={meta.params.flag} />
  </Route>

  <Route path="/notflagged/:flag/*" let:meta>
    <MailboxContent jMail={jMail} mailboxId={mailboxId} noflag={meta.params.flag}/>
  </Route>

  <Route path="/compose/*">
    <Compose jMail={jMail} mailboxId={mailboxId || jMail.mailboxes.draftId} />
  </Route>

  <Route path="/*">
    <MailboxIndex jMail={jMail} mailboxId={mailboxId} />
  </Route>
</Route>
