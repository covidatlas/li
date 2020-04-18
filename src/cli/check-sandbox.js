const net = require('net')

module.exports = function checkSandbox () {
  net.createServer()
    .once('error', () => { /* noop */ })
    .once('listening', function() {
      console.log('Please start the sandbox in another terminal: npm start')
      process.exit(1)
    })
    .listen(3333)
}
