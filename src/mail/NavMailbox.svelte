<script lang="ts">
  // vim: ft=html

  export let depth = 0;
  export let mailbox = null;
  export let mailboxes;

  let parentId;
  $: parentId = mailbox ? mailbox.id : null

</script>

{#if mailbox != null}
  <a href="/mail/mailboxes/{mailbox.id}/all/">{mailbox.name}</a>
{/if}

<ul>
  {#each mailboxes as mailbox}
    {#if mailbox.parentId == parentId && depth < 1}
      <li>
        <svelte:self mailboxes={mailboxes} mailbox={mailbox} depth={depth+1} />
      </li>
    {/if}
  {/each}
</ul>
