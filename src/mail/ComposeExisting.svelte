<script lang="javascript">
  // vim: ft=html

  import { onMount, onDestroy } from 'svelte';
  import { readable } from 'svelte/store';
  //import Tags from "svelte-tags-input";
  import Tags from "../override/Tags.svelte"
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import Highlight from '@tiptap/extension-highlight'
  import Typography from '@tiptap/extension-typography'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import FloatingMenu from '@tiptap/extension-floating-menu'
  import { Route } from 'tinro';
  import Nav from './Nav.svelte';

  export let jMail;
  export let mailboxId;
  export let email;

  let identities = jMail.identities;

  let editor;
  let editorElement;
  let bubbleMenuElement;
  let floatingMenuElement;

  let dirty = false;

  let identityId;
  let identity;
  let subject = email.subject;
  let to_addresses = (email.to || []).map(addr => composeEmailAddress(addr));
  let cc_addresses = (email.cc || []).map(addr => composeEmailAddress(addr));
  let bcc_addresses = (email.bcc || []).map(addr => composeEmailAddress(addr));
  let html = email.bodyValues[email.htmlBody[0].partId].value;

  for(let from_addr of (email.from || [])) {
    for(let iden of $identities) {
      if(iden.name == from_addr.name && iden.email == from_addr.email) {
        identityId = iden.id;
        identity = iden;
      }
    }
    if(identityId) break;
  }

  // TODO: remove BCC from identity
  // better: remove bcc and signature on identity change
  if(identity && html.endsWith(identity.htmlSignature)) {
    html = html.substring(0, html.length - identity.htmlSignature.length)
  }

  onMount(() => {
    editor = new Editor({
      element: editorElement,
      content: html,
      extensions: [
        StarterKit,
        Typography,
        BubbleMenu.configure({
          element: bubbleMenuElement,
        }),
        FloatingMenu.configure({
          element: floatingMenuElement,
        }),
      ],
      onTransaction: () => {
        // force re-render so `editor.isActive` works as expected
        editor = editor
      },
      onUpdate({ editor }) {
        markDirty();
      },
    })
  });

  onDestroy(() => {
    if(editor) editor.destroy();
  })

  function markDirty(){
    dirty = true;
  }

  function composeEmailAddress(addr) {
    if (addr.name) {
      return `"${addr.name}" <${addr.email}>`
    } else {
      return addr.email
    }
  }

  function parseEmailAddress(str){
    let m = str.match(/\s*"(.*\S)"\s*<(.*)>/);
    if(m) {
      return {name: m[1], email: m[2]}
    }
    m = str.match(/\s*(.*\S)\s*<(.*)>/)
    if(m) {
      return {name: m[1], email: m[2]}
    }
    return {name: null, email: str}
  }

  function save(){
    //email.subject = subject
    //email.bodyValues[email.textBody[0].partId].value = body
    let identity = $identities.find(iden => iden.id == identityId)
    if(!identity) {
      identity = $identities[0]
    }
    jMail.req([
      ['Email/set', {
        accountId: jMail.accountId,
        destroy: [ email.id ],
        create: {
          /*
          // Crash: <https://github.com/cyrusimap/cyrus-imapd/issues/3766>
          draft: {
            ...email,
            id: undefined,
            blobId: undefined,
            threadId: undefined,
            size: undefined,
            trustedSender: undefined,
            hasAttachment: undefined,
            preview: undefined,
          }
          /*/
          draft: {
            mailboxIds: {
              [mailboxId]: true
            },
            keywords: {
              "$seen": true,
              "$draft": true
            },
            messageId: email.messageId,
            subject: subject,
            from: [{name: identity.name, email: identity.email}],
            to: to_addresses.map(a => parseEmailAddress(a)),
            cc: cc_addresses.map(a => parseEmailAddress(a)),
            bcc: [bcc_addresses.map(a => parseEmailAddress(a)), identity.bcc].flat(),
            replyTo: identity.replyTo,
            bodyStructure: {
              type: "text/html",
              partId: "body"
            },
            bodyValues: {
              body: {
                value: editor.getHTML() + (identity.htmlSignature || ""),
                isTruncated: false
              }
            }
          }
          //*/
        }
      }, '1'],
      //['Email/get', {
      //  accountId: jMail.accountId,
      //  "#ids": { resultOf: "1", name: "Email/set", path: "/created/*/id" }
      //}, '2']
    ]).then(resp => {
      console.log("save draft: %o", resp)
      let created = resp.get('1').created.draft
      email.id = created.id
      email.blobId = created.blobId
      email.threadId = created.threadId
      dirty = false
    })
  }

  // From JMAP spec
  /*

  function isInlineMediaType ( type ) {
    return type.startsWith( 'image/' ) ||
           type.startsWith( 'audio/' ) ||
           type.startsWith( 'video/' );
  }

  function parseStructure ( parts, multipartType, inAlternative,
          htmlBody, textBody, attachments ) {

      // For multipartType == alternative
      let textLength = textBody ? textBody.length : -1;
      let htmlLength = htmlBody ? htmlBody.length : -1;

      for ( let i = 0; i < parts.length; i += 1 ) {
          let part = parts[i];
          let isMultipart = part.type.startsWith( 'multipart/' );
          // Is this a body part rather than an attachment
          let isInline = part.disposition != "attachment" &&
              // Must be one of the allowed body types
              ( part.type == "text/plain" ||
                part.type == "text/html" ||
                isInlineMediaType( part.type ) ) &&
              // If multipart/related, only the first part can be inline
              // If a text part with a filename, and not the first item
              // in the multipart, assume it is an attachment
              ( i === 0 ||
                ( multipartType != "related" &&
                  ( isInlineMediaType( part.type ) || !part.name ) ) );

          if ( isMultipart ) {
              let subMultiType = part.type.split( '/' )[1];
              parseStructure( part.subParts, subMultiType,
                  inAlternative || ( subMultiType == 'alternative' ),
                  htmlBody, textBody, attachments );
          } else if ( isInline ) {
              if ( multipartType == 'alternative' ) {
                  switch ( part.type ) {
                  case 'text/plain':
                      textBody.push( part );
                      break;
                  case 'text/html':
                      htmlBody.push( part );
                      break;
                  default:
                      attachments.push( part );
                      break;
                  }
                  continue;
              } else if ( inAlternative ) {
                  if ( part.type == 'text/plain' ) {
                      htmlBody = null;
                  }
                  if ( part.type == 'text/html' ) {
                      textBody = null;
                  }
              }
              if ( textBody ) {
                  textBody.push( part );
              }
              if ( htmlBody ) {
                  htmlBody.push( part );
              }
              if ( ( !textBody || !htmlBody ) &&
                      isInlineMediaType( part.type ) ) {
                  attachments.push( part );
              }
          } else {
              attachments.push( part );
          }
      }

      if ( multipartType == 'alternative' && textBody && htmlBody ) {
          // Found HTML part only
          if ( textLength == textBody.length &&
                  htmlLength != htmlBody.length ) {
              for ( let i = htmlLength; i < htmlBody.length; i += 1 ) {
                  textBody.push( htmlBody[i] );
              }
          }
          // Found plaintext part only
          if ( htmlLength == htmlBody.length &&
                  textLength != textBody.length ) {
              for ( let i = textLength; i < textBody.length; i += 1 ) {
                  htmlBody.push( textBody[i] );
              }
          }
      }
  }

  // Usage:
  let htmlBody = [];
  let textBody = [];
  let attachments = [];

  parseStructure( [ bodyStructure ], 'mixed', false,
      htmlBody, textBody, attachments );

  */

  async function findEmails(search){
    console.log(search)
    let res = await jMail.req([
      ['Contact/query', {
        accountId: jMail.accountId,
        filter: {
          text: search
        }
      }, '0'],
      ['Contact/get', {
        accountId: jMail.accountId,
        "#ids": { resultOf: "0", name: "Contact/query", path: "/ids" }
      }, '1'],
    ])
    console.log("autocomplete contacts for %s: %o", search, res)
    let list = res.get('1').list
      .map(c => c.emails.map(e => `${c.firstName} ${c.lastName} <${e.value}>`))
      .flat()
    //list.filter = function() { return this; };
    return list;
  }

</script>

<style>
  .html-editor > :global(*) {
    border: solid #e9e9e9 thin;
    border-radius: var(--border-radius);
    padding: 0.4rem 0.8rem;
    margin-bottom: 1rem;
    min-height: 5rem;
  }
  form :global(.svelte-tags-input-layout.svelte-tags-input-layout.focus),
  .html-editor > :global(*):focus {
    outline-color: #3584e4;
    outline-style: solid;
    outline-width: 2px;
  }
  form :global(.svelte-tags-input-layout.svelte-tags-input-layout),
  form :global(.svelte-tags-input-layout.svelte-tags-input-layout):hover {
    border: solid #e9e9e9 thin;
    border-radius: var(--border-radius);
    margin-bottom: 1rem;
  }
  form :global(.svelte-tags-input-tag.svelte-tags-input-tag) {
    border: solid #3584e4 thin;
    border-radius: var(--border-radius);
    background-color: unset;
    color: unset;
  }
  form :global(.svelte-tags-input-tag.svelte-tags-input-tag):hover {
    background-color: #c9def8;
  }
</style>

<Nav jMail={jMail} mailboxId={mailboxId}/>

<template>
  <div bind:this={bubbleMenuElement}>
    {#if editor}
    <button
      on:click={() => editor.chain().focus().toggleBold().run()}
      class:is-active={ editor.isActive('bold') }>bold</button>
    <button
      on:click={() => editor.chain().focus().toggleItalic().run()}
      class:is-active={ editor.isActive('italic') }>italic</button>
    <button
      on:click={() => editor.chain().focus().toggleStrike().run()}
      class:is-active={ editor.isActive('strike') }>strike</button>
    {/if}
  </div>
  <div bind:this={floatingMenuElement}>
    {#if editor}
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      class:is-active={ editor.isActive('heading', { level: 1 })}>H1</button>
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      class:is-active={ editor.isActive('heading', { level: 2 }) }>H2</button>
    <button
      on:click={() => editor.chain().focus().toggleBulletList().run()}
      class:is-active={ editor.isActive('bulletList') }>Bullet List</button>
    {/if}
  </div>
</template>

<main>
  <section>
    <form on:submit|preventDefault={save}>
      <header>
        <h2>Compose</h2>
      </header>
      <label for="compose-from">From</label>
      <select id="compose-from" bind:value={identityId} on:input={markDirty}>
        {#each $identities as identity}
          <option value={identity.id}>{identity.name} &lt;{identity.email}&gt;</option>
        {/each}
      </select>
      <label for="compose-to">To</label>
      <Tags id="compose-to" name="to" tags={to_addresses}
        autoComplete={findEmails}
        autoCompleteFilter={false}
        on:tags={e => { markDirty(); to_addresses = e.detail.tags }} />
      <label for="compose-subject">Subject</label>
      <input id="compose-subject" name="subject" size="60" on:input={markDirty} bind:value={subject}/>
      <label>Body</label>
      <div class="html-editor" bind:this={editorElement}></div>
      <button>Save</button>
      {#if dirty}
        <em>Unsaved changes</em>
      {/if}
    </form>
  </section>
</main>
