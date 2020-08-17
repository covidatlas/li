# Branches

This project has two main branches: `master` and `develop`.

## `master`

`master` is launched to production, and `develop` to staging.

Generally, you'll want to develop by branching off of and PR to `master`.  Use this branch for changes/fixes of sources, or bugfixes.

## `develop`

Only use `develop` if you're trying some experimental change that you specifically need to have launched to the staging environment first.  In practically all cases, this won't be necessary -- just go to prod.  Local development is generally ok.

Cases when you might want to try this:

* report changes/fixes, due to large data volume
* changes to the Li "framework" (e.g., events, scheduling, etc)
* any changes to logging or notification that you want to check out on AWS