module.exports = {
  parserOptions: {
    ecmaVersion: 2018
  },
  env: {
    node: true,
    es6: true
  },
  extends: 'eslint:recommended',
  plugins: [
    'filenames',
    'fp',
    'import'
  ],
  rules: {
    // Enable additional rules
    'linebreak-style': [ 'error', 'unix' ],
    // Node specific
    'global-require': 'error',
    'handle-callback-err': 'error',
    // Override default options for rules from base configurations
    'no-cond-assign': [ 'error', 'always' ],
    // Disable rules from base configurations
    'arrow-body-style': 'off',
    'no-console': 'off',
    'no-inner-declarations': 'off',
    'no-redeclare': 'off',
    'no-useless-escape': 'off',
    // Ensure filesystem safe filenames
    'filenames/match-regex': [ 2, '^[a-z0-9-_]+$', true ],
    // Cleanup on aisle semicolon
    semi: [2, 'never' ],
    // Functional
    'fp/no-class': 'error',
    // Style
    'no-trailing-spaces': 'error',
    'space-before-function-paren': [ 'error', 'always' ],
    'object-curly-spacing': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'func-style': [ 'error', 'declaration', { allowArrowFunctions: true } ],
    // Plugins
    'import/no-unresolved': [2, { commonjs: true, amd: true }]
  },
  ignorePatterns: [
    'scratch',
    'node_modules'
  ]
}
