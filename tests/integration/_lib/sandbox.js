process.env.NODE_ENV = 'testing'
const test = require('tape')
const architectSandbox = require('@architect/sandbox')

/** By default sandbox is started with port 3333, so specifying the
 * port here lets the tests run their own sandbox without colliding
 * with the existing port. */
const sandboxPort = 5555

/** Only start sandbox once during a round of testing. */
let sandboxStarted = false

/** Start the sandbox if needed. */
async function start () {
  if (sandboxStarted) {
    console.log('Already started, exiting.')
    return
  }
  console.log(`Starting on port ${sandboxPort}`)
  await architectSandbox.start({ port: sandboxPort, quiet: true })
  sandboxStarted = true
}

/** Called when all tests are complete. */
async function _stop () {
  /* architect sandbox uses an internal server to handle events,
   * listening to the sandbox port + 1 (see
   * https://github.com/architect/sandbox/blob/master/src/sandbox/index.js,
   * search for 'process.env.ARC_EVENTS_PORT').  If the sandbox is
   * closed and events are still pending, ECONNREFUSED or ECONNRESET
   * is thrown.  If unhandled, this crashes the Node process,
   * including tape, so we'll ignore just these errors for the sake of
   * testing. */
  process.on('uncaughtException', err => {
    const ignoreExceptions = [
      `connect ECONNRESET 127.0.0.1:${sandboxPort + 1}`,
      `connect ECONNREFUSED 127.0.0.1:${sandboxPort + 1}`
    ]
    if (ignoreExceptions.includes(err.message)) {
      const msg = `(Ignoring sandbox "${err.message}" thrown during teardown)`
      console.error(msg)
    }
    else {
      throw err
    }
  })

  await architectSandbox.end()
  sandboxStarted = false
}

/** At the end of all tests. */
test.onFinish(() => {
  console.log('All tests done.  Shutting down sandbox ...')
  _stop()
  console.log('Sandbox shut down.')

})

module.exports = {
  start
}
