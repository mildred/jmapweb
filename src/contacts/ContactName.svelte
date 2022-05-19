<script lang="ts">
  // vim: ft=html

  export let contact;

  $: contactName = [contact.prefix, contact.firstName, contact.lastName, contact.suffix].filter(x => x).join(' ')

</script>

{contactName}

