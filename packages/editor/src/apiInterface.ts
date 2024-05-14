/*!
 * 构建编辑器界面相关
 */

import type { EditorSelectionRange, MarkdanContext } from '@markdan/core'
import { createElement } from '@markdan/helper'
import { CLASS_NAMES } from './config/dom.config'
import './style.css'
import type { EditorCursorApi } from './apiCursor'
import { createCursorApi } from './apiCursor'
import type { EditorRenderer } from './apiRenderer'
import { createRendererApi } from './apiRenderer'
import { type EditorScrollBarApi, createScrollbar } from './scrollbar'
import { type EditorLineNumberAPI, createLineNumber } from './lineNumber'

export interface EditorUI {
  markdan: HTMLElement
  toolbar: HTMLElement
  main: HTMLElement
  cursor: HTMLElement
  scrollbar: HTMLElement
  lineNumber: HTMLElement
  container: HTMLElement
  mainViewer: HTMLElement
  footer: HTMLElement
}
export interface MarkdanInterface {
  ui: EditorUI
  cursor: EditorCursorApi
  scrollbar: EditorScrollBarApi
  lineNumber: EditorLineNumberAPI
  renderer: EditorRenderer
}

export interface MarkdanInterfaceStyle {
  width: string
  height: string
  fontFamily: string
  fontSize: number
  lineHeight: number
}

export type MarkdanInterfaceTheme = 'light' | 'dark'

export interface MarkdanInterfaceOptions {
  theme: MarkdanInterfaceTheme
  style: MarkdanInterfaceStyle
  lineNumber: boolean
}

export function normalizeStyle(style: MarkdanInterfaceStyle, cw: number, ch: number) {
  let { width, height } = style

  const reg = /\d+%$/

  width = reg.test(width)
    ? `${cw * parseInt(width) / 100}px`
    : width

  height = reg.test(height)
    ? `${ch * parseInt(height) / 100}px`
    : height

  return {
    ...style,
    width,
    height,
  }
}

function initObserver(elements: Element[], callback?: (...args: any[]) => any) {
  const observer = new ResizeObserver((_entries) => {
    callback && callback()
  })

  elements.forEach((el) => {
    observer.observe(el)
  })
}

/**
 * 构建 UI 界面
 * ```markdown
 * markdan
 *  - toolbar
 *  - main
 *    - [absolute]cursor
 *    - [absolute]scrollbar
 *    - line-number
 *    - container
 *      - main-viewer
 *  - footer?
 * ```
 */
function createEditorUI(ctx: MarkdanContext): EditorUI {
  const lineNumber = createElement('aside', null)
  const cursor = createElement('div', null)
  const scrollbar = createElement('div', null)

  const mainViewer = createElement('div', { class: CLASS_NAMES.editorViewer })
  const container = createElement('div', { class: CLASS_NAMES.editorContainer }, [mainViewer])

  const toolbar = createElement('header', { class: CLASS_NAMES.editorToolbar })
  const main = createElement(
    'main',
    { class: CLASS_NAMES.editorMain },
    [cursor, scrollbar, lineNumber, container],
  )
  const footer = createElement('footer', { class: CLASS_NAMES.editorFooter })

  const markdan = createElement('div', {
    class: [CLASS_NAMES.editor, ctx.config.theme].join(' '),
  }, [toolbar, main, footer])

  markdan.style.cssText = Object.entries(ctx.config.style).reduce((acc, curr) => {
    return `${acc}--${curr[0].replace(/[A-Z]/, $1 => `-${$1.toLowerCase()}`)}: ${typeof curr[1] === 'string' ? curr[1] : `${curr[1]}px`};`
  }, '')

  const ui: EditorUI = ctx.interface.ui = {
    markdan,
    toolbar,
    main,
    cursor,
    scrollbar,
    lineNumber,
    container,
    mainViewer,
    footer,
  }

  return ui
}

function init(el: HTMLElement, ctx: MarkdanContext) {
  el.style.overflow = 'hidden'

  // 更新容器位置尺寸信息
  ctx.config.containerRect = ctx.interface.ui.container.getBoundingClientRect()
  initObserver([document.documentElement, el], () => {
    // 更新容器位置尺寸信息
    const containerRect = ctx.config.containerRect = ctx.interface.ui.container.getBoundingClientRect()

    const {
      config: {
        style,
        originalOptions,
      },
    } = ctx

    const width = originalOptions.style?.width ?? style.width
    const height = originalOptions.style?.height ?? style.height
    const newStyle = ctx.config.style = normalizeStyle({
      ...style,
      width,
      height,
    }, containerRect.width, containerRect.height)

    ctx.interface.ui.markdan.style.cssText = Object.entries(newStyle).reduce((acc, curr) => {
      return `${acc}--${curr[0].replace(/[A-Z]/, $1 => `-${$1.toLowerCase()}`)}: ${typeof curr[1] === 'string' ? curr[1] : `${curr[1]}px`};`
    }, '')
  })
  ctx.emitter.on('selection:change', (ranges: Set<EditorSelectionRange>) => {
    ctx.interface.cursor.addCursor(ranges)
    ctx.interface.lineNumber.setActive()
  })
  ctx.emitter.on('render', (blocks) => {
    ctx.interface.renderer.render(blocks)
    ctx.interface.scrollbar.update(ctx)
    ctx.interface.lineNumber.update()
  })
  ctx.emitter.on('scrollbar:change', (options) => {
    ctx.interface.renderer.onScroll(options)
    ctx.interface.cursor.onScroll()
  })

  setTimeout(() => {
    ctx.interface.ui.mainViewer.addEventListener('mousedown', (e: MouseEvent) => {
      ctx.emitter.emit('editor:mouse:down', e)
    })
    ctx.interface.ui.main.addEventListener('wheel', (e) => {
      ctx.emitter.emit('editor:scroll', e)
    })
    document.addEventListener('keydown', (e) => {
      ctx.emitter.emit('editor:keydown', e)
    })
    ctx.interface.scrollbar.update(ctx)
    ctx.interface.lineNumber.update()
  })
}

export function createEditorInterfaceApi(el: HTMLElement, ctx: MarkdanContext): MarkdanInterface {
  const ui = createEditorUI(ctx)

  const cursor = createCursorApi(ctx)
  const scrollbar = createScrollbar(ctx)
  const lineNumber = createLineNumber(ctx)

  const renderer = createRendererApi(ui.mainViewer, ctx)

  // el.appendChild(oMarkdan)
  el.appendChild(ui.markdan)

  const interfaceApi: MarkdanInterface = {
    ui,
    renderer,
    cursor,
    scrollbar,
    lineNumber,
  }

  init(el, ctx)

  ctx.interface = interfaceApi

  return interfaceApi
}
