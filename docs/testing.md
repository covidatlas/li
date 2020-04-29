# Testing

We have unit tests and integration tests in the `tests` folder.

Run tests with the following:

| Command | Runs |
| --- | --- |
| `npm run test` | Unit and integration tests |
| `npm run test:unit` | Only unit tests (super fast!) |
| `npm run test:integration` | Only integration tests |

Unit and integration tests are kept separate because the former are blazingly fast, while the latter may take some time.

## Integration tests

### `tests/integration/shared/sources/new-or-changed-sources-test.js`

The tests in this module are run on new or changed sources, as found by a `git diff` against a baseline branch that you specify (see "Configuration" below).

Tests performed for each new/changed source:

* a live crawl (you'll need to be connected to the net)
* a scrape of the data returned from the crawl
* a scrape of every date stored in the cache for that source

Each of these tests could fail for different reasons; see "Possible errors" below.

#### Configuration

These tests run `git diff` for your current branch against some baseline branch to determine what sources are new or changed.

Since it's impossible for us to accurately guess what the right baseline branch would be in your case (`origin/master`? `upstream/master`?), you will need to create a `gitdiff.json` in `tests/integration/shared/sources`.  See `gitdiff.json.example` in that folder for reference.

If this file is missing, the test will stop with a giant warning message.  (In CI, we just use `origin/master` as the base branch, and this file isn't required).

Note you can ignore the `git diff` by setting some environment
variables, see below.

#### Environment variables.

The integration tests may be insufficient, or too inclusive.  You can filter the things to include using some environment variables:

* `TEST_ALL=1 npm run test:integration` runs _all_ of the sources
* `TEST_ONLY=gb-sct,nl,gb-eng npm run test:integration` runs the indicated sources
* `SCRAPE_ONLY=2020-04-10,2020-04-11 npm run test:integration` only scrapes these dates in the cache

You can combine `TEST_*` and `SCRAPE_ONLY`:

`TEST_ONLY=us-ca-san-francisco-county SCRAPE_ONLY=2020-04-10,2020-04-11 npm run test:integration`

#### Possible errors

`new-or-changed-sources-test.js` may fail occasionally.  Some of these errors may be preventable, others not ... we will have to determine the best way to manage them going forward.

##### Live crawl errors

* source URL is down or has moved
* source not available from the originating country of request (geo blocked)

##### Live scrape errors

* crawl failed (see errors above)
* data format returned from the crawl has changed.  For this, the scraper function needs to be updated.

##### Historical scrape errors

This can be tricky.  Some possible issues and resolutions:

| Issue | Example | Possible resolution |
| --- | --- | --- |
| Unexpected cache file | Json file with `{ "error": "denied" }` | The cached file should probably be removed from the cache. |
| A redirect message of some sort | Html file with `Sorry, we've moved!' | The crawl url should change, and the cache re-populated. |
| A cached file with a changed layout | e.g., the April 4th scraper expects data in one layout, but the source changed the data on April 3rd | A new scrape function should be written with a new startDate. |
