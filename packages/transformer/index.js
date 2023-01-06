'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/transform.cjs.prod.js.js')
} else {
  module.exports = require('./dist/transform.cjs.js.js')
}
