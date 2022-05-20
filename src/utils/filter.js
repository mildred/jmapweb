import * as future from './future.js';

export async function filterEmails(jMail, emails) {
  let res = []
  let config = await future.storeValue(jMail.config)
  for(let email of emails) {
    res.push(email)
  }
  return res
}

export async function genFilter(jMail, filter) {
  if (!filter) {
    return null
  }

  let config = await future.storeValue(jMail.config)
  let res = null

  if (filter.category === false || filter.category == config.nullCategory) {
    let emailsToFilter = []
    let mboxToFilter = []
    for(let e in config.byEmail || {}) {
      let c = config.email(e)
      if (config.notNullCategories.includes(c.category)) {
        emailsToFilter.push(e)
      }
    }
    for(let id in config.byMailbox || {}) {
      let c = config.mailbox(id)
      if (config.notNullCategories.includes(c.category)) {
        mboxToFilter.push(id)
      }
    }

    res = {
      operator: 'NOT',
      conditions: [
        emailsToFilter.map(e => ({from: e})),
        mboxToFilter.map(m => ({inMailbox: m}))
      ].flat()
    }
  } else if (filter.category) {
    let emailsToFilter = []
    let mboxToFilter = []
    for(let e in config.byEmail) {
      let c = config.email(e)
      if (c.category == filter.category) {
        emailsToFilter.push(e)
      }
    }
    for(let id in config.byMailbox) {
      let c = config.mailbox(id)
      if (c.category == filter.category) {
        mboxToFilter.push(id)
      }
    }

    res = {
      operator: 'OR',
      conditions: [
        emailsToFilter.map(e => ({from: e})),
        mboxToFilter.map(m => ({inMailbox: m}))
      ].flat()
    }
  } else {
    raise `Unable to parse filter ${filter}`
  }
  if (res.operator && res.conditions.length == 0) res = null
  return res
}
