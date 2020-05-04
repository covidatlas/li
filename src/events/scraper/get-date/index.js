const datetime = require('@architect/shared/datetime/index.js')

module.exports = function getDate (event, tz) {
  let { date, _dateUTC } = event

  if (_dateUTC) {
    date = datetime.getYYYYMMDD(_dateUTC)
  }
  else {
    date = date ? datetime.getYYYYMMDD(date) :  datetime.cast(null, tz)
  }

  return { date, _dateUTC }
}
