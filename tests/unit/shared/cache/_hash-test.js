const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'shared', 'cache', '_hash.js')
const hash = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(hash, 'hash module exists')
})

// Return values hardcoded to ensure hashing algorim stays the same
test('Returns specified hashes', t => {
  t.plan(4)
  // String
  const aString = 'this is a string'
  let result = hash(aString)
  t.equal(result, 'bc7e8a24e2911a5827c9b33d618531ef094937f2b3803a591c625d0ede1fffc6', 'Returned full hash of a string')

  // String substr
  result = hash(aString, 10)
  t.equal(result, 'bc7e8a24e2', 'Returned substring hash of a string')

  // Buffer
  const aBuffer = Buffer.from(aString + 'extra')
  result = hash(aBuffer)
  t.equal(result, '4ae0e0363fae332537f67e99533e5f09a873cd0b8254909d328f4481438429ea', 'Returned full hash of a buffer')

  // Buffer substr
  result = hash(aBuffer, 10)
  t.equal(result, '4ae0e0363f', 'Returned substring hash of a string')
})
