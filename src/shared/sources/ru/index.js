const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const mapping = require('./mapping.json')

const UNASSIGNED = '(unassigned)'

const country = 'iso1:RU'

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Rospotrebnadzor (Federal Service for Surveillance on Consumer Rights Protection and Human Wellbeing)',
    url: 'https://www.rospotrebnadzor.ru'
  },
  maintainers: [
    {
      name: 'Arseniy Ivanov',
      twitter: '@freeatnet',
      github: 'freeatnet',
      email: 'arseniy+coronadatascraper@freeatnet.com'
    },
    maintainers.camjc
  ],
  scrapers: [
    {
      startDate: '2020-03-26',
      crawl: [
        {
          type: 'json',
          url: async (client) => {
            const baseUrl = 'https://yandex.ru/maps/api/covid?csrfToken='
            const csrfRequestResponse = await client({ url: baseUrl })
            const { csrfToken } = JSON.parse(csrfRequestResponse.body)
            return { url: `${baseUrl}${csrfToken}`, cookies: csrfRequestResponse.cookies }
          }
        }
      ],
      scrape ($) {
        const ruEntries = $.data.items.filter(({ ru }) => ru)

        const states = ruEntries.map(({ name, cases, cured: recovered, deaths }) => ({
          // The slugify latinized names are quite different from the official latinizations so can't use getIso2FromName.

          // The list contains data at federal subject level, which is the top-level political
          // divisions (including cities of Moscow and St Petersburg).
          state: mapping[name] || UNASSIGNED,
          cases,
          recovered,
          deaths
        }))

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
