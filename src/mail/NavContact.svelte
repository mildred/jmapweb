<script lang="ts">
  // vim: ft=html

  export let depth = 0;
  export let contacts = null;
  export let contact = null;

</script>

{#if contact != null}
  <a href="/mail/contacts/{contact.id}/">{contact.firstName} {contact.lastName}</a>
{:else}
  <ul>
    {#each contacts as contact}
      <li>
        <svelte:self contacts={contacts} contact={contact} depth={depth+1} />
      </li>
    {/each}
  </ul>
{/if}
