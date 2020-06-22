process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')

test('bad iso code throws during scrape', async t => {
  await utils.setup()
  try {
    await utils.scrape('bad-iso')
    t.fail('should have failed')
  } catch (err) {
    t.match(err.message, /Timezone error/, 'fails with timezone error')
  }
  await utils.teardown()
  t.end()
})
