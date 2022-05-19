<script lang="ts">
  // vim: ft=html

  import { readable } from 'svelte/store';
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import EmailIcon from './EmailIcon.svelte';
  import { marked } from 'marked';
  import { futureVisibility } from '../utils/visibility.js';

  window.DOMPurify = DOMPurify

  export let jMail;
  export let email;

  const ALLOWED_TYPES = ['text/html', 'text/plain']
  let bodyPart = email.htmlBody.concat(email.textBody).filter(part => ALLOWED_TYPES.includes(part.type))[0]
  let bodyType = bodyPart && bodyPart.charset ? `${bodyPart.type}; charset=${bodyPart.charset}` : (bodyPart || {}).type

  let articleElement
  let articleVisible = new Promise((resolve, reject) => {
    let observer = new IntersectionObserver((e) => {
      observer.disconnect()
      resolve(e)
    }, {})
    onMount(() => {
      observer.observe(articleElement)
    })
  })

  let body;
  if (bodyPart) {
    let futureArticleBody =new Promise((accept, reject) => { onMount(() => {
    articleElement }) })
    body = futureVisibility(futureArticleBody)
      .then(e => jMail.blob_data(jMail.accountId, bodyPart.blobId, bodyPart.name, bodyType, purify))
  } else {
    body = Promise.reject(null)
  }

  // TODO: use cssfilter to filter CSS
  // <https://github.com/leizongmin/js-css-filter> ?
  function purify(text, type) {

    // TODO: convert text to html, use markdown

    if (type.startsWith('text/plain')) {
      text = marked(text)
    }

    let dom = DOMPurify.sanitize(text, {

      // Alter default DOMPurify configuration
      FORBID_TAGS: [
        // This one is really needed
        'svg',
        // Just to be sure
        'link', 'style', 'script'
      ],

      // Alter default DOMPurify configuration
      FORBID_ATTR: [
        // Prevent CSS that can link to external resources
        'style'
      ],

      // Only allow data URI
      ALLOWED_URI_REGEXP: /^data:/,

      // Return a whole document starting from <html>
      WHOLE_DOCUMENT: true,

      // Return DOM for more post-processing
      RETURN_DOM: true,
    })

    let doc = dom.ownerDocument
    let it = doc.createNodeIterator(dom, NodeFilter.SHOW_TEXT)
    let node;
    let checkboxes = []

    let signatures = []

    // Find all signatures and mark them (some might be in blockquotes)
    // iterate first and perform the updates after to avoid infinite iteration
    while (node = it.nextNode()) {
      if(node.textContent.startsWith('-- ')) {
        signatures.push(node)
      }
    }
    for(let node of signatures) {
      // Get up the hierarchy until the signature is not in a block by itself
      // Stop if we reach a blockquote
      while(node.previousSibling == null && node.tagName != 'BLOCKQUOTE') {
        node = node.parentNode
      }
      // If it's not an element, we could not reach up the tree. Move nodes
      // inside a div.
      if(node.nodeType != doc.ELEMENT_NODE) {
        let div = doc.createElement('div')
        node.parentNode.insertBefore(div, node)
        while(div.nextSibling) {
          div.insertBefore(div.nextSibling, null)
        }
        node = div
      }
      // If it's an element, we wrap it in a label and add a specific CSS
      // class to mark it
      let checkbox = doc.createElement('input')
      checkboxes.push(checkbox)
      let checkbox_id = `jmapweb-checkbox${checkboxes.length}`
      checkbox.setAttribute('type', 'checkbox')
      checkbox.setAttribute('id', checkbox_id)
      checkbox.classList.add('jmapweb--signature-checkbox')
      let label = doc.createElement('label')
      label.setAttribute('for', checkbox_id)
      label.classList.add('jmapweb--signature')

      node.parentNode.insertBefore(checkbox, node)
      node.parentNode.insertBefore(label, node)
      label.insertBefore(node, null)
    }

    // Wrap every blockquote in checkbox + label
    let blockquotes = Array.from(dom.querySelectorAll('blockquote'))
    for(let quote of blockquotes) {
      let checkbox = doc.createElement('input')
      checkboxes.push(checkbox)
      let checkbox_id = `jmapweb-checkbox${checkboxes.length}`
      checkbox.setAttribute('type', 'checkbox')
      checkbox.setAttribute('id', checkbox_id)
      checkbox.classList.add('jmapweb--blockquote-checkbox')
      let label = doc.createElement('label')
      label.setAttribute('for', checkbox_id)
      label.classList.add('jmapweb--blockquote')

      quote.parentNode.insertBefore(checkbox, quote)
      quote.parentNode.insertBefore(label, quote)
      label.insertBefore(quote, null)
    }

    // Add CSS
    let css = doc.createElement('style')
    css.textContent = `
      .jmapweb--signature-checkbox:not(:checked), .jmapweb--blockquote-checkbox {
        width: 0;
        height: 0;
        visibility: none;
        opacity: 0;
        position: absolute;
      }

      .jmapweb--signature-checkbox:not(:checked) + label::before {
        content: "--\\00A0";
        color: #888;
        /*
        border: #888 solid 0.1em;
        padding-left: 0.5em;
        padding-right: 0.5em;
        border-radius: 0.25em;
        background-color: #eee;
        */
        cursor: pointer;
      }
      .jmapweb--signature-checkbox:not(:checked) + label:hover::before {
        color: #666;
        /*
        background-color: #ddd;
        border-color: #666;
        */
      }
      .jmapweb--signature-checkbox:checked {
        display: none;
      }
      .jmapweb--signature-checkbox:checked + label {
        cursor: pointer;
        color: #888;
      }
      .jmapweb--signature-checkbox:checked + label:hover {
        color: #666;
      }
      .jmapweb--signature-checkbox:not(:checked) + label > * {
        display: none;
      }


      .jmapweb--blockquote {
        cursor: pointer;
        display: block;
        position: relative;
        border-left: #ddd solid 0.25em;
      }
      .jmapweb--blockquote-checkbox:not(:checked) + .jmapweb--blockquote {
        overflow: clip;
        max-height: 5em;
      }
      .jmapweb--blockquote-checkbox:not(:checked) + .jmapweb--blockquote::after {
        content: "";
        width: 100%;
        height: 5em;
        position: absolute;
        bottom: 0;
        left: 0;
        background: linear-gradient(transparent, white);
      }
    `
    dom.querySelector('head').insertBefore(css, null)

    return dom.outerHTML
  }

  let iframe;

  // Attribution https://stackoverflow.com/a/64110252
  function fit() {
    if(!iframe) return;
    var iframes = [iframe] //document.querySelectorAll("iframe.gh-fit")

    for(var id = 0; id < iframes.length; id++) {
        var win = iframes[id].contentWindow
        var doc = win.document
        var html = doc.documentElement
        var body = doc.body
        var ifrm = iframes[id] // or win.frameElement

        if(body) {
            //body.style.overflowX = "scroll" // scrollbar-jitter fix
            body.style.overflowY = "hidden"
        }
        if(html) {
            //html.style.overflowX = "scroll" // scrollbar-jitter fix
            html.style.overflowY = "hidden"
            var style = win.getComputedStyle(html)
            //ifrm.width = parseInt(style.getPropertyValue("width")) // round value
            ifrm.height = parseInt(style.getPropertyValue("height"))
        }
    }

    requestAnimationFrame(fit)
  }

  onMount(() => {
    let cb = requestAnimationFrame.bind(this, fit)
    //let i = setInterval(cb, 1000)
    body.then(() => {
      cb();
      //addEventListener('load', cb)
    })
    return () => removeEventListener('load', cb)
    //return () => clearInterval(i)
  })

  function updateKeywords(updates){
    jMail.req([
      ['Email/set', {
        accountId: jMail.accountId,
        update: {
          [email.id]: updates
        }
      }, '0'],
      ['Email/get', {
        accountId: jMail.accountId,
        ids: [email.id]
      }, '1']
    ]).then(res => {
      console.log("update keywords result: %o", res)
      if(!res[0][1].updated) {
        alert("Error updating e-mail")
      }
      email = res[1][1].list[0]
    })
  }

  function markAsRead(){
    updateKeywords({
      'keywords/$seen': true
    })
  }

  function markToReply(){
    updateKeywords({
      'keywords/$seen': true,
      'keywords/$flagged': null,
      'keywords/$toreply': true
    })
  }

  function unmarkToReply(){
    updateKeywords({
      'keywords/$toreply': null
    })
  }

  function unmarkForReference(){
    updateKeywords({
      'keywords/$flagged': null
    })
  }

  function markForReference(){
    updateKeywords({
      'keywords/$seen': true,
      'keywords/$toreply': null,
      'keywords/$flagged': true
    })
  }

  function setThread(){
    let msgid = prompt("X-ME-Message-Id")
    updateKeywords({
      'header:X-ME-Message-Id': msgid,
    })
  }

  function rename(){
    let subject = prompt("Subject", email.subject)
    updateKeywords({
      'subject': subject,
    })
  }

</script>

<article bind:this={articleElement}>
  <div class="row">
    <EmailIcon jMail={jMail} name={email.from[0].name} email={email.from[0].email} />
    <h1>
      {#if !email.keywords["$seen"]}
        [unread]
      {/if}
      {email.subject}
    </h1>
  </div>
  <p>From: <em>{email.from[0].name} ({email.sentAt})</em></p>
  <p>Keywords: <em>{Object.keys(email.keywords).join(", ")}</em></p>
  {#if !email.keywords["$seen"]}
    <button on:click|preventDefault={markAsRead}>Mark as read</button>
  {/if}
  {#if email.keywords["$toreply"]}
    <button on:click|preventDefault={unmarkToReply}>Do not reply</button>
  {:else}
    <button on:click|preventDefault={markToReply}>Reply later</button>
  {/if}
  {#if email.keywords["$flagged"]}
    <button on:click|preventDefault={unmarkForReference}>Unreference</button>
  {:else}
    <button on:click|preventDefault={markForReference}>Reference</button>
  {/if}
  <button on:click|preventDefault={setThread}>Set Thread</button>
  <button on:click|preventDefault={rename}>Rename</button>
  {#await body}
    <p>{email.preview}</p>
  {:then blob}
  <!-- allow same origin in order to access frame content. Javascript shouldn't
  load anyway, and external resources are blocked by default. Moreover, we are
  not specifically a trusted origin, but that depends on the deployment.
  Anyway, the origin is not a good way to separate contexts. -->
  <!-- it's preferable to allow same-origin but not allow scripts -->
  <iframe sandbox="allow-same-origin" srcdoc={blob} bind:this={iframe}>
  <!--iframe sandbox src={URL.createObjectURL(blob)} bind:this={iframe}-->
    </iframe>
  {/await}
</article>

<style>
  iframe {
    width: 100%;
    border: none;
  }

  .row {
    display: flex;
    flex-flow: row wrap;
    align-items: baseline;
  }
</style>
