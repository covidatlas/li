const { join } = require('path')
const fs = require('fs')

/** Folder under sandbox public that the sources scrape.
 *
 * These can be crawled with URLs like
 * http://localhost:5555/tests/fake-source-urls/fake/fake.json. */
const baseFolder = join(process.cwd(), 'public', 'tests', 'fake-source-urls')

/** Fixture folder. */
const fixtureFolder = join(__dirname, '..', 'fixtures')

/** Write a test file to be scraped. */
function writeFile (subdir, filename, content) {
  const folder = join(baseFolder, subdir)
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(join(folder, filename), content)
}

/** Copy a fixture file to be scraped. */
function copyFixture (subdir, filename, fixtureFile) {
  const folder = join(baseFolder, subdir)
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder, { recursive: true })
  const src = join(fixtureFolder, fixtureFile)
  if (!fs.existsSync(src))
    throw new Error(`Missing ${fixtureFile} in fixtures`)
  fs.copyFileSync(src, join(folder, filename))
}

/** Delete all files from baseFolder. */
function deleteAllFiles () {
  if (fs.existsSync(baseFolder))
    fs.rmdirSync(baseFolder, { recursive: true })
}

module.exports = {
  baseFolder,
  writeFile,
  copyFixture,
  deleteAllFiles
}
