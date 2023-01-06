import { createClassName, createElement } from './helpers/dom'
import type { EditorMode } from './renderer'

export interface MarkdanPlugin {
  type: 'ui' | 'parser'
  name: string
}

export interface MarkdanViewer {
  readonly el: HTMLElement
  readonly plugins: Map<string, MarkdanPlugin>
  readonly use: (plugin: MarkdanPlugin) => MarkdanViewer
  readonly render: () => MarkdanViewer
  readonly setMode: (mode: EditorMode) => MarkdanViewer
}

export const createViewer = (mode: EditorMode = 'wygiwys'): MarkdanViewer => {
  const el = createElement('div', {
    'class': createClassName('viewer'),
    'id': createClassName('viewer'),
    'editor-mode': mode,
    'contenteditable': true,
  })
  const plugins = new Map<string, MarkdanPlugin>()

  const viewer: MarkdanViewer = {
    el,
    plugins,

    use(plugin) {
      if (plugins.has(plugin.name)) {
        throw new Error(`Plugin "${plugin.name}" has been used.`)
      }
      return viewer
    },

    render() {
      return viewer
    },

    setMode(mode) {
      el.setAttribute('editor-mode', mode)
      return viewer
    },
  }

  return viewer
}
