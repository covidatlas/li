/** Simple help for the scripts, showing some more text and examples.
 *
 * Edit 'descriptions' as new things are added to package.json scripts.
 */

const path = require('path')

const scripts = require(path.join(__dirname, '..', 'package.json')).scripts

/** Supplemental info. */
const descriptions = {
  start: {
    desc: 'Start the sandbox.',
    docref: null
  },
  lint: {
    desc: 'Lint and fix js files.',
    docref: null
  },
  'list-sources': {
    desc: 'List the SourceIDs for all sources.',
    docref: 'docs/getting_started.md/Source IDs'
  },
  todos: {
    desc: 'List all TODOs, FIXMEs, etc, grouped.',
    docref: 'TODO'
  },
  test: {
    desc: 'Run all unit and integration tests.',
    docref: 'docs/testing.md'
  },
  'test:unit': {
    desc: 'Run unit tests.',
    docref: 'docs/testing.md'
  },
  'test:integration': {
    desc: 'Run integration tests.  Set TEST_ALL or TEST_ONLY env vars to change behaviour',
    examples: [
      'To run tests for all sources:',
      'TEST_ALL=1 npm run test:integration',
      'To run tests for selected sources:',
      'TEST_ONLY=gb-sct,gb-eng npm run test:integration'
    ],
    docref: 'docs/testing'
  },
  migrate: {
    desc: 'Publish cache items that have been migrated with coronadatascraper/tools/generate-v1-cache.js to AWS.',
    docref: null
  },
  'migration:status': {
    desc: 'Print summary report of coronadatascraper scraper -> li source migration.',
    docref: null
  }
}

console.log('npm run ...')
console.log('-----------')

const keys = Object.keys(scripts).sort()
for (let i = 0; i < keys.length; ++i) {
  const k = keys[i]
  const d = descriptions[k]
  if (!d)
    continue

  const width = 25

  console.log()
  const title = [ k, ' '.repeat(width - k.length), d.desc ].join('')
  console.log(title)

  const indent = ' '.repeat(width)
  if (d.examples) {
    console.log(indent + 'EXAMPLES:')
    d.examples.forEach(e => console.log(indent + e))
  }
  if (d.docref)
    console.log(indent + `SEE: ${d.docref}`)
}

