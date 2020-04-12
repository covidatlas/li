/**
 * Util functions
 */
function normalize (d) {
  return d.replace(/[\\/.]/g, '-') // replaces slashes & dots with dashes
}

// truncate ISO datetime to ISO date
function truncate (datetime) {
  return datetime
    .split(' ')[0]
    .split('T')[0]
}

module.exports = {
  normalize,
  truncate
}
