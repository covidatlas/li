/** Data fields included in generated reports. */

const fields = [

  // Total number of cases
  'cases',

  // Total number of deaths
  'deaths',

  // Total number of recovered
  'recovered',

  // TODO - we may deprecate this field, as it's unclear for many sources.
  'active',

  // Total number tested
  'tested',

  // Total number hospitalized
  'hospitalized',

  // Current number hospitalized
  'hospitalized_current',

  // Total number discharged
  'discharged',

  // Total number in icu
  'icu',

  // Current number in icu
  'icu_current'
]


module.exports = fields
