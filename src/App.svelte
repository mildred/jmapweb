<script lang="ts">
  // vim: ft=html

  import { Route } from 'tinro';
  import Login from './Login.svelte'
  import Mail from './Mail.svelte'

  export let name: string;
  export let jmap;

  function logout(){
    sessionStorage.removeItem('jmapweb-password')
    window.location.reload()
  }

</script>

{#await jmap.session}
  <p>Please wait until we connect to the server...</p>

{:then session}

<Route path="/*" firstmatch>
  <Route path="/mail/*" let:meta>
    <Mail jmap={jmap} session={session} />
  </Route>

  <Route path="/login">
    <Login />
  </Route>

  <Route path="/" redirect="/mail/">
  <nav>
      <a href="/login">Login</a>
      <a href="/logout" on:click|preventDefault={logout}>Logout</a>
  </nav>

  <a href="/mail/">Go to mail</a>
  </Route>

</Route>

{:catch error}
  <Login />
{/await}