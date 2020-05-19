const parse = require('../_lib/parse.js')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const spacetime = require('spacetime')

const isoMap = require('./mapping.json')

const country = "iso1:PL"

module.exports = {
    country,
    maintainers: [ maintainers.qgolsteyn, maintainers.ciscorucinski ],
    friendly: {
        name: 'Ministry of Health of the Republic of Poland',
        url: 'http://www.mz.gov.pl/'
    },
    scrapers: [
        {
            startDate: '2020-03-18',
            crawl: [
                {
                    type: 'csv',
                    url: 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-pl.csv'
                }
            ],
            scrape (data, date) {
                const casesByRegion = {}
                const deathsByRegion = {}
                for (const item of data) {
                    const dt = spacetime(item.datetime, 'Europe/Warsaw')
                    const nuts_2 = item.nuts_2
                    if (dt.isBefore(date) && nuts_2) {
                        casesByRegion[nuts_2] = parseInt(item.cases, 10)
                        deathsByRegion[nuts_2] = parse.number(item.deaths, 10)
                    }
                }

                const states = []
                for (const region of Object.keys(casesByRegion)) {
                    states.push({
                        state: isoMap[region],
                        cases: casesByRegion[region]
                    })
                }

                if (states.length > 0) states.push(transform.sumData(states))
                return states
            }
        },
        {
            startDate: '2020-04-13',
            crawl: [
                {
                    type: 'page',
                    url: 'https://www.gov.pl/web/koronawirus/wykaz-zarazen-koronawirusem-sars-cov-2',
                }
            ],
            // eslint-disable-next-line no-unused-vars
            scrape ($, date, { getIso2FromName }) {
                console.log("New Scraper")
                const $pre = $('#registerData')
                const casesData = JSON.parse(JSON.parse($pre.text()).parsedData)

                const casesByRegion = {}
                const deathsByRegion = {}

                for (const item of casesData) {
                    casesByRegion[item['Województwo']] = parse.number(item.Liczba)
                    deathsByRegion[item['Województwo']] = parse.number(item['Liczba zgonów'])
                }

                const data = []
                const validRegions = Object.keys(casesByRegion).
                    filter(r => r !== '').
                    filter(r => r !== 'Cała Polska').
                    filter(r => !r.match(/^http/))
                for (const region of validRegions) {
                    data.push({
                        state: getIso2FromName({ country, name: region, isoMap }),
                        cases: casesByRegion[region],
                        deaths: deathsByRegion[region]
                    })
                }
                if (data.length > 0) data.push(transform.sumData(data))
                return data
            }
        }
    ]
}
