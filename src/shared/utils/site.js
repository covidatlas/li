/** Site helpers. */

const STAGING = 'staging'
const TESTING = 'testing'
const PRODUCTION = 'production'

/** Returns 'testing', 'staging', or 'production' */
function getEnvironment () {
  if (process.env.ARC_LOCAL)
    return TESTING

  switch (process.env.NODE_ENV) {
  case 'testing': return TESTING
  case 'staging': return STAGING
  case 'production': return PRODUCTION
  }
  throw new Error(`Unknown NODE_ENV ${process.env.NODE_ENV}`)
}

/** The site root. */
function root (environment) {

  const e = environment || getEnvironment()
  switch (e) {
  case TESTING: return `http://localhost:${process.env.PORT || 3333}`
  case STAGING: return 'https://api.staging.covidatlas.com'
  case PRODUCTION: return 'https://api.covidatlas.com'
  }
  throw new Error(`Unknown environment ${e}`)

}


module.exports = {
  root
}
