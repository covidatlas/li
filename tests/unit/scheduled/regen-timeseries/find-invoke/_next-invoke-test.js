const nextInvoke = require('../../../../../src/scheduled/regen-timeseries/find-invoke/_next-invoke.js')
const test = require('tape')


function getInvokes (arr) {
  return arr.map(a => { return { key: a[0], lastInvoke: a[1] } })
}

test('if nothing has been invoked get the next by alphabet', t => {
  const invokes = getInvokes([
    [ 'a', null ],
    [ 'b', null ]
  ])

  t.equal(nextInvoke(invokes), 'a', 'return first')
  t.end()
})
