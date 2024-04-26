'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/editor.cjs.prod.js.js')
} else {
  module.exports = require('./dist/editor.cjs.js.js')
}
