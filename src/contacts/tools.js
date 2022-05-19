class Contact {
  constructor(contact){
    this.contact = contact || {}
  }

  get contactName(){
    const contact = this.contact
    return [contact.prefix, contact.firstName, contact.lastName, contact.suffix].filter(x => x).join(' ')
  }

  get raw() {
    return this.contact
  }

  get email() {
    if(!this.contact.emails) return null;
    return this.contact.emails[0]?.value
  }

  get emails() {
    if(!this.contact.emails) return [];
    return Array.from(this.contact.emails, e => e.value)
  }
}

export default { Contact }

