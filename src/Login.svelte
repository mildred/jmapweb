<script lang="ts">
  // vim: ft=html
  import { router } from 'tinro';

  let username = sessionStorage.getItem('jmapweb-username') || ''
  let password = sessionStorage.getItem('jmapweb-password') || ''

  function login(){
    sessionStorage.setItem('jmapweb-username', username)
    sessionStorage.setItem('jmapweb-password', password)
    router.goto('/')
    window.location.reload()
  }

</script>

<form on:submit|preventDefault={login}>
  <input type="text" placeholder="email" bind:value={username} />
  <input type="password" placeholder="password" bind:value={password} />
  <input type="submit" value="Log-In" />
</form>