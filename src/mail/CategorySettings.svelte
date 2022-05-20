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
  export let category;
  export let closeUrl;

  const { config } = jMail;

  function setCategoryConfig(callback) {
    return (e) => {
      config.update(cfg => {
        callback(e, cfg.category(category))
        return cfg
      })
    }
  }

  $: catConfig = $config.category(category)

</script>

<form>
  <p>
  <label for="category-name">Name</label>
  <input
    type="text"
    id="category-name"
    value={catConfig.name}
    on:input={setCategoryConfig((e, cfg) => {cfg.name = e.target.value})} />
  </p>
  <p>
  <label for="category-track-unreads">Track unreads</label>
  <input
    type="checkbox"
    id="category-track-unreads"
    checked={catConfig.trackUnreads}
    on:input={setCategoryConfig((e, cfg) => {cfg.trackUnreads = e.target.checked})} />
  </p>
  <p>
    <a href={closeUrl}><strong>Close</strong></a>
  </p>
</form>
