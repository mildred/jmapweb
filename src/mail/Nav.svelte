<script lang="ts">
  // vim: ft=html

  import NavMailbox from './NavMailbox.svelte';
  import NavContact from './NavContact.svelte';

  export let mailboxId = null;

  export let jMail;
  const mailboxes = jMail.mailboxes
  const contacts = jMail.contacts

</script>

<header>
  <nav>
    <a href="/">JMAPWeb</a>

    <ul>
      {#if mailboxId}
      <li>
        <a href="/mail/mailboxes/{mailboxId}/compose/">Compose</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/">List</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/all/">All</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/notflagged/$seen/">Unread</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/flagged/$toreply/">To Reply</a>
      </li>
      <li>
        <a href="/mail/mailboxes/{mailboxId}/flagged/$flagged/">Referenced</a>
      </li>
      {:else}
      <li>
        <a href="/mail/compose/">Compose</a>
      </li>
      <li>
        <a href="/mail/">List</a>
      </li>
      <li>
        <a href="/mail/all/">All</a>
      </li>
      <li>
        <a href="/mail/notflagged/$seen/">Unread</a>
      </li>
      <li>
        <a href="/mail/flagged/$ToReply/">To Reply</a>
      </li>
      <li>
        <a href="/mail/flagged/$flagged/">Referenced</a>
      </li>
      {/if}
      <li>|</li>
      <li>
        <a href="#">Mailboxes</a>
        <NavMailbox mailboxes={$mailboxes} />
      </li>
      <li>
        <a href="#">Contacts</a>
        <NavContact contacts={$contacts} />
      </li>
      <li>Logout</li>
    </ul>
  </nav>
</header>
