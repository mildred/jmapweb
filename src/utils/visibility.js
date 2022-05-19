export function futureVisibility(element){
  return Promise.resolve(element).then(elem => {
    new Promise((resolve, reject) => {
      let observer = new IntersectionObserver((e) => {
        observer.disconnect()
        resolve(e)
      }, {})
      observer.observe(elem)
    })
  })
}
