const maintainers = require("../_lib/maintainers.js")
const parse = require("../_lib/parse.js")
const transform = require("../_lib/transform.js")
const { UNASSIGNED } = require("../_lib/constants.js")

const country = "iso1:NZ"

const mapping = {
  state: "dhb",
  deaths: "deceased",
  recovered: "recovered",
  cases: "total",
  active: "active",
  ignore: [ "last 24 hours" ],
}

const isoMap = {
  // Going to map this all to Nelson ...
  // otherwise the location becomes
  // iso1:nz#iso2:nz-nsn+iso2:nz-mbh when written to dynamoDB, which doesn't work
  // well for reports.
  "Nelson Marlborough": "iso2:NZ-NSN",
}

const nameToCanonical = {
  // Name differences get mapped to the canonical names
  "Capital and Coast": UNASSIGNED,
  "Counties Manukau": UNASSIGNED,
  "Hutt Valley": UNASSIGNED,
  Lakes: UNASSIGNED,
  "Mid Central": UNASSIGNED,
  "South Canterbury": UNASSIGNED,
  Southern: UNASSIGNED,
  Tairāwhiti: UNASSIGNED,
  Wairarapa: UNASSIGNED,
  Waitematā: UNASSIGNED,
  "Managed Isolation & Quarantine": UNASSIGNED,
}

module.exports = {
  aggregate: "state",
  country,
  friendly: {
    name: "New Zealand Government Ministry of Health",
    url: "https://www.health.govt.nz",
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: "2020-04-07",
      crawl: [
        {
          type: "page",
          data: "table",
          url:
            "https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-current-situation/covid-19-current-cases",
        },
      ],
      scrape (
        $,
        date,
        {
          assertTotalsAreReasonable,
          cumulateObjects,
          getIso2FromName,
          groupBy,
          normalizeKey,
          normalizeTable,
        }
      ) {
        const normalizedTable = normalizeTable({
          $,
          tableSelector: 'table:contains("Total cases by DHB")',
        })

        const propColIndices = normalizeKey.propertyColumnIndices(
          normalizedTable[0],
          mapping
        )

        const dataRows = normalizedTable.slice(1, -1)

        const statesUngrouped = []
        dataRows.forEach((row) => {
          const stateData = normalizeKey.createHash(propColIndices, row)
          if (stateData.deaths === undefined) stateData.deaths = 0
          let s = stateData.state
          // Handle data variants.
          if (/Managed Isolation/.test(s))
            s = 'Managed Isolation & Quarantine'
          stateData.state = getIso2FromName({
            country,
            name: s,
            nameToCanonical,
            isoMap,
          })
          statesUngrouped.push(stateData)
        })

        const groupedByState = groupBy(
          statesUngrouped,
          (object) => object.state
        )
        const states = []
        for (const [ stateName, stateAttributes ] of Object.entries(
          groupedByState
        )) {
          const cumulatedObject = cumulateObjects(stateAttributes)
          states.push({
            state: stateName,
            ...cumulatedObject,
          })
        }

        const summedData = transform.sumData(states)
        states.push(summedData)

        const tableWithoutHeadingRow = normalizedTable.slice(1)
        const casesFromTotalRow = parse.number(
          tableWithoutHeadingRow.find((row) =>
            row.some((cell) => cell === "Total")
          )[propColIndices.cases]
        )
        assertTotalsAreReasonable({
          computed: summedData.cases,
          scraped: casesFromTotalRow,
        })
        return states
      },
    },
  ],
}
