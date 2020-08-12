const assert = require('assert')

/** State-name-to-iso2 lookup. */
const iso2Map = {
  AGUASCALIENTES: 'iso2:MX-AGU',
  'BAJA CALIFORNIA': 'iso2:MX-BCN',
  'BAJA CALIFORNIA SUR': 'iso2:MX-BCS',
  CAMPECHE: 'iso2:MX-CAM',
  CHIHUAHUA: 'iso2:MX-CHH',
  CHIAPAS: 'iso2:MX-CHP',
  'MEXICO CITY': 'iso2:MX-CMX',
  'DISTRITO FEDERAL': 'iso2:MX-CMX',  // Officially equivalent to Mexico City.
  COAHUILA: 'iso2:MX-COA',
  COLIMA: 'iso2:MX-COL',
  DURANGO: 'iso2:MX-DUR',
  GUERRERO: 'iso2:MX-GRO',
  GUANAJUATO: 'iso2:MX-GUA',
  HIDALGO: 'iso2:MX-HID',
  JALISCO: 'iso2:MX-JAL',
  MEXICO: 'iso2:MX-MEX',
  'MICHOACÁN': 'iso2:MX-MIC',
  'MICHOACAN': 'iso2:MX-MIC',
  MORELOS: 'iso2:MX-MOR',
  NAYARIT: 'iso2:MX-NAY',
  'NUEVO LEÓN': 'iso2:MX-NLE',
  'NUEVO LEON': 'iso2:MX-NLE',
  OAXACA: 'iso2:MX-OAX',
  PUEBLA: 'iso2:MX-PUE',
  'QUERÉTARO': 'iso2:MX-QUE',
  'QUERETARO': 'iso2:MX-QUE',
  'QUINTANA ROO': 'iso2:MX-ROO',
  SINALOA: 'iso2:MX-SIN',
  'SAN LUIS POTOSI': 'iso2:MX-SLP',
  SONORA: 'iso2:MX-SON',
  TABASCO: 'iso2:MX-TAB',
  TAMAULIPAS: 'iso2:MX-TAM',
  TLAXCALA: 'iso2:MX-TLA',
  VERACRUZ: 'iso2:MX-VER',
  'YUCATÁN': 'iso2:MX-YUC',
  'YUCATAN': 'iso2:MX-YUC',
  ZACATECAS: 'iso2:MX-ZAC'
}

/** Lookup iso2 code for stateName, throws if missing. */
function iso2Lookup (stateName) {
  const ret = iso2Map[stateName.toUpperCase()]
  assert(ret, `Have iso2Map match for ${stateName}`)
  return ret
}

/**
 * MX presents data as a table with columns ['name', 'date1', 'date2',
 * ...]  etc, where the values at each row is the quantity for that
 * date.  Since our timeseries parsing code deals with rows, instead
 * of columns, this transforms the MX data into a more common
 * row-based format.
 *
 * e.g. for the below data:
 * | name | 01-02-2020 | 01-03-2020 |
 * | A    | 14         | 21 |
 *
 *
 * this returns
 *
 * A, 01-02-2020, 14
 * A, 01-03-2020, 21
*/

function transform (data) {

  const dates = Object.keys(data[0]).
        filter(s => s.match(/\d\d-\d\d-\d\d\d\d/))

  // mx data is DD-MM-YYYY (e.g 13-01-2020)
  function toYYYYMMDD (s) {
    const [ d, m, y ] = s.split('-')
    return [ y, m, d ].join('-')
  }

  return data.reduce((arr, row) => {
    dates.forEach(d => {
      arr.push({
        name: row.nombre,
        date: toYYYYMMDD(d),
        value: parseInt(row[d], 10)
      })
    })
    return arr
  }, [])
}


module.exports = {
  iso2Lookup,
  transform
}
