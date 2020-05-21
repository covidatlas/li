const assert = require("assert")
const maintainers = require("../_lib/maintainers.js")
const parse = require("../_lib/parse.js")
const transform = require("../_lib/transform.js")

const country = "iso1:ES"

const dateKey = "fecha"
const stateKey = "CCAA"

const nameToCanonical = {
  // Name differences get mapped to the canonical names
  Andalucía: "Andalusia",
  "Castilla y León": "Castile and León",
  Cataluña: "Catalonia",
  "C. Valenciana": "Valencian Community",
  "País Vasco": "Basque Country",
}

const isoMap = {
  // Non-unique gets mapped straight to ISO2
  Asturias: "iso2:ES-AS",
  Aragón: "iso2:ES-AR",
  Baleares: "iso2:ES-IB",
  Canarias: "iso2:ES-CN",
  Cantabria: "iso2:ES-CB",
  "Castilla La Mancha": "iso2:ES-CM",
  Madrid: "iso2:ES-MD",
  Murcia: "iso2:ES-MC",
  Navarra: "iso2:ES-NC",
  "La Rioja": "iso2:ES-RI",
}

module.exports = {
  country,
  timeseries: true,
  priority: 1,
  friendly: {
    name: "datadista.com",
    url: "https://github.com/datadista/datasets/tree/master/COVID%2019",
  },
  maintainers: [
    {
      name: "Herb Caudill",
      url: "https://devresults.com",
      twitter: "@herbcaudill",
      github: "herbcaudill",
    },
    maintainers.camjc,
  ],
  scrapers: [
    {
      startDate: "2020-02-21",
      crawl: [
        {
          name: "cases",
          url:
            "https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_confirmados_pcr_long.csv",
          type: "csv",
        },
        {
          name: "hospitalized",
          url:
            "https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_hospitalizados_long.csv",
          type: "csv",
        },
        {
          name: "recovered",
          url:
            "https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_altas_long.csv",
          type: "csv",
        },
        {
          name: "deaths",
          url:
            "https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_fallecidos_long.csv",
          type: "csv",
        },
        {
          name: "icu",
          url:
            "https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_uci_long.csv",
          type: "csv",
        },
      ],
      scrape (data, date, { getIso2FromName }) {
        const statesByIso = {}
        for (const [ key, items ] of Object.entries(data)) {
          items
            .filter((row) => row[dateKey] === date)
            .forEach((row) => {
              const iso2 = getIso2FromName({
                country,
                name: row[stateKey],
                nameToCanonical,
                isoMap,
              })
              statesByIso[iso2] = statesByIso[iso2] || {}
              statesByIso[iso2][key] = parse.number(row.total)
            })
        }

        const states = []
        for (const [ iso, item ] of Object.entries(statesByIso)) {
          states.push({
            state: iso,
            ...item,
          })
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
