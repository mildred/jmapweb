<script lang="ts">
  // vim: ft=html

  import Nav from './Nav.svelte';

  export let jMail;
  export let urlPrefix;

  const { config } = jMail;

  function addCategory() {
    let cat = prompt("Category id:")
    config.reload()
    let cfg = $config
    cfg.categories.push(cat)
    $config = cfg
  }

</script>

<header>
  <h1>Categories</h1>
</header>

<main>
  <ul>
    {#each $config.categories as cat}
      <li>
        <a href="{urlPrefix}/categories/{cat}/">{$config.category(cat).name}</a>
        <a href="{urlPrefix}/categories/{cat}/config/">config</a>
      </li>
    {/each}
  </ul>
  <button on:click={addCategory}>Add Category</button>
</main>
