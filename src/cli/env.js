const net = require('net')

module.exports = function env () {

  process.env.NODE_ENV = process.env.NODE_ENV || 'testing'
  process.env.AWS_PROFILE = 'covidatlas'
  process.env.AWS_REGION = 'us-west-1'
  process.env.ARC_CLOUDFORMATION = 'LiStaging'

  net.createServer()
    .once('error', () => { /* noop */ })
    .once('listening', function () {
      console.log('Please start the sandbox in another terminal: npm start')
      process.exit(1)
    })
    .listen(3333)
}
