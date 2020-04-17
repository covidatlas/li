# Getting started

## Tools

You'll need the following:

* [node](https://nodejs.org/en/download/)

Install them using your favorite method (`homebrew`, etc).

## Repo

First, [fork the repository](https://github.com/covidatlas/li.git) so you're ready to contribute back.

### 1. Clone, init submodules, and add upstream

Replace `yourusername` below with your Github username:

```
git clone git@github.com:yourusername/coronadatascraper.git
cd li
git remote add upstream git@github.com:covidatlas/li.git
```

### 2. Install dependencies

```
npm install
```

If you get an error message saying you have an incompatible version of
`node`, you may need to change version.  You can use `n` to change
node versions: [install](https://www.npmjs.com/package/n) it and run
`n lts`.

### Run the server

Start the server in one window:

```
$ npm run start
```

The first time you run this will take a minute as it downloads dependencies.  At the end you'll see "Sandbox Started in 58873ms ... http://localhost:3333".

Browse to http://localhost:3333/ to see the site.

### Run a sample scraper

TBD

### 3. Run the scrapers

TBD

### 4. Pull from upstream often

This gets you the latest scrapers.

```
git pull upstream master
```

## Run scrapers

TBD

### Run selected scrapers

TBD

### Skipping a scraper

TBD

### Re-generating old data

TBD

### Generating timeseries data

TBD

### Command-line options

TBD

## Tests

We use [Tape](https://github.com/substack/tape).

    npm run test
    npm run test:unit
    npm run test:integration    


### Building for production

TBD
