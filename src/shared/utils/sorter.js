/**
 * Just a dumb sorter for 8601Z stuff: oldest to newest
 */
function sorter (arr) {
  return arr.sort((a, b) => {
    if (a > b) return 1
    if (a < b) return -1
    return 0
  })
}

sorter.objects = function (arr) {
  return arr.sort((a, b) => {
    if (a.date > b.date) return 1
    if (a.date < b.date) return -1
    return 0
  })
}

module.exports = sorter
