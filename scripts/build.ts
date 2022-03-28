import { type Options, build } from 'tsup'

const entryPoints = ['src/index.ts']

function run() {
  const [, , mode] = process.argv
  let _options: Options

  if (mode === 'dev') {
    _options = {
      entryPoints,
      watch: true,
      format: ['cjs', 'esm'],
    }
  } else {
    _options = {
      dts: true,
      clean: true,
      minify: true,
      splitting: true,
      entryPoints,
      format: ['cjs', 'esm'],
    }
  }

  if (!_options) {
    console.warn('\nInvalid mode: %s \n', mode)
    return
  }

  try {
    build(_options)
  } catch (ev) {
    console.log(ev)
    process.exit(1)
  }
}

run()
