const spacetime = require('spacetime')
const looksLike = require('./_looks-like.js')

function validate (date, num) {
  if (typeof num !== 'number') throw ReferenceError('datetime.math requires a second argument of an integer')

  if (looksLike.YYYYMMDD(date)) return
  throw ReferenceError('datetime.math only accepts dates in YYYY-MM-DD format')
}

function math (type, date, num) {
  validate(date, num)

  const t = spacetime(date)
  if (type === 'add') return t.add(num, 'day').format('iso-short')
  return t.subtract(num, 'day').format('iso-short')
}

module.exports = {
  add: math.bind({}, 'add'),
  subtract: math.bind({}, 'subtract')
}
