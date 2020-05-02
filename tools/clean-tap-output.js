/** Clean up tap output and make it quicker to find problems.
 *
 * Reads from stdin.
 */

var readline = require('readline')

/** Add failure details to the first line of the failure summary. */
function printFailureSummary (failureLines) {

  const partREs = {
    operator: /^ {4}operator: (.*)/,
    expected: /^ {4}expected: (.*)/,
    actual: /^ {4}actual: (.*)/,
    at: /^ {4}at: .*?\/(tests\/.*)\)/
  }

  const hsh = {}
  for (const [ key, re ] of Object.entries(partREs)) {
    const m = getMatch(failureLines, re)
    if (m) {
      hsh[key] = m.trim()
    }
  }
  // Truncate long things.
  const maxLen = 20
  if (hsh.expected && hsh.expected.length > maxLen)
    hsh.abbreviated = true
  if (hsh.actual && hsh.actual.length > maxLen)
    hsh.abbreviated = true
  // console.log(hsh)

  let append = []
  if (hsh.abbreviated && hsh.operator) {
    append.push(`expected not ${hsh.operator} actual (see log)`)
  }
  if (hsh.expected && hsh.actual && hsh.operator) {
    append.push(`${hsh.expected} not ${hsh.operator} ${hsh.actual}`)
  } else if (hsh.operator) {
    append.push(hsh.operator)
  }
  append.push(`at: ${hsh.at}`)

  // Write the failing test and some more detail.
  let msg = `${failureLines[0]} (${append.join(' ')})`
  console.log(msg)

  // Write useful stack trace lines.
  const condensed = failureLines.slice(1).filter(s => { return !excludeLine(s) })
  condensed.forEach(c => console.log(c))
}

/** Exclude some lines from test summary. */
function excludeLine (line) {
  const excludes = [
    /^ {10}at Test\..*?node_modules.*/,
    /^ {10}at Immediate.next /,
    /^ {10}at processImmediate/
  ]

  for (var i = 0; i < excludes.length; i++) {
    if (line.match(excludes[i])) {
      return true
    }
  }
  return false
}

/** Given array of lines and a regex, returns match group 1 of the
 * first line matching it, or null. */
function getMatch (lines, re) {
  for (var i = 0; i < lines.length; i++) {
    const m = lines[i].match(re)
    if (m)
      return m[1]
  }
  return null
}

/**
 * Main.
 */

/** Reader of stdin */
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

/** Current state of input (cheap finite state machine). */
let currState = 'ok'

/** Buffer of lines collected when in 'not-ok' state. */
let testFailure = []

rl.on('line', function (line) {
  // State transition.
  if (/^not ok/.test(line))
    currState = 'not-ok'
  if (line === '  ...' && currState === 'not-ok')
    currState = 'ok'

  if (currState === 'not-ok') {
    testFailure.push(line)
  }
  if (currState === 'ok') {
    if (testFailure.length > 0) {
      printFailureSummary(testFailure)
      testFailure = []
    }
    console.log(line)
  }
})
