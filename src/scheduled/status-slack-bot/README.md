# Status slack scheduled job.

Gets data from src/http/status, formats for Slack API call, and then calls Slack hook.

Slack incoming hooks are configured at https://covid-atlas.slack.com/apps/A0F7XDUAZ-incoming-webhooks.

The hook is stored as env var SLACK_STATUS_HOOK in arc https://arc.codes/reference/cli/env

## Debugging/hacking

You can see the data that will be sent to slack:

```
NODE_ENV=production node _generate-status-report.js
```

`NODE_ENV` values: `testing`, `staging`, `production`