import type { MarkdanInterfaceOptions, MarkdanInterfaceStyle } from '@markdan/editor'
import { createEditorInterfaceApi, initialStyle, normalizeStyle } from '@markdan/editor'
import type { MarkdanRenderBlock, MarkdanViewBlock } from '@markdan/engine'
import { initEngine } from '@markdan/engine'
import { EditorSelection } from './selection'
import EventEmitter from './emitter'
import { registerEventHandler } from './events'
import type { MarkdanSchema } from './schema'
import { createSchemaApi } from './schema'

export interface Markdan {
  version: string

  use(): this

  mount(): any
  unmount(): void
}

export interface MarkdanConfig {
  uid: string
  containerRect: DOMRect
  style: MarkdanInterfaceStyle
}

export interface MarkdanContext {
  config: MarkdanConfig
  selection: EditorSelection
  dataSource: string
  viewBlocks: MarkdanViewBlock[]
  renderBlocks: MarkdanRenderBlock[]
  schema: MarkdanSchema
  emitter: EventEmitter
}

export function createAppContext() {
  const ctx: MarkdanContext = {
    config: {} as MarkdanConfig,
    selection: {} as EditorSelection,
    schema: createSchemaApi(),
    dataSource: '',
    viewBlocks: [],
    renderBlocks: [],
    emitter: new EventEmitter(),
  }

  ctx.selection = new EditorSelection(ctx)

  return ctx
}

export function createApp() {
  const ctx = createAppContext()

  // @todo parseDataSource => schema.elements

  return {
    use() {},
    mount(el: string | HTMLElement, options: MarkdanInterfaceOptions) {
      const oEl = typeof el === 'string' ? document.querySelector<HTMLElement>(el) : el

      if (!oEl) {
        throw new TypeError(`el expect a selector or a HTML element, but got ${el}`)
      }

      ctx.config.containerRect = oEl.getBoundingClientRect()

      ctx.config.style = normalizeStyle({
        ...initialStyle,
        ...options.style,
      }, ctx.config)

      // 注册事件处理
      registerEventHandler(ctx)

      // 初始化引擎
      initEngine(ctx)

      createEditorInterfaceApi(oEl, options, ctx)

      ctx.schema.append(ctx.schema.createElement('h1', [], 'Heading 1'))
      const h2 = ctx.schema.append(ctx.schema.createElement('h2', [], ''))
      const strong = ctx.schema.append(ctx.schema.createElement('strong', [h2.id], 'Strong'))
      ctx.schema.append(ctx.schema.createElement('italic', [h2.id, strong.id], 'Text'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))

      ctx.emitter.emit('schema:change', ctx.schema)

      // ctx.emitter.emit('render', ctx.renderBlocks)
    },
  }
}
