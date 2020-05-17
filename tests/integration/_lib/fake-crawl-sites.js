const { join } = require('path')
const fs = require('fs')

/** Folder under sandbox public that the sources scrape.
 *
 * These can be crawled with URLs like
 * http://localhost:5555/tests/fake-source-urls/fake/fake.json. */
const baseFolder = join(process.cwd(), 'public', 'tests', 'fake-source-urls')

/** Write a test file to be scraped. */
function writeFile (subdir, filename, content) {
  const folder = join(baseFolder, subdir)
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(join(folder, filename), content)
}

/** Delete all files from baseFolder. */
function deleteAllFiles () {
  if (fs.existsSync(baseFolder))
    fs.rmdirSync(baseFolder, { recursive: true })
}

module.exports = {
  writeFile,
  deleteAllFiles
}
