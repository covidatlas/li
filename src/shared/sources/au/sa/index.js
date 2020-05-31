const assert = require('assert')
const datetime = require('../../../datetime/index.js')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const schemaKeysByHeadingFragment = {
  'confirmed case': 'cases',
  deaths: 'deaths',
  icu: 'icu',
  'cases cleared': 'recovered',
  type: null
}

const firstUrl =
  'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia'
const secondUrl =
  'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/conditions/infectious+diseases/covid+2019/latest+updates/covid-19+cases+in+south+australia'


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

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-SA',
  friendly: {
    name: 'SA Health',
    url: 'https://www.sahealth.sa.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-01',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: firstUrl
        }
      ],
      scrape ($) {
        const paragraph = $('.middle-column p:first-of-type').text()
        const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups
        return {
          cases: parse.number(casesString)
        }
      }
    },
    {
      startDate: '2020-03-27',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: () => {
            if (datetime.dateIsBeforeOrEqualTo(datetime.cast(null, 'Australia/Adelaide'), '2020-04-21')) {
              return { url: firstUrl }
            }
            return { url: secondUrl }
          }
        }
      ],
      scrape ($, date, { getSchemaKeyFromHeading, normalizeTable, transposeArrayOfArrays }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: 'table:first-of-type' })
        )
        assert(normalizedTable.length > 0)

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        const dataRow = normalizedTable[normalizedTable.length - 1]

        const data = {}
        dataRow.forEach((value, columnIndex) => {
          const key = dataKeysByColumnIndex[columnIndex]
          if (key) {
            data[key] = parse.number(value)
          }
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    },
    {
      startDate: '2020-04-01',
      crawl: [
        {
          type: 'json',
          url: 'https://dpc.geohub.sa.gov.au/server/rest/services/Hosted/DHW_COVID_19_PositiveCases_POLY/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&sqlFormat=none&resultType=&f=pjson'
        }
      ],
      scrape ($, date, { cumulateObjects, getSchemaKeyFromHeading }) {
        assert($.features.length > 0, 'features are unreasonable')
        const attributes = $.features.map(({ attributes }) => attributes)

        const dataByRegion = attributes.map(
          (attributesForRegion) => pickBy(attributesForRegion, (value, key) => key.includes(date.replace(/-/g, '')))
        )
        assert(
          dataByRegion.some((datum) => Object.keys(datum).length > 0),
          `No data for date: ${date}`
        )

        const schemaKeysByHeadingFragment = {
          positive: 'cases',
          active: 'active'
        }

        const data = {}
        for (const [ heading, value ] of Object.entries(cumulateObjects(dataByRegion))) {
          const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
          if (!data[key]) {
            data[key] = 0
          }
          data[key] += value
        }

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
