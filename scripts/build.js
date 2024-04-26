import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import * as esbuild from 'esbuild'
import minimist from 'minimist'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const args = minimist(process.argv.slice(2))

// 运行模式
const mode = args.m || 'prod'

const isDev = mode === 'dev'

// 如果是开发模式则输出到 template-explorer 中
const outputDir = isDev
  ? resolve(__dirname, '../packages/template-explorer/src/lib/index.js')
  : false

// 需要打包的模块，默认打包 markdan 模块
const targets = args._.length ? args._ : ['markdan']

// 打包的格式，默认为 global 即 IIFE 模式
const format = args.f || 'global'

// 打包文件的输出格式
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
    ? 'cjs'
    : 'esm'

for (const target of targets) {
  // 打包的入口文件
  const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
  // 输出文件路径
  const outfile = outputDir || resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

  // 读取模块中的 package.json 文件
  const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))
  // 获取 buildOptions 中的 name 作用 IIFE 模式的全局变量名
  const pkgGlobalName = pkg?.buildOptions?.name

  const relativeOutfile = relative(process.cwd(), outfile)

  // 使用 esbuild 进行打包
  esbuild
    .context({
      entryPoints: [entry], // 入口
      outfile, // 输出文件路径
      bundle: true, // 将依赖的文件递归地打包到一个文件中，默认不会进行打包
      sourcemap: true, // 开启 sourcemap
      format: outputFormat, // 打包文件输出的格式 'iife' | 'cjs' | 'esm'
      globalName: pkgGlobalName, // 如果输出格式为 iife，则需要指定一个全局变量名
      platform: format === 'cjs' ? 'node' : 'browser',
      // // 监听文件变化，进行重新构建
      // watch: {
      //   onRebuild(error) {
      //     if (!error) console.log(`rebuilt: ${relativeOutfile}`)
      //   },
      // },
    })
    .then((ctx) => {
      if (isDev) {
        ctx.watch()
        console.log(`watching: ${relativeOutfile}`)
      }
    })
}
