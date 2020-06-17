const arc = require('@architect/functions')
const datetime = require('@architect/shared/datetime/index.js')

module.exports = async function getCaseData (locations) {
  const data = await arc.tables()

  for (const location of locations) {
    const { locationID, tz } = location

    const today = datetime.cast(null, tz)
    const date = datetime.subtract(today, 1)

    // Probably should not require pagination as we should only be querying out a few rows tops
    const { Items } = await data['case-data'].query({
      KeyConditionExpression: 'locationID = :locationID and dateSource >= :date',
      ExpressionAttributeValues: {
        ':locationID': locationID,
        ':date': date
      }
    })

    if (Items.length) location.caseData = Items
  }

  return locations
}
