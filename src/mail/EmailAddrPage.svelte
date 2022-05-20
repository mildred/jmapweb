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
  export let emailAddr;

  const { config } = jMail;

  function setConfig(callback) {
    return (e) => {
      config.update(cfg => {
        callback(e, cfg.email(emailAddr))
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

<Nav jMail={jMail} />

<header>
  <h1><EmailIcon jMail={jMail} email={emailAddr} /></h1>
  <h1>{emailAddr}</h1>
</header>

<main>
  <select on:input={setConfig((e, cfg) => {cfg.category = e.target.value})}>
    {#each $config.categories as cat}
      <option
        value={cat}
        selected={$config.email(emailAddr).category == cat}
        >{$config.category(cat).name}</option>
    {/each}
  </select>
</main>
