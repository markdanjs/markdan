// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { createApp } from './lib/index.js'
import './lib/index.css'

createApp()
  .mount('#app', {
    style: {
      width: '100px',
      height: '100px',
      fontSize: '16px',
      lineHeight: '20px',
    },
  })
