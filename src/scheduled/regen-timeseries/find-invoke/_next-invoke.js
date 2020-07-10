/** Find the next thing to invoke. */

module.exports = function nextInvoke (invokes) {

  const dateKey = a => `${a.lastInvoke || '1970-01-01T00:00:00.000Z'}/${a.key}`
  const byDateThenKey = (a, b) => dateKey(a) < dateKey(b) ? - 1 : 1

  /* sort invokes by date, mapping null dates to very old date so they
   * go to the top. */
  const invokesByStaleness = invokes.sort(byDateThenKey)

  /*
  const next = invokes.find(i => {
    // Never regenerate more than every 12 hours
    const meow = new Date()
    let aBitAgo = meow.setHours(meow.getHours() - 12)
    aBitAgo = new Date(aBitAgo).toISOString()
    return !i.lastInvoke || aBitAgo > i.lastInvoke
  })
  */
  const next = invokesByStaleness[0]

  return next.key
}
