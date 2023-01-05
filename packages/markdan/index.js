'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/markdan.cjs.prod.js')
} else {
  module.exports = require('./dist/markdan.cjs.js')
}
