export function storeValue(store) {
  return new Promise((accept, reject) => {
    store.subscribe(value => accept(value))()
  })
}
