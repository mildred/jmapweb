<script lang="ts">
  // vim: ft=html

  import { Route } from 'tinro';
  import CategorySettings from './CategorySettings.svelte';

  export let jMail;
  export let category;

  const { config } = jMail;

</script>

<header>
  <h1>{$config.category(category).name}</h1>
</header>

<Route path="/*" firstmatch let:meta>

  <Route path="/config/*">
    <CategorySettings jMail={jMail} category={category} closeUrl={`${meta.match}/`} />
  </Route>

  <p>TODO: indiquer une liste de messages non lus ici, un clic envoie sur une
  page spécifique ou on ne voir que le message avec de sboutons pour le classer
  (to reply, keep for reference, read later) et des boutons pour aller aux
  autres messages (next / previous unread). Les messages sont classés par
  threads (next/prev renvoie sur les non lus du même thread en priorité)</p>

  <Route path="/*" let:meta>
    <a href="{meta.match}/config/">Config</a>
    <slot></slot>
  </Route>
</Route>
