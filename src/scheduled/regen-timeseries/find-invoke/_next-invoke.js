/** Find the next thing to invoke. */

module.exports = function nextInvoke (invokes) {

  const next = invokes.find(i => {
    // Never regenerate more than every 12 hours
    const meow = new Date()
    let aBitAgo = meow.setHours(meow.getHours() - 12)
    aBitAgo = new Date(aBitAgo).toISOString()
    return !i.lastInvoke || aBitAgo > i.lastInvoke
  })

  return next.key
}
