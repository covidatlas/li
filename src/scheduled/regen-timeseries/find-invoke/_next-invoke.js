/** Find the next timeseries to invoke.
 *
 * Invoke things that have never been invoked before others that have.
 * Invoke by most stale.
 * Don't invoke recently invoked (< 12 hrs ago).
 */
module.exports = function nextInvoke (invokes, nowISOString) {

  // sort invokes by date, mapping null dates to very old date so they
  // go to the top.
  const dateKey = a => `${a.lastInvoke || '1970-01-01T00:00:00.000Z'}/${a.key}`
  const byDateThenKey = (a, b) => dateKey(a) < dateKey(b) ? - 1 : 1

  // Do not invoke anything if it's less than 12 hours old.
  let now = new Date()
  if (nowISOString)
    now = new Date(nowISOString)
  let twelveHrsAgo = now.setHours(now.getHours() - 12)
  twelveHrsAgo = new Date(twelveHrsAgo).toISOString()

  const invokesByStaleness = invokes.
        filter(i => (!i.lastInvoke || i.lastInvoke < twelveHrsAgo)).
        sort(byDateThenKey)

  if (invokesByStaleness.length === 0)
    return null

  return invokesByStaleness[0].key
}
