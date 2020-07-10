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


test('gets first non-invoked by alphabet', t => {
  const invokes = getInvokes([
    [ 'a', new Date().toISOString() ],
    [ 'b', null ]
  ])

  t.equal(nextInvoke(invokes), 'b', 'not invoked yet')
  t.end()
})


test('gets first non-invoked by alpha even if invoked is very old', t => {
  const invokes = getInvokes([
    [ 'a', '2020-01-01T00:00:00.000Z' ],
    [ 'b', null ]
  ])

  t.equal(nextInvoke(invokes), 'b', 'not invoked yet')
  t.end()
})

/*
test('gets source that was invoked earliest', t => {
  const invokes = getInvokes([
    [ 'a', '1971-01-01T00:00:00.000Z' ],
    [ 'b', '1970-01-01T00:00:00.000Z' ]
  ])

  t.equal(nextInvoke(invokes), 'b', 'b was invoked first, should go first')
  t.end()
})


test('gets source invoked earliest by alpha', t => {
  const invokes = getInvokes([
    [ 'a', '1971-01-01T00:00:00.000Z' ],
    [ 'd', '1970-01-01T00:00:00.000Z' ],
    [ 'x', '1970-01-01T00:00:00.000Z' ]
  ])

  t.equal(nextInvoke(invokes), 'd', 'd goes before x')
  t.end()
})


test('returns null if execution was < 12 hours ago', t => {
  const invokes = getInvokes([
    // 9 am
    [ 'a', '2020-06-06T09:00:00.000Z' ],
    // 8 am
    [ 'd', '2020-06-06T08:00:00.000Z' ],
  ])

  t.equal(nextInvoke(invokes), 'd', 'd is oldest')
  t.equal(nextInvoke(invokes, '2020-06-06T21:00:00.000Z'), 'd', 'd oldest')
  t.equal(nextInvoke(invokes, '2020-06-06T19:00:00.000Z'), null, '< 12 hrs')
  t.end()
})
*/
