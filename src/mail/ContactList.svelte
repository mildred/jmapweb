<script lang="ts">
  // vim: ft=html

  import Nav from './Nav.svelte';
  import NavContact from './NavContact.svelte';

  export let jMail;

  const { contacts } = jMail;

</script>

<Nav jMail={jMail}/>

<header>
  <h1>Contact List</h1>
</header>

<main>
  <NavContact contacts={$contacts} />
</main>
