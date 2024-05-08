import type { MarkdanInterface, MarkdanInterfaceOptions, MarkdanInterfaceStyle, MarkdanInterfaceTheme } from '@markdan/editor'
import { createEditorInterfaceApi, initialStyle, initialTheme, normalizeStyle } from '@markdan/editor'
import type { MarkdanRenderedElement, MarkdanViewBlock } from '@markdan/engine'
import { initEngine } from '@markdan/engine'
import type { DeepPartialObject } from '@markdan/helper'
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
  theme: MarkdanInterfaceTheme
  style: MarkdanInterfaceStyle
  lineNumber: boolean
  scrollbarSize: number
  paddingRight: number
}

export interface MarkdanContext {
  config: MarkdanConfig
  selection: EditorSelection
  dataSource: string
  viewBlocks: MarkdanViewBlock[]
  renderedElements: MarkdanRenderedElement[]
  schema: MarkdanSchema
  emitter: EventEmitter
  interface: MarkdanInterface
  /**
   * 获取鼠标在编辑器中的位置
   */
  getMousePosition(e: Event): void
}

export function createAppContext() {
  const ctx: MarkdanContext = {
    config: {} as MarkdanConfig,
    selection: {} as EditorSelection,
    schema: createSchemaApi(),
    dataSource: '',
    viewBlocks: [],
    renderedElements: [],
    emitter: new EventEmitter(),
    interface: {} as MarkdanInterface,

    getMousePosition(_e) {},
  }

  ctx.selection = new EditorSelection(ctx)

  return ctx
}

export function createApp() {
  const ctx = createAppContext()

  // @todo parseDataSource => schema.elements

  return {
    use() {},
    mount(el: string | HTMLElement, options: DeepPartialObject<MarkdanInterfaceOptions> = {}) {
      const oEl = typeof el === 'string' ? document.querySelector<HTMLElement>(el) : el

      if (!oEl) {
        throw new TypeError(`el expect a selector or a HTML element, but got ${el}`)
      }

      const containerRect = oEl.getBoundingClientRect()
      Object.assign(ctx.config, {
        containerRect,
        style: normalizeStyle({
          ...initialStyle,
          ...options.style,
        }, containerRect.width, containerRect.height),
        theme: options.theme ?? initialTheme,
        lineNumber: !!options.lineNumber,
        scrollbarSize: 16,
        paddingRight: 16,
      })

      // 注册事件处理
      registerEventHandler(ctx)

      // 初始化引擎
      initEngine(ctx)

      ctx.interface = createEditorInterfaceApi(oEl, ctx)

      ctx.schema.append(ctx.schema.createElement('h1', [], 'Heading 1'))
      const h2 = ctx.schema.append(ctx.schema.createElement('h2', [], ''))
      const strong = ctx.schema.append(ctx.schema.createElement('strong', [h2.id], 'Strong'))
      ctx.schema.append(ctx.schema.createElement('italic', [h2.id, strong.id], 'Text'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))

      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 3'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 4'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 5'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))
      ctx.schema.append(ctx.schema.createElement('h2', [], 'Heading 2'))
      ctx.schema.append(ctx.schema.createElement('paragraph', [], 'mount(el: string | HTMLElement, options: MarkdanInterfaceOptions): void'))

      ctx.emitter.emit('schema:change', ctx.schema)

      // ctx.emitter.emit('render', ctx.renderBlocks)
    },
  }
}
