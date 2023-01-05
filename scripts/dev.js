const { resolve, relative } = require('path')
const { build } = require('esbuild')
const minimist = require('minimist')

const args = minimist(process.argv.slice(2))

// 需要打包的模块，默认打包 markdan 模块
const target = args._[0] || 'markdan'
// 打包的格式，默认为 global 即 IIFE 模式
const format = args.f || 'global'

// 打包的入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
// 打包文件的输出格式
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
    ? 'cjs'
    : 'esm'

// 输出文件路径
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

// 读取模块中的 package.json 文件
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))
// 获取 buildOptions 中的 name 作用 IIFE 模式的全局变量名
const pkgGlobalName = pkg?.buildOptions?.name

const relativeOutfile = relative(process.cwd(), outfile)

// 使用 esbuild 进行打包
build({
  entryPoints: [entry], // 入口
  outfile, // 输出文件路径
  bundle: true, // 将依赖的文件递归地打包到一个文件中，默认不会进行打包
  sourcemap: true, // 开启 sourcemap
  format: outputFormat, // 打包文件输出的格式 'iife' | 'cjs' | 'esm'
  globalName: pkgGlobalName, // 如果输出格式为 iife，则需要指定一个全局变量名
  platform: format === 'cjs' ? 'node' : 'browser',
  // 监听文件变化，进行重新构建
  watch: {
    onRebuild(error) {
      if (!error) console.log(`rebuilt: ${relativeOutfile}`)
    },
  },
}).then(() => {
  console.log(`watching: ${relativeOutfile}`)
})
