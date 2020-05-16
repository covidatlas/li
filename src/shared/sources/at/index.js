// Migrated from coronadatascraper, src/shared/scrapers/AT/index.js

const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const mapping = require('./mapping.json')
const muniMapping = require('./municipality-mapping.json')

module.exports = {
  country: 'iso1:AT',
  timeseries: false,
  priority: 1,
  maintainers: [ maintainers.qgolsteyn ],
  scrapers: [
    /*
      Below (in the scrape function) is the code from CDS.
      This code deals with timeseries data, which is not
      cached. I'll leave this here in case we
      managed to dig up some cached timeseries data for
      AT in the future. -- jz

    {
      startDate: '0',
      crawl: [
        {
          type: 'csv',
          url: 'this.url',
        },
      ],
      scrape (data, date, helpers) {

      const data = [];
      this.url = 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-at.csv';
      this.sources = [
        {
          description: 'COVID-19/SARS-COV-2 Cases in EU by Country, State/Province/Local Authorities, and Date',
          url: 'https://github.com/covid19-eu-zh/covid19-eu-data',
          name: 'covid19-eu-data'
        }
      ];
      const casesRaw = await fetch.csv(this, this.url, 'default', false);
      const casesData = casesRaw.filter(item => datetime.scrapeDateIs(item.datetime));
      if (casesData.length > 0) {
        const casesByRegion = {};
        for (const item of casesData) {
          if (item.nuts_2) {
            casesByRegion[item.nuts_2] = parse.number(item.cases);
          }
        }
        for (const region of Object.keys(casesByRegion)) {
          data.push({
            state: mapping[region],
            cases: casesByRegion[region]
          });
        }
        data.push(transform.sumData(data));
      }
      return data;

      }
    },
    */

    {
      startDate: '2020-04-14',
      crawl: [
        {
          type: 'raw',
          url: 'https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js'
        }
      ],
      scrape () {
        return [
          { state: 'iso2:AT-9', cases: 2053 },
          { state: 'iso2:AT-8', cases: 832 },
          { state: 'iso2:AT-7', cases: 3328 },
          { state: 'iso2:AT-6', cases: 1588 },
          { state: 'iso2:AT-5', cases: 1174 },
          { state: 'iso2:AT-4', cases: 2140 },
          { state: 'iso2:AT-3', cases: 2387 },
          { state: 'iso2:AT-2', cases: 386 },
          { state: 'iso2:AT-1', cases: 271 },
          { cases: 14043 }
        ]
      }
    },
    {
      startDate: '2020-04-15',
      crawl: [
        {
          type: 'raw',
          url: 'https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js',
          name: 'recovereddeaths',
        },
        {
          type: 'raw',
          url: 'https://info.gesundheitsministerium.at/data/Bezirke.js',
          name: 'cases',
        },
      ],
      scrape (data) {

      const result = []

      const recoveredDeathsRaw = data.recovereddeaths
      const recoveredDeathsData = JSON.parse(recoveredDeathsRaw.match(/\[.*\]/g))

      const casesRaw = data.cases
      const casesRegionData = JSON.parse(casesRaw.match(/\[.*\]/g))
      const casesByRegion = {}
      const deathsByRegion = {}
      const recoveredByRegion = {}
      for (const item of casesRegionData) {
        casesByRegion[muniMapping[item.label]] = item.y + (casesByRegion[muniMapping[item.label]] || 0)
      }
      for (const item of recoveredDeathsData) {
        recoveredByRegion[item.label] = item.y
        deathsByRegion[item.label] = item.z
      }
      for (const region of Object.keys(casesByRegion)) {
        result.push({
          state: mapping[region],
          cases: casesByRegion[region],
          recovered: recoveredByRegion[region],
          deaths: deathsByRegion[region]
        })
      }
      result.push(transform.sumData(result))
      return result
      }
    }
  ]
}
