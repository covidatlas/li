/**
 * Tests to "validate" dynamo behaviour ...
 *
 * These tests are rather worthless, b/c they're really only
 * validating the dynamo mock arc uses during NODE_ENV = testing;
 * however, they give me some confidence at the moment so leaving them
 * in.
 */

process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const arc = require('@architect/functions')
const updateStatus = require(`${utils.srcPath}/events/reports/_update-report-generation-status.js`)


/** The tests write to report-gen-status, so check content. */
async function assertTableContains (t, expected, msg = '') {
  const tbls = await arc.tables()
  const actual = await tbls['report-generation-status'].
        scan({}).
        then(r => r.Items)
  t.deepEqual(actual, expected, msg)
}


test('update status creates record if missing', async t => {
  await utils.setup()
  await assertTableContains(t, [], 'at start')

  // Normally the code fills in updated w/ current datetime, but fill
  // it in for test determinism.
  const params = { updated: 'now' }
  await updateStatus('a.txt', 'v1', 'starting', params)

  const expected = [
    {
      report: 'a.txt',
      version: 'v1',
      status: 'starting',
      updated: 'now'
    }
  ]
  await assertTableContains(t, expected, 'after update')

  await utils.teardown()
  t.end()
})


test('can have multiple versions of same report', async t => {
  await utils.setup()

  const params = { updated: 'now' }
  await updateStatus('a.txt', 'v1', 'starting', params)
  await updateStatus('a.txt', 'v2', 'success', params)

  const expected = [
    {
      report: 'a.txt',
      version: 'v1',
      status: 'starting',
      updated: 'now'
    },
    {
      report: 'a.txt',
      version: 'v2',
      status: 'success',
      updated: 'now'
    }
  ]
  await assertTableContains(t, expected, 'after update')

  await utils.teardown()
  t.end()
})


test('status updates record if present', async t => {
  await utils.setup()
  await assertTableContains(t, [], 'at start')

  const params = { updated: 'now' }
  await updateStatus('a.txt', 'v1', 'starting', params)
  await updateStatus('b.txt', 'v1', 'starting', params)
  await updateStatus('a.txt', 'v2', 'success', params)

  params.updated = 'then'
  await updateStatus('a.txt', 'v1', 'v1-should-update', params)

  const expected = [
    {
      report: 'b.txt',
      version: 'v1',
      status: 'starting',
      updated: 'now'
    },
    {
      report: 'a.txt',
      version: 'v1',
      status: 'v1-should-update',
      updated: 'then'
    },
    {
      report: 'a.txt',
      version: 'v2',
      status: 'success',
      updated: 'now'
    }
  ]
  await assertTableContains(t, expected, 'after update')

  await utils.teardown()
  t.end()
})
