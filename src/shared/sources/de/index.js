const assert = require("assert")
const maintainers = require("../../sources/_lib/maintainers.js")
const timeseriesFilter = require("../_lib/timeseries-filter.js")
const parse = require("../../sources/_lib/parse.js")
const transform = require("../../sources/_lib/transform.js")

/**
 * Hand-rolled version of _.pickBy from lodash
 * @param {object} object
 * @param {(value:any, key: string|null) => boolean} predicate
 */
const pickBy = (object, predicate) => {
  const obj = {}
  for (const key in object) {
    if (predicate(object[key], key)) {
      obj[key] = object[key]
    }
  }
  return obj
}

const country = "iso1:DE"
module.exports = {
  timeseries: true,
  curators: [
    {
      name: "Dr. Jan-Philip Gehrcke",
      email: "jgehrcke@googlemail.com",
      url: "https://gehrcke.de",
      github: "jgehrcke",
    },
  ],
  maintainers: [
    {
      name: "Dr. Jan-Philip Gehrcke",
      email: "jgehrcke@googlemail.com",
      url: "https://gehrcke.de",
      github: "jgehrcke",
    },
    maintainers.camjc,
  ],
  country,
  friendly: {
    name:
      "Robert Koch-Institut (RKI), Landesgesundheitsminmisterien, Landesgesundheitsämter",
    url: "https://github.com/jgehrcke/covid-19-germany-gae",
  },
  scrapers: [
    {
      startDate: "2020-03-10",
      crawl: [
        {
          type: "csv",
          url:
            "https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv",
        },
      ],
      scrape (data, date) {

        // Sample date: '2020-06-03T11:30:11+02:00'
        function toYYYYMMDD (datestring) {
          return datestring.split('T')[0]
        }

        const { filterDate, func } = timeseriesFilter(data, 'time_iso8601', toYYYYMMDD, date)

        const datesData = data.filter(func)[0]
        const statesData = pickBy(datesData, (value, key) =>
          key.startsWith("DE")
        )

        const dataByState = {}
        for (const [ key, value ] of Object.entries(statesData)) {
          const [ stateName, heading ] = key.split("_")
          const state = `iso2:${stateName}`
          dataByState[state] = dataByState[state] || {}
          dataByState[state][heading] = parse.number(value)
        }

        const states = []
        for (const [ state, value ] of Object.entries(dataByState)) {
          states.push({ state, ...value, date: filterDate })
        }

        const summedData = transform.sumData(states)
        states.push({ ...summedData, date: filterDate })
        assert(
          summedData.cases > 0,
          `Cases are not reasonable for date: ${date}`
        )
        return states
      },
    },
  ],
}
