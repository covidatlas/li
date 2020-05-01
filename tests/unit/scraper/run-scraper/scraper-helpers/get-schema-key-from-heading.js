const { join } = require('path')
const test = require('tape')

const sut = join(
  process.cwd(), 'src', 'events', 'scraper', 'run-scraper', 'scraper-helpers', 'get-schema-key-from-heading.js'
)
const getSchemaKeyFromHeading = require(sut)

test('finds an easy match', t => {
  t.plan(1)
  const schemaKeysByHeadingFragment = {
    'how': 'cases'
  }
  t.strictEqual(getSchemaKeyFromHeading({ heading: 'Howdy', schemaKeysByHeadingFragment }), 'cases')
})

test('discards where appropriate', t => {
  t.plan(1)
  const schemaKeysByHeadingFragment = { how: null }
  t.strictEqual(getSchemaKeyFromHeading({ heading: 'Howdy', schemaKeysByHeadingFragment }), null)
})
