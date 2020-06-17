const arc = require('@architect/functions')
let data // Cache data lookup in global scope

module.exports = async function scan (table) {
  if (!data) data = await arc.tables()
  let items = []
  async function get (page) {
    let params = { Limit: 1 }
    if (page) params.ExclusiveStartKey = page
    // eslint-disable-next-line
    let { Items, LastEvaluatedKey } = await data[table].scan(params)
    items = items.concat(Items)
    // Uncomment below to enable pagination
    // if (LastEvaluatedKey) await get(LastEvaluatedKey)
  }
  await get()

  return items
}
