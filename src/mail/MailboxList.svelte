<script lang="ts">
  // vim: ft=html

  import Nav from './Nav.svelte';
  import NavMailbox from './NavMailbox.svelte';

  export let jMail;

  const { mailboxes } = jMail

</script>

<Nav jMail={jMail}/>

<header>
  <h1>Mailbox list</h1>
</header>

<main>
  <NavMailbox mailboxes={$mailboxes} />
</main>

