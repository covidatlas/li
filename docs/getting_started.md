# Getting started

You'll need the following:

* [Node.js 12](https://nodejs.org/en/download/) or newer

Clone the repository and install its dependencies:

```
git clone https://github.com/covidatlas/li.git
cd li
npm install
```

If you get an error message saying you have an incompatible version of `node`, you may need to change versions.  You can use `n` or `nvm` if you don't want to install Node.js 12.x.


## Usage

### Start the local dev server

Start the local dev server in one terminal:

```
$ npm start
```

The first time you run this it may take a few moments as it installs additional dependencies.  At the end you'll see "Sandbox Started ... http://localhost:3333".


### Crawling and scraping a source

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

#### Source IDs

Source IDs (also known as source keys) are derived from the local path of the source on the filesystem.

Sources are located in: `src/shared/sources/`

The path within that directory determines its key:
- `us/ut/index.js` is `us-ut`
- `nyt/index.js` is `nyt`
- `us/ca/san-francisco-county` is `us-ca-san-francisco-county`

To see a list of available source IDs, use `npm run list-sources`:

```
$ npm run list-sources

Source ID                   shared/sources/
---------                   ---------------
gb-eng                      gb/eng/index.js
gb-sct                      gb/sct/index.js
...
```


#### Scraping a particular date

On Mac, Linux, etc:
```
./start --scrape <id> --date 2020-03-19
```

On Windows:
```
node .\start --scrape <id> --date 2020-03-19
```

### Re-generating old data

TBD


### Generating reports

```
npm run gen-reports
```

The reports will be generated from the data present in your local database.

Reports are generated to `/reports` in project root.

The report generation status is shown in http://localhost:3333/report_status.


## Tests

We have unit tests and integration tests in the `tests` folder.

Run tests with the following:

| Command | Runs |
| --- | --- |
| `npm run test` | Unit and integration tests |
| `npm run test:unit` | Only unit tests (super fast!) |
| `npm run test:integration` | Only integration tests |

Unit and integration tests are kept separate because the former are
blazingly fast, while the latter may take some time.

For more info, see [Testing](./docs/testing.md).

## Help

Run `npm run help` to see a list of commands.