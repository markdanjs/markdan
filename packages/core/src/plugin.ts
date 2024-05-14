import type { MarkdanContext } from '.'

export type Plugin = (ctx: MarkdanContext) => void

export type MarkdanPlugin = ReturnType<typeof createPluginApi>

export function createPluginApi(ctx: MarkdanContext) {
  const plugins = new WeakSet<Plugin>()

  return {
    install(plugin: Plugin) {
      plugins.add(plugin)

      // eslint-disable-next-line no-console
      console.log(ctx)
    },
  }
}
