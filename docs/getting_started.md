# Getting started

## Tools

You'll need the following:

* [Node.js 12](https://nodejs.org/en/download/)

## Repo

First, [fork the repository](https://github.com/covidatlas/li.git) so you're ready to contribute back.

### 1. Clone, init submodules, and add upstream

Replace `yourusername` below with your Github username:

```
git clone https://github.com/covidatlas/li.git
cd li
```

### 2. Install dependencies

```
npm install
```

If you get an error message saying you have an incompatible version of `node`, you may need to change versions.  You can use `n` or `nvm` if you don't want to install Node.js 12.x.

### Start the local dev server

Start the local dev server in one terminal:

```
$ npm start
```

The first time you run this it may take a few moments as it installs additional dependencies.  At the end you'll see "Sandbox Started ... http://localhost:3333".


### Crawling and sraping a source

For most folks, crawl and scrape a source in another terminal window (with the dev server still running) with the following commands

On Mac, Linux, etc:
```
./start --crawl <id>
./start --scrape <id>
```

On Windows:
```
node .\start --crawl <id>
node .\start --scrape <id>
```

Source IDs (also known as source keys) are derived from the local path of the source on the filesystem.

Sources are located in: `src/shared/sources/`

The path within that directory determines its key:
- `us/ut/index.js` is `us-ut`
- `nyt/index.js` is `nyt`
- `us/ca/san-francisco-county` is `us-ca-san-francisco-county`


### 3. Pull from upstream often

This gets you the latest sources.

```
git pull upstream master
```


## Run sources



### Re-generating old data

Coming soon!


### Generating timeseries data

Coming soon!


### Command-line options

Coming soon!


## Tests

Run tests with the following:
```
npm run test
npm run test:unit
npm run test:integration
```

Unit and integration tests are kept separate because the former are
blazingly fast, while the latter may take some time.

### Unit tests

Run unit tests with `npm run test:unit`

### Integration tests and configuration

Integration tests are in `tests/integration`.

You can run them with `npm run test:integration`

#### `new-or-changed-sources-test.js`

##### Configuration

The test in
`tests/integration/shared/sources/new-or-changed-sources-test.js` run
`git diff` for your current branch against some baseline branch.

Since it's impossible for us to accurately guess what the right
baseline branch would be in your case (`origin/master`?
`upstream/master`?), you will need to create a `gitdiff.config` in
`tests/integration/shared/sources`.  See `gitdiff.config.example` in
that folder for reference.

If this file is missing, the test will stop with a giant warning
message.  (In CI, we just use `origin/master` as the base branch, and
this file isn't required).

##### About this test

This test actually runs a live crawl and scrape for any new or changed
sources (as defined by a `git diff` against the branch you configured
in `gitdiff.config`).  You'll need to be connected to the net.

##### Running for selected, or all sources

You can tailor the above test by setting some environment variables, e.g.:

```
# To run _all_ of the sources:
TEST_ALL=1 npm run test:integration

# To run selected sources:
TEST_ONLY=gb-sct,nl,gb-eng npm run test:integration
```

The tests are batched for reasonable execution time.