const path = require('path')
const fs = require('fs')
const exec = require('child_process').execSync
const srcShared = path.join(process.cwd(), 'src', 'shared')
const sourceMap = require(path.join(srcShared, 'sources', '_lib', 'source-map.js'))

/** Getting changed sources.
 * For CI, the env variable CI should be set.
 */

/** Get the proper baseline git remote and branch to diff against.
*
* Integration tests sometimes only run against changed sources, so we
* need to know which branch to compare the current branch to.  In
* GitHub CI, this is origin/master, but your working env might use a
* different remote name, and different base branch name.
*/
function readConfigFile() {
  const configFile = path.join(__dirname, '..', 'gitdiff.config')
  const shortConfig = configFile.replace(process.cwd(), '')
  if (!fs.existsSync(configFile)) {
    console.log(`
*************************************************************
Missing config file
 
${shortConfig}
 
for integration tests, aborting!
 
This file is necessary to indicate the git remote and branch
that the code should use to do a 'git diff' against.
 
Please copy the file gitdiff.config.example to gitdiff.config
and change it to match your personal repo settings.
*************************************************************`)
    process.exit()
  }

  return JSON.parse(fs.readFileSync(configFile))
}

function getBaseBranch() {
  let remote = 'origin'
  let branch = 'master'
  if (!process.env.CI) {
    const config = readConfigFile()
    remote = config.baseRemoteName
    branch = config.baseBranchName
    if (remote == null || branch == null)
      throw new Error(`missing key baseRemoteName or baseBranchName in gitdiff.config`)
  }
  return `${remote}/${branch}`
}

/** Returns array of keys, e.g. ['nyt'] */
function getChangedSourceKeys() {
  const b = getBaseBranch()

  // Git diff commands are very strange sometimes: the '...' is
  // necessary.  See https://stackoverflow.com/questions/20808892/
  // ("Git diff between current branch and master but not including
  // unmerged master commits")
  const command = `git diff --name-only ${b}...`

  const result = exec(command)
  const filesChanged = result.toString().split('\n')

  const changedKeys = []
  for (const [key, fname] of Object.entries(sourceMap())) {
    const s = fname.replace(`${process.cwd()}${path.sep}`, '')
    if (filesChanged.includes(s))
      changedKeys.push(key)
  }
  return changedKeys
}

module.exports = {
  getChangedSourceKeys
}
