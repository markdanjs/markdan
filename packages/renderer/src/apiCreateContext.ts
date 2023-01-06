import {
  type MarkdanPlugin,
  type MarkdanViewer,
  createViewer,
} from './apiViewer'
import type { RendererOptions } from './renderer'

export {
  MarkdanViewer,
  MarkdanPlugin,
}

export interface EditorContext {
  _mounted: boolean
  _options: RendererOptions
  el: HTMLElement | null
  viewer: MarkdanViewer
}

export function createContext(options: RendererOptions): EditorContext {
  const viewer = createViewer(options.mode)

  return {
    _mounted: false,
    _options: options,
    el: null,
    viewer,
  }
}
