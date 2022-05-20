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
  export let mailbox;

  const { config } = jMail;

  function getMboxConfig(configVal, id){
    let { byMailbox } = configVal
    const catList = configVal.categories || config.defCategories
    byMailbox ||= {}
    let cfg = byMailbox[id] || {}
    cfg.category ||= catList[0]
    return cfg
  }

  function setMboxCategory(id) {
    return (e) => {
      config.update(cfg => {
        cfg.byMailbox ||= {}
        cfg.byMailbox[id] ||= {}
        cfg.byMailbox[id].category = e.target.value
        return cfg
      })
    }
  }

</script>

<form>
  <label for="mailbox-category">Catégorie :</label>
  <select id="mailbox-category" on:input={setMboxCategory(mailbox.id)}>
    {#each ($config.categories || config.defCategories) as category}
      <option value={category} selected={getMboxConfig($config, mailbox.id).category == category}>{category}</option>
    {/each}
  </select>
</form>
