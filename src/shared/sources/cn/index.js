const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const datetime = require('../../datetime/index.js')
const latinizationMap = require('./latinization-map.json')

const country = `iso1:CN`

const casesKey = '累计确诊'
const deathsKey = '累计死亡'

const stateIsntTaiwan = ({ name }) => latinizationMap[name] !== 'Taiwan'

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'China CDC',
    url: 'http://2019ncov.chinacdc.cn/2019-nCoV/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-16',
      crawl: [
        {
          type: 'json',
          url: () => {
            const date = datetime.getYYYYMMDD(datetime.cast(null, 'Asia/Shanghai')).replace(/-/g, '')
            return { url: `http://49.4.25.117/JKZX/yq_${date}.json` }
          }
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        assert($.features.length > 0, 'features are unreasonable')
        const attributes = $.features.map(({ properties }) => properties).filter(stateIsntTaiwan)

        assert(attributes.length > 0, 'data fetch failed, no attributes')

        const states = attributes.map(item => ({
          state: getIso2FromName({ country, name: latinizationMap[item.name] }),
          cases: item[casesKey],
          deaths: item[deathsKey]
        }))

        const summedData = transform.sumData(states)
        states.push(summedData)

        return states
      }
    }
  ]
}
