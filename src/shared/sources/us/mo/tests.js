// Migrated from coronadatascraper, https://github.com/covidatlas/coronadatascraper/pull/1027/files


const srcShared = '../../../'
const assert = require('assert')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')


const _countyMap = {
  'Kansas City': 'Jackson County',
  'St Louis': 'St. Louis County',
  'St Charles': 'St. Charles County',
  'St Clair': 'St. Clair County',
  'Ste Genevieve': 'Ste. Genevieve County',
  'St Francois': 'St. Francois County',
  'Joplin': 'Jasper County',
  'St Louis City': 'St. Louis City',
}

function _getCountyName (countyName) {
  countyName = _countyMap[countyName] || countyName
  if (!countyName.toUpperCase().includes(' CITY')) {
    countyName = geography.addCounty(countyName)
  }
  if (countyName === 'TBD County') {
    countyName = UNASSIGNED
  }
  return countyName
}


// The testing data lists county names all in upper case and without
// the " County" suffix.  This function takes the prettified county
// list and punctuation map and builds an upper-case map; e.g.: UPPER
// => Upper County
function _generateUpperMap(counties, countyMap) {
  const countySuffix = ' County';
  const rval = {};
  counties.forEach(element => {
    const key = element.endsWith(countySuffix) ? element.substring(0, element.length - countySuffix.length) : element;
    rval[key.toUpperCase()] = element;
  });
  Object.entries(countyMap).forEach(keyValue => {
    const [key, value] = keyValue;
    rval[key.toUpperCase()] = value;
  });
  return rval;
}

const arcgisArgs = {
  where: '0=0',
  groupByFieldsForStatistics: 'county,result,test_date',
  outStatistics: '[{"statisticType":"count","onStatisticField":"*","outStatisticFieldName":"Count"}]'
}
  
module.exports = {
  state: 'iso2:US-MO',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.dcardon, maintainers.jzohrab ],
  friendly:   {
    name: 'Missouri Department of Health and Senior Services',
    url: 'https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/'
  },
  scrapers: [
    {
      startDate: '2020-08-01',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated('https://services6.arcgis.com/Bd4MACzvEukoZ9mR/arcgis/rest/services/Daily_COVID19_Testing_Report_for_OPI/FeatureServer/0/query', arcgisArgs)
        }
      ],
      scrape (data, date) {
        console.table(data)
        throw new Error('blag')
      }
    }
  ]
}

