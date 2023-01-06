import {
  type EditorContext,
  type MarkdanPlugin,
  createContext,
} from './apiCreateContext'

export type EditorMode = 'wygiwys' | 'source'

export type ValueType = string | {
  type?: 'html' | 'text'
  value: string
}

export interface RendererOptions {
  mode: EditorMode
  defaultValue: ValueType
  width: string
  height: string
}

export interface MarkdanEditor {
  readonly context: EditorContext
  readonly use: (plugin: MarkdanPlugin) => MarkdanEditor
  readonly mount: (el: string | HTMLElement) => MarkdanEditor
  readonly setMode: (mode: EditorMode) => MarkdanEditor
}

type CreateEditorFunction<Options> = (options?: Options) => MarkdanEditor

export const createEditor: CreateEditorFunction<Partial<RendererOptions>> = function createEditor(options = {}) {
  const defaultOptions: RendererOptions = {
    mode: 'wygiwys',
    defaultValue: {
      type: 'text',
      value: '',
    },
    width: '100%',
    height: '100%',
    ...options,
  }

  const context = createContext({
    ...defaultOptions,
    ...options,
  })

  const editor: MarkdanEditor = {
    context,

    use(plugin) {
      switch (plugin.type) {
        case 'ui':
          context.viewer.use(plugin)
          break
        case 'parser':
          // @todo parser.use(plugin)
          break
        default:
          break
      }
      return editor
    },

    mount(el) {
      if (context._mounted) {
        throw new Error('The editor is alredy mounted.')
      }

      const oEl = typeof el === 'string'
        ? document.querySelector<HTMLElement>(el)
        : el

      if (!oEl) {
        throw new TypeError(`"el" expect a selector or a HTMLElement, but got "${el}".`)
      }

      context.el = oEl
      context._mounted = true
      oEl.appendChild(context.viewer.el)

      return editor
    },

    setMode(mode: EditorMode) {
      context.viewer.setMode(mode)
      return editor
    },
  }

  return editor
}
