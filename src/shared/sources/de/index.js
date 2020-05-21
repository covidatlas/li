const assert = require("assert")
const maintainers = require("../../sources/_lib/maintainers.js")
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
        const datesData = data.find((row) => row.time_iso8601.startsWith(date))
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
          states.push({ state, ...value })
        }

        const summedData = transform.sumData(states)
        states.push(summedData)
        assert(
          summedData.cases > 0,
          `Cases are not reasonable for date: ${date}`
        )
        return states
      },
    },
  ],
}
