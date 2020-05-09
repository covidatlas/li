process.env.NODE_ENV = 'testing'
const architectSandbox = require('@architect/sandbox')

/** By default sandbox is started with port 3333, so specifying the
 * port here lets the tests run their own sandbox without colliding
 * with the existing port. */
const sandboxPort = 5555

async function start () {
  console.log(`Starting on port ${sandboxPort}`)
  await architectSandbox.start({ port: sandboxPort, quiet: true })
}

async function stop () {
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
  console.log('sandbox ended')
}

module.exports = {
  start,
  stop
}
