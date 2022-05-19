<script lang="ts">
  // vim: ft=html

  export let jMail;
  export let name = '';
  export let email = '';

  function getInitials(name, num) {
    let res = []
    let words = name.split(/\s+/)
    num ||= words.length
    while(words.join('').length && res.join('').length < num) {
      for (let i = 0; i < words.length; i++) {
        res[i] ||= ''
        res[i] += words[i][0] || ''
        words[i] = words[i].substr(1)
        if (res.join('').length >= num) {
          return res.join('')
        }
      }
    }
    return res.join('')
  }

  function xmur3(str) {
      for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
          h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
          h = h << 13 | h >>> 19;
      } return function() {
          h = Math.imul(h ^ (h >>> 16), 2246822507);
          h = Math.imul(h ^ (h >>> 13), 3266489909);
          return (h ^= h >>> 16) >>> 0;
      }
  }

  $: initials = getInitials(name || (email || '').replace(/@.*/, '').replace(/[^A-Za-z0-9]/g, ''), 2)
  $: random = xmur3(email || '')
  $: hue = random() % 360
  $: hue2 = random() % 360

</script>

<style>
.text-avatar {
  border-color: currentcolor;
  color: hsl(var(--hue), 100%, 30%);
  background-color: hsl(calc(var(--hue2) + 180), 100%, 70%);
  border-color: hsl(calc(var(--hue2) + 180), 100%, 30%);
  text-align: center;
  font-size: 2em;
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  border-style: solid;
  border-width: 0.1em;
}
</style>

<div class="text-avatar" title={`${name} <${email}>`} style="--hue: {hue}; --hue2: {hue2}">{initials}</div>

