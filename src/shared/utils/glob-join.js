const path = require('path')

// Join path and normalize to forward slash
module.exports = function (...args) {
  return path.join(...args).replace(/\\/g, '/')
}
