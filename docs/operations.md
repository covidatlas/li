Operations

# Environments


# Launching

Launches to staging happen on push or PR to the `develop` branch.

Launches to prod happen on push or PR to the `master` branch.

See `/.github/workflows/`

## Launch failures

Launches occasionally fail with "Deploy Failed", and in the GitHub Actions log you'll see "deploy failed! Too Many Requests ... TooManyRequestsException: Too Many Requests".  This occasionally happens ... nothing to worry about, you can just wait for the next deploy.

# Secrets

Secrets are configured in arc environments per https://arc.codes/reference/cli/env

eg, from root, this creates a new secret:

```
npx arc env production SLACK_STATUS_HOOK <hook-url>
```

# Monitoring

## Slack hooks

Slack incoming hooks are configured at https://covid-atlas.slack.com/apps/A0F7XDUAZ-incoming-webhooks

## Status URLs

Some status URLs:

Staging

* https://api.staging.covidatlas.com/status?format=html
* https://api.staging.covidatlas.com/reports/status?format=html

Prod

* https://api.covidatlas.com/status?format=html
* https://api.covidatlas.com/reports/status?format=html

## TODOs

We need better monitoring ... looking for guidance from AWS pros on how to make a nice dashboard, surface issues, etc.

# AWS console sign-in

https://covidatlas.signin.aws.amazon.com/console

# Connecting to staging

If you needed to connect to staging, yet still run code locally, to test something out, you can do the following:

```
AWS_PROFILE=covidatlas NODE_ENV=staging ARC_LOCAL=1 npx sandbox
```