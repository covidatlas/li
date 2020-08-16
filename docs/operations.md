Operations

# Environments


# Launching

## How-to

Launches are currently done by creating a tag on your local updated master branch and pushing it to GitHub.

```
$ git checkout master
$ git fetch upstream                       # or origin, or your name for the canonical repo
$ git reset --hard upstream/master         # my own preference
$ git tag                                  # list all tags
$ npm version v1.0.xx                      # create a new commit, and tags it
$ git push upstream master --follow-tags   # push the new commit and the tag
```

Problems with this approach: I (jz) dislike that this creates a new tag and modifies master on my own machine.  It would be best if this process occurred on a remote machine ... or perhaps this entire process needs to be rethought.  It's good enough for now though!

## Launch failures

Launches occasionally fail with "Deploy Failed", and in the GitHub Actions log you'll see "deploy failed! Too Many Requests ... TooManyRequestsException: Too Many Requests".  This occasionally happens ... nothing to worry about, you can just wait for the next deploy.

# Secrets

Secrets are configured in arc environments per https://arc.codes/reference/cli/env

eg, from root, this creates a new secret:

```
npx arc env production SLACK_STATUS_HOOK <hook-url>
```

# Monitoring

_We need better monitoring, but in the meantime ..._

Slack incoming hooks are configured at https://covid-atlas.slack.com/apps/A0F7XDUAZ-incoming-webhooks

## Status URLs
Some status URLs:

Staging

* https://api.staging.covidatlas.com/status?format=html
* https://api.staging.covidatlas.com/reports/status?format=html

Prod

* https://api.covidatlas.com/status?format=html
* https://api.covidatlas.com/reports/status?format=html


# AWS console sign-in

https://covidatlas.signin.aws.amazon.com/console

# Connecting to staging

If you needed to connect to staging, yet still run code locally, to test something out, you can do the following:

```
AWS_PROFILE=covidatlas NODE_ENV=staging ARC_LOCAL=1 npx sandbox
```